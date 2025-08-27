/**
 * File Share API Endpoint
 * Create secure sharing links for files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { fileManager } from '@/lib/storage/file-manager';
import { FileErrorCode } from '@/lib/types/files';

/**
 * POST /api/files/share/[documentId]
 * Create a share link for a file
 */
export async function POST(
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

    // Parse request body
    const body = await request.json();
    const {
      expires_in_hours = 24,
      max_downloads = 10,
      password = null
    } = body;

    // Validate parameters
    if (expires_in_hours < 1 || expires_in_hours > 168) { // Max 1 week
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'expires_in_hours must be between 1 and 168 hours'
          }
        },
        { status: 400 }
      );
    }

    if (max_downloads < 1 || max_downloads > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'max_downloads must be between 1 and 1000'
          }
        },
        { status: 400 }
      );
    }

    // Create share link
    const shareUrl = await fileManager.createShareLink(documentId, user.id, {
      expires_in_hours,
      max_downloads,
      password
    });

    return NextResponse.json({
      success: true,
      data: {
        shareUrl,
        expires_in_hours,
        max_downloads,
        created_by: user.email
      }
    });

  } catch (error: any) {
    console.error('File share error:', error);
    
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

    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.FILE_NOT_FOUND,
            message: 'File not found'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to create share link'
        }
      },
      { status: 500 }
    );
  }
}