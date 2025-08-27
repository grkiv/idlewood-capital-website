/**
 * Storage Quota API Endpoint
 * Manage and monitor storage quotas
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getCurrentUser } from '@/lib/auth/middleware';
import { isAdmin } from '@/lib/auth/service';
import { FileErrorCode, StorageQuota } from '@/lib/types/files';
import { getCachedStorageConfig } from '@/lib/storage/config';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/files/quota
 * Get current user's storage quota and usage
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

    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    
    // Check if requesting another user's quota (admin only)
    const targetUserId = userId && isAdmin(user) ? userId : user.id;

    // Get or create quota record
    let quotaResult = await sql`
      SELECT * FROM storage_quotas WHERE user_id = ${targetUserId}
    `;

    if (quotaResult.rows.length === 0) {
      // Create default quota
      const config = getCachedStorageConfig();
      const quotaId = uuidv4();
      
      await sql`
        INSERT INTO storage_quotas (
          id, user_id, quota_bytes, used_bytes, file_count, max_file_size, created_at
        ) VALUES (
          ${quotaId}, ${targetUserId}, ${config.defaultQuotaBytes}, 
          0, 0, ${config.maxFileSize}, NOW()
        )
      `;

      quotaResult = await sql`
        SELECT * FROM storage_quotas WHERE user_id = ${targetUserId}
      `;
    }

    const quota = quotaResult.rows[0];
    const usagePercentage = quota.quota_bytes > 0 ? 
      Math.round((quota.used_bytes / quota.quota_bytes) * 100) : 0;
    const remainingBytes = Math.max(0, quota.quota_bytes - quota.used_bytes);

    const response: StorageQuota = {
      id: quota.id,
      user_id: quota.user_id,
      quota_bytes: quota.quota_bytes,
      used_bytes: quota.used_bytes,
      file_count: quota.file_count,
      max_file_size: quota.max_file_size,
      allowed_mime_types: quota.allowed_mime_types,
      created_at: quota.created_at,
      updated_at: quota.updated_at,
      usage_percentage: usagePercentage,
      remaining_bytes: remainingBytes,
      is_over_quota: quota.used_bytes > quota.quota_bytes
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error: any) {
    console.error('Quota retrieval error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to retrieve storage quota'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/files/quota
 * Update storage quota (admin only)
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
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
    const updates = await request.json();
    const {
      user_id,
      quota_bytes,
      max_file_size,
      allowed_mime_types
    } = updates;

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'user_id is required'
          }
        },
        { status: 400 }
      );
    }

    // Validate quota values
    if (quota_bytes !== undefined && quota_bytes < 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'quota_bytes must be non-negative'
          }
        },
        { status: 400 }
      );
    }

    if (max_file_size !== undefined && max_file_size < 1024) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'max_file_size must be at least 1KB'
          }
        },
        { status: 400 }
      );
    }

    // Build update query
    const setParts: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (quota_bytes !== undefined) {
      setParts.push(`quota_bytes = $${valueIndex++}`);
      values.push(quota_bytes);
    }

    if (max_file_size !== undefined) {
      setParts.push(`max_file_size = $${valueIndex++}`);
      values.push(max_file_size);
    }

    if (allowed_mime_types !== undefined) {
      setParts.push(`allowed_mime_types = $${valueIndex++}`);
      values.push(allowed_mime_types);
    }

    if (setParts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'No valid updates provided'
          }
        },
        { status: 400 }
      );
    }

    values.push(user_id);
    const query = `
      UPDATE storage_quotas 
      SET ${setParts.join(', ')}, updated_at = NOW()
      WHERE user_id = $${valueIndex}
      RETURNING *
    `;

    const result = await sql.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.FILE_NOT_FOUND,
            message: 'Storage quota not found for user'
          }
        },
        { status: 404 }
      );
    }

    // Log the quota change
    await sql`
      INSERT INTO access_logs (id, user_id, action, timestamp, additional_data)
      VALUES (
        ${uuidv4()}, ${user.id}, 'quota_update', NOW(),
        ${JSON.stringify({ target_user: user_id, updates })}
      )
    `;

    const updatedQuota = result.rows[0];
    const usagePercentage = updatedQuota.quota_bytes > 0 ? 
      Math.round((updatedQuota.used_bytes / updatedQuota.quota_bytes) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...updatedQuota,
        usage_percentage: usagePercentage,
        remaining_bytes: Math.max(0, updatedQuota.quota_bytes - updatedQuota.used_bytes),
        is_over_quota: updatedQuota.used_bytes > updatedQuota.quota_bytes
      }
    });

  } catch (error: any) {
    console.error('Quota update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to update storage quota'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/files/quota/all
 * Get all users' quotas (admin only)
 */
export async function GET_ALL(request: NextRequest): Promise<NextResponse> {
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

    // Get all quotas with user information
    const result = await sql`
      SELECT 
        sq.*,
        u.email,
        u.company_name,
        u.role
      FROM storage_quotas sq
      LEFT JOIN users u ON sq.user_id = u.id
      ORDER BY sq.used_bytes DESC
    `;

    const quotas = result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      user_email: row.email,
      user_company: row.company_name,
      user_role: row.role,
      quota_bytes: row.quota_bytes,
      used_bytes: row.used_bytes,
      file_count: row.file_count,
      max_file_size: row.max_file_size,
      allowed_mime_types: row.allowed_mime_types,
      created_at: row.created_at,
      updated_at: row.updated_at,
      usage_percentage: row.quota_bytes > 0 ? 
        Math.round((row.used_bytes / row.quota_bytes) * 100) : 0,
      remaining_bytes: Math.max(0, row.quota_bytes - row.used_bytes),
      is_over_quota: row.used_bytes > row.quota_bytes
    }));

    return NextResponse.json({
      success: true,
      data: {
        quotas,
        summary: {
          total_users: quotas.length,
          total_quota: quotas.reduce((sum, q) => sum + q.quota_bytes, 0),
          total_used: quotas.reduce((sum, q) => sum + q.used_bytes, 0),
          over_quota_count: quotas.filter(q => q.is_over_quota).length
        }
      }
    });

  } catch (error: any) {
    console.error('All quotas retrieval error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'Failed to retrieve storage quotas'
        }
      },
      { status: 500 }
    );
  }
}