/**
 * Individual File Management API Endpoint
 * CRUD operations for individual files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { fileManager } from '@/lib/storage/file-manager';
import { checkFilePermission, FilePermission, updateDocumentAccess } from '@/lib/storage/permissions';
import { FileErrorCode, FileMetadata } from '@/lib/types/files';
import { FileAccessLevel } from '@/lib/storage/config';

/**
 * GET /api/files/[documentId]
 * Get file metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
): Promise<NextResponse> {
  const { documentId } = params;

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

    // Get file metadata
    const metadata = await fileManager.getFileMetadata(documentId, user.id);
    
    if (!metadata) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.FILE_NOT_FOUND,
            message: 'File not found or access denied'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metadata
    });

  } catch (error: any) {
    console.error('File metadata error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to retrieve file metadata'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/files/[documentId]
 * Update file metadata and access settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { documentId: string } }
): Promise<NextResponse> {
  const { documentId } = params;

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
    const permission = await checkFilePermission(documentId, user.id, FilePermission.ADMIN);
    if (!permission.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.ACCESS_DENIED,
            message: 'Admin permissions required to update file'
          }
        },
        { status: 403 }
      );
    }

    // Parse update data
    const updates = await request.json();
    const {
      is_public,
      access_level,
      allowed_user_ids,
      allowed_role_types,
      expires_at,
      folder_path,
      watermark_text
    } = updates;

    // Validate access level
    if (access_level && !Object.values(FileAccessLevel).includes(access_level)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: `Invalid access level: ${access_level}`
          }
        },
        { status: 400 }
      );
    }

    // Validate expiration date
    if (expires_at && new Date(expires_at) <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'Expiration date must be in the future'
          }
        },
        { status: 400 }
      );
    }

    // Update document access settings
    const success = await updateDocumentAccess(
      documentId,
      {
        is_public,
        access_level,
        allowed_user_ids,
        allowed_role_types,
        expires_at: expires_at ? new Date(expires_at) : undefined
      },
      user.id
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.PROCESSING_FAILED,
            message: 'Failed to update file settings'
          }
        },
        { status: 500 }
      );
    }

    // Get updated metadata
    const updatedMetadata = await fileManager.getFileMetadata(documentId, user.id);

    return NextResponse.json({
      success: true,
      data: updatedMetadata
    });

  } catch (error: any) {
    console.error('File update error:', error);
    
    if (error.message.includes('permission')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.ACCESS_DENIED,
            message: error.message
          }
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to update file'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[documentId]
 * Delete a file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
): Promise<NextResponse> {
  const { documentId } = params;

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

    // Delete file
    const success = await fileManager.deleteFile(documentId, user.id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.FILE_NOT_FOUND,
            message: 'File not found or insufficient permissions'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'File deleted successfully',
        document_id: documentId
      }
    });

  } catch (error: any) {
    console.error('File deletion error:', error);
    
    if (error.message.includes('permission')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.ACCESS_DENIED,
            message: error.message
          }
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to delete file'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/files/[documentId]
 * Move file to different location
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { documentId: string } }
): Promise<NextResponse> {
  const { documentId } = params;

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

    // Parse move data
    const { folder_path, data_room_id } = await request.json();

    if (!folder_path && !data_room_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'Either folder_path or data_room_id must be provided'
          }
        },
        { status: 400 }
      );
    }

    // Move file
    const success = await fileManager.moveFile(
      documentId,
      user.id,
      {
        folder_path,
        data_room_id
      }
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.FILE_NOT_FOUND,
            message: 'File not found or insufficient permissions'
          }
        },
        { status: 404 }
      );
    }

    // Get updated metadata
    const updatedMetadata = await fileManager.getFileMetadata(documentId, user.id);

    return NextResponse.json({
      success: true,
      data: updatedMetadata
    });

  } catch (error: any) {
    console.error('File move error:', error);
    
    if (error.message.includes('permission')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.ACCESS_DENIED,
            message: error.message
          }
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to move file'
        }
      },
      { status: 500 }
    );
  }
}