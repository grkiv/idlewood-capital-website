/**
 * Admin Bulk File Operations API
 * Bulk operations on multiple files (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getCurrentUser } from '@/lib/auth/middleware';
import { fileManager } from '@/lib/storage/file-manager';
import { isAdmin } from '@/lib/auth/service';
import { BulkFileOperation, FileErrorCode } from '@/lib/types/files';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/files/admin/bulk
 * Perform bulk operations on files (admin only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.ACCESS_DENIED,
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Check admin permissions
    if (!isAdmin(user)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.ACCESS_DENIED,
            message: 'Admin access required'
          }
        },
        { status: 403 }
      );
    }

    // Parse request body
    const operation: BulkFileOperation = await request.json();

    // Validate operation
    if (!operation.document_ids || operation.document_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'No document IDs provided'
          }
        },
        { status: 400 }
      );
    }

    if (!['delete', 'move', 'change_access', 'encrypt', 'decrypt'].includes(operation.operation)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'Invalid operation type'
          }
        },
        { status: 400 }
      );
    }

    // Validate document access (ensure all documents exist and can be accessed)
    const documentsResult = await sql`
      SELECT id, file_name, uploaded_by
      FROM documents
      WHERE id = ANY(${operation.document_ids})
    `;

    const foundDocuments = documentsResult.rows;
    const missingDocuments = operation.document_ids.filter(
      id => !foundDocuments.some(doc => doc.id === id)
    );

    if (missingDocuments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.FILE_NOT_FOUND,
            message: `Documents not found: ${missingDocuments.join(', ')}`
          }
        },
        { status: 404 }
      );
    }

    // Perform bulk operation
    const result = await fileManager.bulkOperation(operation, user.id);

    // Log the admin bulk operation
    await sql`
      INSERT INTO access_logs (id, user_id, action, timestamp, additional_data)
      VALUES (
        ${uuidv4()}, ${user.id}, 'admin_bulk_operation', NOW(),
        ${JSON.stringify({
          operation: operation.operation,
          document_count: operation.document_ids.length,
          successful: result.summary.successful,
          failed: result.summary.failed,
          parameters: operation.parameters
        })}
      )
    `;

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Admin bulk operation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Bulk operation failed'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/files/admin/bulk/preview
 * Preview bulk operation effects without executing (admin only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.ACCESS_DENIED,
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Check admin permissions
    if (!isAdmin(user)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.ACCESS_DENIED,
            message: 'Admin access required'
          }
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const documentIds = url.searchParams.get('document_ids')?.split(',') || [];
    const operation = url.searchParams.get('operation');

    if (documentIds.length === 0 || !operation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'Document IDs and operation are required'
          }
        },
        { status: 400 }
      );
    }

    // Get document details for preview
    const documentsResult = await sql`
      SELECT 
        d.id,
        d.file_name,
        d.file_size,
        d.access_level,
        d.is_encrypted,
        d.folder_path,
        d.data_room_id,
        u.email as owner_email
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ANY(${documentIds})
      ORDER BY d.file_name
    `;

    const documents = documentsResult.rows;
    
    // Calculate preview stats
    const totalSize = documents.reduce((sum, doc) => sum + doc.file_size, 0);
    const accessLevels = [...new Set(documents.map(doc => doc.access_level))];
    const owners = [...new Set(documents.map(doc => doc.owner_email))].filter(Boolean);
    const encryptedCount = documents.filter(doc => doc.is_encrypted).length;
    
    // Generate operation-specific preview
    let operationPreview: any = {};
    
    switch (operation) {
      case 'delete':
        operationPreview = {
          will_delete: documents.length,
          total_size_freed: totalSize,
          affected_owners: owners
        };
        break;
        
      case 'change_access':
        operationPreview = {
          current_access_levels: accessLevels,
          affected_documents: documents.length
        };
        break;
        
      case 'encrypt':
        operationPreview = {
          unencrypted_count: documents.length - encryptedCount,
          already_encrypted: encryptedCount,
          estimated_size_increase: (documents.length - encryptedCount) * 0.1 // ~10% overhead
        };
        break;
        
      case 'decrypt':
        operationPreview = {
          encrypted_count: encryptedCount,
          not_encrypted: documents.length - encryptedCount
        };
        break;
    }

    return NextResponse.json({
      success: true,
      data: {
        operation,
        document_count: documents.length,
        total_size: totalSize,
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.file_name,
          size: doc.file_size,
          access_level: doc.access_level,
          is_encrypted: doc.is_encrypted,
          owner_email: doc.owner_email
        })),
        preview: operationPreview,
        warnings: generateOperationWarnings(operation, documents)
      }
    });

  } catch (error: any) {
    console.error('Bulk operation preview error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to generate preview'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Generate warnings for bulk operations
 */
function generateOperationWarnings(operation: string, documents: any[]): string[] {
  const warnings: string[] = [];
  
  switch (operation) {
    case 'delete':
      warnings.push('This action cannot be undone');
      if (documents.some(doc => doc.access_level === 'confidential')) {
        warnings.push('Some files are marked as confidential');
      }
      break;
      
    case 'change_access':
      const hasConfidential = documents.some(doc => doc.access_level === 'confidential');
      if (hasConfidential) {
        warnings.push('Changing access level for confidential documents');
      }
      break;
      
    case 'encrypt':
      const largeFiles = documents.filter(doc => doc.file_size > 50 * 1024 * 1024);
      if (largeFiles.length > 0) {
        warnings.push(`${largeFiles.length} large files may take longer to encrypt`);
      }
      break;
      
    case 'decrypt':
      warnings.push('Decrypted files will be less secure');
      break;
  }
  
  if (documents.length > 100) {
    warnings.push('Large bulk operation may take significant time to complete');
  }
  
  return warnings;
}