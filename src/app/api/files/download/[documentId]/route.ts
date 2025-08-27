/**
 * File Download API Endpoint
 * Secure file download with access control and audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getCurrentUser } from '@/lib/auth/middleware';
import { checkFilePermission, FilePermission } from '@/lib/storage/permissions';
import { decryptFileData, extractDecryptionParams } from '@/lib/storage/encryption';
import { FileErrorCode } from '@/lib/types/files';
import { v4 as uuidv4 } from 'uuid';

/**
 * Log file download access
 */
async function logFileDownload(
  documentId: string,
  userId: string,
  request: NextRequest,
  success: boolean,
  fileSize?: number,
  error?: string
): Promise<void> {
  try {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    await sql`
      INSERT INTO file_access_logs (
        id, document_id, user_id, action, ip_address, user_agent, 
        file_size, success, error_message, timestamp
      ) VALUES (
        ${uuidv4()}, ${documentId}, ${userId}, 'download', ${ip}, 
        ${userAgent}, ${fileSize || null}, ${success}, ${error || null}, NOW()
      )
    `;

    // Also log to main access logs
    await sql`
      INSERT INTO access_logs (id, user_id, document_id, action, ip_address, user_agent, timestamp)
      VALUES (${uuidv4()}, ${userId}, ${documentId}, 'document_download', ${ip}, ${userAgent}, NOW())
    `;

  } catch (logError) {
    console.error('Failed to log file download:', logError);
  }
}

/**
 * Update download count
 */
async function updateDownloadCount(documentId: string): Promise<void> {
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

/**
 * Get document with security checks
 */
async function getSecureDocument(documentId: string) {
  const result = await sql`
    SELECT 
      d.*,
      u.email as uploader_email,
      u.company_name as uploader_company
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.id = ${documentId}
  `;

  if (result.rows.length === 0) {
    throw new Error('Document not found');
  }

  const document = result.rows[0];

  // Check if document has expired
  if (document.expires_at && new Date(document.expires_at) < new Date()) {
    throw new Error('Document has expired');
  }

  // Check virus scan status
  if (document.virus_scan_status === 'infected') {
    throw new Error('Document is infected and cannot be downloaded');
  }

  if (document.virus_scan_status === 'pending') {
    throw new Error('Document is still being scanned for viruses');
  }

  return document;
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
 * GET /api/files/download/[documentId]
 * Download file with security checks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
): Promise<NextResponse> {
  const { documentId } = params;
  let document: any = null;

  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return createErrorResponse(
        FileErrorCode.ACCESS_DENIED,
        'Authentication required',
        401
      );
    }

    // Get document with security checks
    try {
      document = await getSecureDocument(documentId);
    } catch (error: any) {
      await logFileDownload(documentId, user.id, request, false, undefined, error.message);
      
      if (error.message.includes('not found')) {
        return createErrorResponse(FileErrorCode.FILE_NOT_FOUND, error.message, 404);
      } else if (error.message.includes('expired')) {
        return createErrorResponse(FileErrorCode.EXPIRED_URL, error.message, 410);
      } else if (error.message.includes('infected') || error.message.includes('scanned')) {
        return createErrorResponse(FileErrorCode.VIRUS_DETECTED, error.message, 423);
      } else {
        return createErrorResponse(FileErrorCode.PROCESSING_FAILED, error.message, 500);
      }
    }

    // Check permissions
    const permissionCheck = await checkFilePermission(documentId, user.id, FilePermission.DOWNLOAD);
    if (!permissionCheck.allowed) {
      await logFileDownload(documentId, user.id, request, false, document.file_size, 'Access denied');
      return createErrorResponse(
        FileErrorCode.ACCESS_DENIED,
        permissionCheck.reason || 'Access denied',
        403
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const inline = url.searchParams.get('inline') === 'true';
    const watermark = url.searchParams.get('watermark') === 'true';

    // Fetch file from Vercel Blob
    if (!document.blob_url) {
      await logFileDownload(documentId, user.id, request, false, document.file_size, 'Blob URL not found');
      return createErrorResponse(
        FileErrorCode.FILE_NOT_FOUND,
        'File storage location not found',
        404
      );
    }

    let fileResponse: Response;
    try {
      fileResponse = await fetch(document.blob_url);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
      }
    } catch (error: any) {
      await logFileDownload(documentId, user.id, request, false, document.file_size, error.message);
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
          algorithm: 'AES-256-GCM', // Default algorithm
          iv: document.encryption_iv,
          authTag: document.encryption_auth_tag
        };

        const decryptionParams = extractDecryptionParams(encryptionMetadata);
        if (decryptionParams) {
          fileBuffer = await decryptFileData(fileBuffer, decryptionParams);
        }
      } catch (error: any) {
        console.error('File decryption failed:', error);
        await logFileDownload(documentId, user.id, request, false, document.file_size, 'Decryption failed');
        return createErrorResponse(
          FileErrorCode.PROCESSING_FAILED,
          'Failed to decrypt file',
          500
        );
      }
    }

    // Apply watermark if requested (simplified implementation)
    if (watermark && document.watermark_text) {
      // In a full implementation, you would overlay the watermark text on the file
      // This is a placeholder for watermark functionality
      console.log('Watermark requested:', document.watermark_text);
    }

    // Update download statistics
    await Promise.all([
      updateDownloadCount(documentId),
      logFileDownload(documentId, user.id, request, true, fileBuffer.byteLength)
    ]);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', document.mime_type || 'application/octet-stream');
    headers.set('Content-Length', fileBuffer.byteLength.toString());
    
    // Set content disposition
    const disposition = inline ? 'inline' : 'attachment';
    const filename = encodeURIComponent(document.file_name);
    headers.set('Content-Disposition', `${disposition}; filename*=UTF-8''${filename}`);

    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // Add custom headers for tracking
    headers.set('X-Document-ID', documentId);
    headers.set('X-Download-Count', document.download_count.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error('File download error:', error);
    
    if (document) {
      await logFileDownload(documentId, user?.id || '', request, false, document.file_size, error.message);
    }

    return createErrorResponse(
      FileErrorCode.PROCESSING_FAILED,
      'Internal server error during file download',
      500
    );
  }
}

/**
 * HEAD /api/files/download/[documentId]
 * Get file metadata without downloading
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { documentId: string } }
): Promise<NextResponse> {
  const { documentId } = params;

  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    // Get document
    const document = await getSecureDocument(documentId);

    // Check permissions
    const permissionCheck = await checkFilePermission(documentId, user.id, FilePermission.READ);
    if (!permissionCheck.allowed) {
      return new NextResponse(null, { status: 403 });
    }

    // Return headers without body
    const headers = new Headers();
    headers.set('Content-Type', document.mime_type || 'application/octet-stream');
    headers.set('Content-Length', document.file_size.toString());
    headers.set('Last-Modified', new Date(document.uploaded_at).toUTCString());
    headers.set('X-Document-ID', documentId);
    headers.set('X-Encrypted', document.is_encrypted ? 'true' : 'false');
    headers.set('X-Access-Level', document.access_level);

    return new NextResponse(null, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('File HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}