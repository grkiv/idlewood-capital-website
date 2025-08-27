/**
 * File Upload API Endpoint
 * Secure file upload with validation, encryption, and virus scanning
 */

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';
import { getCurrentUser } from '@/lib/auth/middleware';
import { validateFile, generateProcessingRecommendations, sanitizeFilename, extractFileMetadata } from '@/lib/storage/validation';
import { encryptFileWithOptions, generateFileHash, createEncryptionMetadata } from '@/lib/storage/encryption';
import { getCachedStorageConfig, generateSecureFilename, generateFolderPath } from '@/lib/storage/config';
import { 
  FileUploadInput, 
  FileUploadResult, 
  SecureDocument,
  FileErrorCode,
  FileError 
} from '@/lib/types/files';
import { AccessAction } from '@/lib/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create file upload error response
 */
function createErrorResponse(
  code: FileErrorCode,
  message: string,
  statusCode: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    { status: statusCode }
  );
}

/**
 * Log file access for audit trail
 */
async function logFileAccess(
  documentId: string,
  userId: string,
  action: string,
  request: NextRequest,
  success: boolean = true,
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
        file_size, success, error_message, timestamp
      ) VALUES (
        ${uuidv4()}, ${documentId}, ${userId}, ${action}, ${ip}, 
        ${userAgent}, ${fileSize || null}, ${success}, ${error || null}, NOW()
      )
    `;
  } catch (logError) {
    console.error('Failed to log file access:', logError);
  }
}

/**
 * Check user storage quota
 */
async function checkStorageQuota(userId: string): Promise<{
  canUpload: boolean;
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
}> {
  try {
    const result = await sql`
      SELECT quota_bytes, used_bytes 
      FROM storage_quotas 
      WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      // Create default quota if doesn't exist
      const config = getCachedStorageConfig();
      await sql`
        INSERT INTO storage_quotas (id, user_id, quota_bytes, used_bytes, file_count)
        VALUES (${uuidv4()}, ${userId}, ${config.defaultQuotaBytes}, 0, 0)
      `;
      
      return {
        canUpload: true,
        usedBytes: 0,
        quotaBytes: config.defaultQuotaBytes,
        remainingBytes: config.defaultQuotaBytes
      };
    }

    const quota = result.rows[0];
    const remainingBytes = quota.quota_bytes - quota.used_bytes;
    
    return {
      canUpload: remainingBytes > 0,
      usedBytes: quota.used_bytes,
      quotaBytes: quota.quota_bytes,
      remainingBytes
    };
  } catch (error) {
    console.error('Storage quota check failed:', error);
    return {
      canUpload: false,
      usedBytes: 0,
      quotaBytes: 0,
      remainingBytes: 0
    };
  }
}

/**
 * Process and upload file to Vercel Blob
 */
async function processAndUploadFile(
  file: File,
  userId: string,
  options: {
    encrypt?: boolean;
    compress?: boolean;
    folderPath?: string;
  }
): Promise<{
  blobUrl: string;
  encryptionMetadata?: any;
  hash: string;
  processedSize: number;
  originalSize: number;
}> {
  const config = getCachedStorageConfig();
  
  // Read file data
  const fileBuffer = await file.arrayBuffer();
  const originalSize = fileBuffer.byteLength;
  let processedBuffer = fileBuffer;
  let encryptionMetadata: any = undefined;
  
  // Generate file hash for integrity
  const hash = await generateFileHash(fileBuffer);
  
  // Encrypt if requested and enabled
  if (options.encrypt && config.encryptionEnabled) {
    try {
      const encryptionResult = await encryptFileWithOptions(
        fileBuffer,
        options.compress || false
      );
      
      processedBuffer = encryptionResult.encryptedData;
      encryptionMetadata = createEncryptionMetadata(encryptionResult);
    } catch (error) {
      console.error('File encryption failed:', error);
      throw new Error('File encryption failed');
    }
  }
  
  // Generate secure filename and path
  const secureFilename = generateSecureFilename(file.name, userId);
  const folderPath = options.folderPath || generateFolderPath(userId);
  const blobPath = `${folderPath}/${secureFilename}`;
  
  // Upload to Vercel Blob
  try {
    const blob = await put(blobPath, processedBuffer, {
      access: 'private', // Always private for security
      contentType: file.type || 'application/octet-stream'
    });
    
    return {
      blobUrl: blob.url,
      encryptionMetadata,
      hash,
      processedSize: processedBuffer.byteLength,
      originalSize
    };
  } catch (error) {
    console.error('Blob upload failed:', error);
    throw new Error('File upload to storage failed');
  }
}

/**
 * Create document database record
 */
