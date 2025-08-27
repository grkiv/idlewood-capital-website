/**
 * Signed URL Access API Endpoint
 * Secure file access via temporary signed URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { validateSignedUrl } from '@/lib/storage/signed-urls';
import { decryptFileData, extractDecryptionParams } from '@/lib/storage/encryption';
import { FileErrorCode } from '@/lib/types/files';
import { v4 as uuidv4 } from 'uuid';

/**
 * Log signed URL access
 */
async function logSignedUrlAccess(
  token: string,
  documentId: string,
  request: NextRequest,
  success: boolean,
  error?: string,
  fileSize?: number
): Promise<void> {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    await sql`
      INSERT INTO file_access_logs (
        id, document_id, user_id, action, ip_address, user_agent, 
        file_size, success, error_message, additional_metadata, timestamp
      ) VALUES (
        ${uuidv4()}, ${documentId}, NULL, 'download', ${ip}, 
        ${userAgent}, ${fileSize || null}, ${success}, ${error || null},
        ${JSON.stringify({ access_method: 'signed_url', token_prefix: token.substring(0, 8) })},
        NOW()
      )
    `;

  } catch (logError) {
    console.error('Failed to log signed URL access:', logError);
  }
}

/**
 * Create error response
 */
function createErrorResponse(
  code: FileErrorCode,
  message: string,
  statusCode: number = 400
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message
      }
    },
    { status: statusCode }
  );
}

