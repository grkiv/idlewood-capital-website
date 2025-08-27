/**
 * File Search API Endpoint
 * Advanced file search with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { fileManager } from '@/lib/storage/file-manager';
import { FileErrorCode, FileSearchParams } from '@/lib/types/files';
import { FileAccessLevel, VirusScanStatus } from '@/lib/storage/config';

/**
 * GET /api/files/search
 * Search files with advanced filtering
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

    // Parse query parameters
    const url = new URL(request.url);
    const searchParams: FileSearchParams = {
      query: url.searchParams.get('query') || undefined,
      user_id: url.searchParams.get('user_id') || user.id, // Default to current user
      data_room_id: url.searchParams.get('data_room_id') || undefined,
      folder_path: url.searchParams.get('folder_path') || undefined,
      file_types: url.searchParams.get('file_types')?.split(',') || [],
      access_level: url.searchParams.get('access_level') as FileAccessLevel || undefined,
      date_from: url.searchParams.get('date_from') ? 
        new Date(url.searchParams.get('date_from')!) : undefined,
      date_to: url.searchParams.get('date_to') ? 
        new Date(url.searchParams.get('date_to')!) : undefined,
      min_size: url.searchParams.get('min_size') ? 
        parseInt(url.searchParams.get('min_size')!) : undefined,
      max_size: url.searchParams.get('max_size') ? 
        parseInt(url.searchParams.get('max_size')!) : undefined,
      is_encrypted: url.searchParams.get('is_encrypted') === 'true' ? true :
        url.searchParams.get('is_encrypted') === 'false' ? false : undefined,
      virus_scan_status: url.searchParams.get('virus_scan_status') as VirusScanStatus || undefined,
      sort_by: url.searchParams.get('sort_by') as any || 'date',
      sort_order: url.searchParams.get('sort_order') as 'asc' | 'desc' || 'desc',
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 100) // Max 100 per page
    };

    // Validate date range
    if (searchParams.date_from && searchParams.date_to && 
        searchParams.date_from > searchParams.date_to) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'Invalid date range: date_from must be before date_to'
          }
        },
        { status: 400 }
      );
    }

    // Validate size range
    if (searchParams.min_size && searchParams.max_size && 
        searchParams.min_size > searchParams.max_size) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: FileErrorCode.INVALID_FILE_TYPE,
            message: 'Invalid size range: min_size must be less than max_size'
          }
        },
        { status: 400 }
      );
    }

    // Perform search
    const searchResult = await fileManager.searchFiles(searchParams);

    // Filter files based on user permissions (done by file manager)
    // The file manager already handles permission checking

    return NextResponse.json({
      success: true,
      data: searchResult
    });

  } catch (error: any) {
    console.error('File search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: FileErrorCode.PROCESSING_FAILED,
          message: 'File search failed'
        }
      },
      { status: 500 }
    );
  }
}