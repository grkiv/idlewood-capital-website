/**
 * Admin User File Management API
 * Manage files for specific users (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getCurrentUser } from '@/lib/auth/middleware';
import { fileManager } from '@/lib/storage/file-manager';
import { isAdmin } from '@/lib/auth/service';
import { FileErrorCode } from '@/lib/types/files';

/**
 * GET /api/files/admin/users/[userId]
 * Get all files for a specific user (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  const { userId } = params;

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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sort_by = url.searchParams.get('sort_by') || 'date';
    const sort_order = url.searchParams.get('sort_order') || 'desc';

    // Search user files
    const searchResult = await fileManager.searchFiles({
      user_id: userId,
      sort_by: sort_by as any,
      sort_order: sort_order as any,
      page,
      limit
    });

    // Get user info
    const userResult = await sql`
      SELECT id, email, company_name, created_at
      FROM users 
      WHERE id = ${userId}
    `;

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.FILE_NOT_FOUND,
            message: 'User not found'
          }
        },
        { status: 404 }
      );
    }

    // Get storage quota info
    const quotaResult = await sql`
      SELECT quota_bytes, used_bytes, file_count, max_file_size
      FROM storage_quotas
      WHERE user_id = ${userId}
    `;

    const quota = quotaResult.rows[0] || {
      quota_bytes: 0,
      used_bytes: 0,
      file_count: 0,
      max_file_size: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        user: userResult.rows[0],
        files: searchResult,
        quota: {
          ...quota,
          usage_percentage: quota.quota_bytes > 0 ? 
            Math.round((quota.used_bytes / quota.quota_bytes) * 100) : 0,
          remaining_bytes: Math.max(0, quota.quota_bytes - quota.used_bytes)
        }
      }
    });

  } catch (error: any) {
    console.error('Admin user files error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to retrieve user files'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/admin/users/[userId]
 * Delete all files for a user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  const { userId } = params;

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

    // Get all user files
    const filesResult = await sql`
      SELECT id FROM documents 
      WHERE uploaded_by = ${userId} OR user_id = ${userId}
    `;

    const fileIds = filesResult.rows.map(row => row.id);

    if (fileIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          deleted_count: 0,
          message: 'No files found for user'
        }
      });
    }

    // Perform bulk delete
    const bulkResult = await fileManager.bulkOperation({
      document_ids: fileIds,
      operation: 'delete'
    }, user.id);

    // Log the admin action
    await sql`
      INSERT INTO access_logs (id, user_id, action, timestamp, additional_data)
      VALUES (
        gen_random_uuid(), ${user.id}, 'bulk_user_delete', NOW(),
        ${JSON.stringify({ 
          target_user: userId, 
          file_count: fileIds.length,
          successful: bulkResult.summary.successful 
        })}
      )
    `;

    return NextResponse.json({
      success: true,
      data: {
        deleted_count: bulkResult.summary.successful,
        failed_count: bulkResult.summary.failed,
        details: bulkResult.results
      }
    });

  } catch (error: any) {
    console.error('Admin user delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to delete user files'
        }
      },
      { status: 500 }
    );
  }
}