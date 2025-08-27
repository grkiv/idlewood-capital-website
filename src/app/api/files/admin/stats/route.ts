/**
 * Admin File Statistics API Endpoint
 * Comprehensive file statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { fileManager } from '@/lib/storage/file-manager';
import { isAdmin } from '@/lib/auth/service';
import { FileErrorCode } from '@/lib/types/files';

/**
 * GET /api/files/admin/stats
 * Get comprehensive file statistics for admin dashboard
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

    // Get comprehensive statistics
    const stats = await fileManager.getFileStatistics();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to retrieve statistics'
        }
      },
      { status: 500 }
    );
  }
}