/**
 * GET /api/files/access/[token]
 * Access file via signed URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  const { token } = params;
  let documentId = '';

  try {
    // Get client IP for validation
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Validate signed URL
    const validation = await validateSignedUrl(token, ip, userAgent);
    
    if (!validation.valid || !validation.document_id) {
      return createErrorResponse(
        FileErrorCode.INVALID_TOKEN,
        validation.error || 'Invalid access token',
        validation.error?.includes('expired') ? 410 : 401
      );
    }

    documentId = validation.document_id;

    // Get document details
    const documentResult = await sql`
      SELECT * FROM documents WHERE id = ${documentId}
    `;

    if (documentResult.rows.length === 0) {
      await logSignedUrlAccess(token, documentId, request, false, 'Document not found');
      return createErrorResponse(FileErrorCode.FILE_NOT_FOUND, 'Document not found', 404);
    }

    const document = documentResult.rows[0];

    // Additional security checks
    if (document.expires_at && new Date(document.expires_at) < new Date()) {
      await logSignedUrlAccess(token, documentId, request, false, 'Document expired');
      return createErrorResponse(FileErrorCode.EXPIRED_URL, 'Document has expired', 410);
    }

    if (document.virus_scan_status === 'infected') {
      await logSignedUrlAccess(token, documentId, request, false, 'Document infected');
      return createErrorResponse(FileErrorCode.VIRUS_DETECTED, 'Document is infected', 423);
    }

    if (document.virus_scan_status === 'pending') {
      await logSignedUrlAccess(token, documentId, request, false, 'Virus scan pending');
      return createErrorResponse(FileErrorCode.PROCESSING_FAILED, 'Document is being scanned', 423);
    }

    // Fetch file from Vercel Blob
    if (!document.blob_url) {
      await logSignedUrlAccess(token, documentId, request, false, 'Blob URL not found');
      return createErrorResponse(FileErrorCode.FILE_NOT_FOUND, 'File storage location not found', 404);
    }

    let fileResponse: Response;
    try {
      fileResponse = await fetch(document.blob_url);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
      }
    } catch (error: any) {
      await logSignedUrlAccess(token, documentId, request, false, error.message);
      return createErrorResponse(
        FileErrorCode.PROCESSING_FAILED,
        'Failed to retrieve file from storage',
        500
      );
    }

    let fileBuffer = await fileResponse.arrayBuffer();
    
    // Decrypt if file is encrypted
    if (document.is_encrypted && document.encryption_key_id) {
      try {
        const encryptionMetadata = {
          isEncrypted: document.is_encrypted,
          keyId: document.encryption_key_id,
          algorithm: 'AES-256-GCM',
          iv: document.encryption_iv,
          authTag: document.encryption_auth_tag
        };

        const decryptionParams = extractDecryptionParams(encryptionMetadata);
        if (decryptionParams) {
          fileBuffer = await decryptFileData(fileBuffer, decryptionParams);
        }
      } catch (error: any) {
        console.error('File decryption failed:', error);
        await logSignedUrlAccess(token, documentId, request, false, 'Decryption failed');
        return createErrorResponse(
          FileErrorCode.PROCESSING_FAILED,
          'Failed to decrypt file',
          500
        );
      }
    }

    // Parse query parameters
    const url = new URL(request.url);
    const inline = url.searchParams.get('inline') === 'true';
    const action = validation.action || 'download';

    // Update download count for download actions
    if (action === 'download') {
      try {
        await sql`
          UPDATE documents 
          SET download_count = download_count + 1, last_accessed_at = NOW()
          WHERE id = ${documentId}
        `;
      } catch (error) {
        console.error('Failed to update download count:', error);
      }
    }

    // Log successful access
    await logSignedUrlAccess(token, documentId, request, true, undefined, fileBuffer.byteLength);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', document.mime_type || 'application/octet-stream');
    headers.set('Content-Length', fileBuffer.byteLength.toString());
    
    // Set content disposition based on action and inline parameter
    let disposition = 'attachment';
    if (action === 'preview' || inline) {
      disposition = 'inline';
    }
    
    const filename = encodeURIComponent(document.file_name);
    headers.set('Content-Disposition', `${disposition}; filename*=UTF-8''${filename}`);

    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', action === 'preview' ? 'SAMEORIGIN' : 'DENY');
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // Add tracking headers
    headers.set('X-Document-ID', documentId);
    headers.set('X-Access-Method', 'signed-url');
    headers.set('X-Uses-Remaining', (validation.uses_remaining || 0).toString());

    // Special handling for different actions
    if (action === 'thumbnail' && document.thumbnail_url) {
      // Redirect to thumbnail URL if available
      return NextResponse.redirect(document.thumbnail_url);
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error('Signed URL access error:', error);
    
    if (documentId) {
      await logSignedUrlAccess(token, documentId, request, false, error.message);
    }

    return createErrorResponse(
      FileErrorCode.PROCESSING_FAILED,
      'Internal server error during file access',
      500
    );
  }
}

/**
 * HEAD /api/files/access/[token]
 * Get file metadata via signed URL without downloading
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  const { token } = params;

  try {
    // Get client IP for validation
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Validate signed URL (but don't increment usage for HEAD requests)
    const validation = await validateSignedUrl(token, ip, userAgent);
    
    if (!validation.valid || !validation.document_id) {
      return new NextResponse(null, { 
        status: validation.error?.includes('expired') ? 410 : 401 
      });
    }

    // Get document details
    const documentResult = await sql`
      SELECT * FROM documents WHERE id = ${validation.document_id}
    `;

    if (documentResult.rows.length === 0) {
      return new NextResponse(null, { status: 404 });
    }

    const document = documentResult.rows[0];

    // Security checks
    if (document.expires_at && new Date(document.expires_at) < new Date()) {
      return new NextResponse(null, { status: 410 });
    }

    if (document.virus_scan_status === 'infected' || document.virus_scan_status === 'pending') {
      return new NextResponse(null, { status: 423 });
    }

    // Return headers without body
    const headers = new Headers();
    headers.set('Content-Type', document.mime_type || 'application/octet-stream');
    headers.set('Content-Length', document.file_size.toString());
    headers.set('Last-Modified', new Date(document.uploaded_at).toUTCString());
    headers.set('X-Document-ID', validation.document_id);
    headers.set('X-Encrypted', document.is_encrypted ? 'true' : 'false');
    headers.set('X-Access-Level', document.access_level);
    headers.set('X-Access-Method', 'signed-url');
    headers.set('X-Uses-Remaining', (validation.uses_remaining || 0).toString());

    return new NextResponse(null, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Signed URL HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}