async function createDocumentRecord(
  file: File,
  uploadResult: {
    blobUrl: string;
    encryptionMetadata?: any;
    hash: string;
    processedSize: number;
    originalSize: number;
  },
  userId: string,
  uploadOptions: {
    user_id?: string;
    data_room_id?: string;
    folder_path?: string;
    is_public?: boolean;
    access_level?: string;
    expires_at?: Date;
    allowed_user_ids?: string[];
    watermark_text?: string;
  }
): Promise<SecureDocument> {
  const documentId = uuidv4();
  const sanitizedFilename = sanitizeFilename(file.name);
  
  const result = await sql`
    INSERT INTO documents (
      id, user_id, file_name, file_path, blob_url, file_size, original_size,
      mime_type, uploaded_by, is_public, is_encrypted, encryption_key_id,
      hash_sha256, access_level, data_room_id, folder_path, virus_scan_status,
      expires_at, allowed_user_ids, watermark_text, is_compressed, download_count
    ) VALUES (
      ${documentId},
      ${uploadOptions.user_id || userId},
      ${sanitizedFilename},
      ${uploadResult.blobUrl.split('/').pop() || sanitizedFilename},
      ${uploadResult.blobUrl},
      ${uploadResult.processedSize},
      ${uploadResult.originalSize},
      ${file.type || 'application/octet-stream'},
      ${userId},
      ${uploadOptions.is_public || false},
      ${uploadResult.encryptionMetadata?.isEncrypted || false},
      ${uploadResult.encryptionMetadata?.keyId || null},
      ${uploadResult.hash},
      ${uploadOptions.access_level || 'private'},
      ${uploadOptions.data_room_id || null},
      ${uploadOptions.folder_path || null},
      'pending',
      ${uploadOptions.expires_at || null},
      ${uploadOptions.allowed_user_ids || []},
      ${uploadOptions.watermark_text || null},
      ${uploadResult.processedSize < uploadResult.originalSize},
      0
    )
    RETURNING *
  `;

  return result.rows[0] as SecureDocument;
}

/**
 * POST /api/files/upload
 * Upload file with security measures
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return createErrorResponse(
        FileErrorCode.INVALID_FILE_TYPE,
        'No file provided'
      );
    }

    // Parse additional options
    const uploadOptions = {
      user_id: formData.get('user_id') as string || undefined,
      data_room_id: formData.get('data_room_id') as string || undefined,
      folder_path: formData.get('folder_path') as string || undefined,
      is_public: formData.get('is_public') === 'true',
      access_level: formData.get('access_level') as string || 'private',
      expires_at: formData.get('expires_at') ? new Date(formData.get('expires_at') as string) : undefined,
      allowed_user_ids: formData.get('allowed_user_ids') ? 
        JSON.parse(formData.get('allowed_user_ids') as string) : undefined,
      watermark_text: formData.get('watermark_text') as string || undefined,
      encrypt: formData.get('encrypt') === 'true',
      compress: formData.get('compress') === 'true'
    };

    // Check storage quota
    const quotaCheck = await checkStorageQuota(user.id);
    if (!quotaCheck.canUpload || quotaCheck.remainingBytes < file.size) {
      return createErrorResponse(
        FileErrorCode.QUOTA_EXCEEDED,
        'Storage quota exceeded',
        413,
        {
          usedBytes: quotaCheck.usedBytes,
          quotaBytes: quotaCheck.quotaBytes,
          remainingBytes: quotaCheck.remainingBytes,
          fileSize: file.size
        }
      );
    }

    // Validate file
    const validation = await validateFile(file, user.id, quotaCheck.usedBytes);
    if (!validation.valid) {
      await logFileAccess('', user.id, 'upload', request, false, validation.errors.join(', '), file.size);
      
      return createErrorResponse(
        FileErrorCode.INVALID_FILE_TYPE,
        'File validation failed',
        400,
        {
          errors: validation.errors,
          warnings: validation.warnings
        }
      );
    }

    // Generate processing recommendations
    const processingOptions = generateProcessingRecommendations(file, validation);
    
    // Override with user preferences
    const finalProcessingOptions = {
      encrypt: uploadOptions.encrypt ?? processingOptions.encryption?.enabled ?? false,
      compress: uploadOptions.compress ?? processingOptions.compression?.enabled ?? false,
      folderPath: uploadOptions.folder_path || 
                  (uploadOptions.data_room_id ? 
                   generateFolderPath(user.id, uploadOptions.data_room_id) : 
                   generateFolderPath(user.id))
    };

    // Process and upload file
    const uploadResult = await processAndUploadFile(file, user.id, finalProcessingOptions);

    // Create database record
    const document = await createDocumentRecord(
      file, 
      uploadResult, 
      user.id, 
      uploadOptions
    );

    // Log successful upload
    await logFileAccess(
      document.id, 
      user.id, 
      'upload', 
      request, 
      true, 
      undefined, 
      uploadResult.originalSize
    );

    // Prepare response
    const result: FileUploadResult = {
      success: true,
      document,
      warnings: validation.warnings
    };

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('File upload error:', error);
    
    // Determine error type and response
    if (error.message.includes('quota')) {
      return createErrorResponse(
        FileErrorCode.QUOTA_EXCEEDED,
        error.message,
        413
      );
    } else if (error.message.includes('encryption')) {
      return createErrorResponse(
        FileErrorCode.ENCRYPTION_FAILED,
        error.message,
        500
      );
    } else if (error.message.includes('upload') || error.message.includes('blob')) {
      return createErrorResponse(
        FileErrorCode.UPLOAD_FAILED,
        error.message,
        500
      );
    } else {
      return createErrorResponse(
        FileErrorCode.PROCESSING_FAILED,
        'File upload failed due to internal error',
        500
      );
    }
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}