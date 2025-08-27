/**
 * File Management Service
 * Comprehensive file operations with compression, optimization, and metadata handling
 */

import { sql } from '@vercel/postgres';
import { put, del, list } from '@vercel/blob';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import {
  SecureDocument,
  FileSearchParams,
  FileSearchResult,
  FileMetadata,
  BulkFileOperation,
  BulkOperationResult,
  FileStatistics,
  FileProcessingOptions
} from '../types/files';
import { generateSignedUrl, SignedUrlConfig } from './signed-urls';
import { encryptFileData, decryptFileData, generateFileHash } from './encryption';
import { getCachedStorageConfig, generateFolderPath, shouldGenerateThumbnail } from './config';
import { checkFilePermission, FilePermission } from './permissions';

/**
 * Comprehensive file service class
 */
export class FileManagerService {
  private config = getCachedStorageConfig();

  /**
   * Search files with advanced filtering
   */
  async searchFiles(params: FileSearchParams): Promise<FileSearchResult> {
    const {
      query,
      user_id,
      data_room_id,
      folder_path,
      file_types = [],
      access_level,
      date_from,
      date_to,
      min_size,
      max_size,
      is_encrypted,
      virus_scan_status,
      sort_by = 'date',
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = params;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    // Build WHERE conditions
    if (query) {
      conditions.push(`(
        d.file_name ILIKE $${valueIndex++} 
        OR to_tsvector('english', d.file_name) @@ plainto_tsquery('english', $${valueIndex - 1})
      )`);
      values.push(`%${query}%`);
    }

    if (user_id) {
      conditions.push(`(d.user_id = $${valueIndex++} OR d.uploaded_by = $${valueIndex - 1})`);
      values.push(user_id);
    }

    if (data_room_id) {
      conditions.push(`d.data_room_id = $${valueIndex++}`);
      values.push(data_room_id);
    }

    if (folder_path) {
      conditions.push(`d.folder_path LIKE $${valueIndex++}`);
      values.push(`${folder_path}%`);
    }

    if (file_types.length > 0) {
      conditions.push(`d.mime_type = ANY($${valueIndex++})`);
      values.push(file_types);
    }

    if (access_level) {
      conditions.push(`d.access_level = $${valueIndex++}`);
      values.push(access_level);
    }

    if (date_from) {
      conditions.push(`d.uploaded_at >= $${valueIndex++}`);
      values.push(date_from);
    }

    if (date_to) {
      conditions.push(`d.uploaded_at <= $${valueIndex++}`);
      values.push(date_to);
    }

    if (min_size !== undefined) {
      conditions.push(`d.file_size >= $${valueIndex++}`);
      values.push(min_size);
    }

    if (max_size !== undefined) {
      conditions.push(`d.file_size <= $${valueIndex++}`);
      values.push(max_size);
    }

    if (is_encrypted !== undefined) {
      conditions.push(`d.is_encrypted = $${valueIndex++}`);
      values.push(is_encrypted);
    }

    if (virus_scan_status) {
      conditions.push(`d.virus_scan_status = $${valueIndex++}`);
      values.push(virus_scan_status);
    }

    // Filter out expired documents
    conditions.push(`(d.expires_at IS NULL OR d.expires_at > NOW())`);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Determine sort field
    let sortField = 'd.uploaded_at';
    switch (sort_by) {
      case 'name':
        sortField = 'd.file_name';
        break;
      case 'size':
        sortField = 'd.file_size';
        break;
      case 'downloads':
        sortField = 'd.download_count';
        break;
      case 'relevance':
        if (query) {
          sortField = `ts_rank(to_tsvector('english', d.file_name), plainto_tsquery('english', $1))`;
        }
        break;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM documents d
      ${whereClause}
    `;
    const countResult = await sql.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].total);

    // Get documents
    const documentsQuery = `
      SELECT 
        d.*,
        u.id as uploader_id,
        u.email as uploader_email,
        u.company_name as uploader_company,
        dr.name as data_room_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN data_rooms dr ON d.data_room_id = dr.id
      ${whereClause}
      ORDER BY ${sortField} ${sort_order.toUpperCase()}
      LIMIT $${valueIndex++} OFFSET $${valueIndex++}
    `;

    values.push(limit, offset);
    const documentsResult = await sql.query(documentsQuery, values);

    const documents = documentsResult.rows.map(row => ({
      ...row,
      uploader: row.uploader_id ? {
        id: row.uploader_id,
        email: row.uploader_email,
        company_name: row.uploader_company
      } : undefined,
      data_room: row.data_room_name ? {
        id: row.data_room_id,
        name: row.data_room_name
      } : undefined
    })) as SecureDocument[];

    return {
      documents,
      total_count: totalCount,
      page,
      limit,
      total_pages: Math.ceil(totalCount / limit),
      has_more: (page * limit) < totalCount
    };
  }

  /**
   * Generate thumbnail for image files
   */
  async generateThumbnail(
    documentId: string,
    fileBuffer: ArrayBuffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<string | null> {
    try {
      const {
        width = this.config.thumbnailMaxWidth,
        height = this.config.thumbnailMaxHeight,
        quality = this.config.thumbnailQuality,
        format = 'jpeg'
      } = options;

      // Generate thumbnail using sharp
      const thumbnailBuffer = await sharp(Buffer.from(fileBuffer))
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toBuffer();

      // Upload thumbnail to blob storage
      const thumbnailPath = `thumbnails/${documentId}/thumb_${width}x${height}.${format}`;
      const thumbnailBlob = await put(thumbnailPath, thumbnailBuffer, {
        access: 'private',
        contentType: `image/${format}`
      });

      // Update document record with thumbnail URL
      await sql`
        UPDATE documents 
        SET thumbnail_url = ${thumbnailBlob.url}
        WHERE id = ${documentId}
      `;

      return thumbnailBlob.url;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  /**
   * Compress file data
   */
  async compressFile(
    fileBuffer: ArrayBuffer,
    mimeType: string,
    options: {
      quality?: number;
      format?: string;
    } = {}
  ): Promise<{ 
    compressedBuffer: ArrayBuffer; 
    compressionRatio: number; 
    originalSize: number 
  }> {
    const originalSize = fileBuffer.byteLength;
    let compressedBuffer = fileBuffer;

    try {
      if (mimeType.startsWith('image/')) {
        // Image compression using sharp
        const { quality = this.config.compressionQuality } = options;
        const compressed = await sharp(Buffer.from(fileBuffer))
          .jpeg({ quality })
          .toBuffer();
        compressedBuffer = compressed.buffer;
      } else {
        // For other file types, we could implement gzip compression
        // This is a placeholder for more sophisticated compression
        compressedBuffer = fileBuffer;
      }

      const compressionRatio = originalSize / compressedBuffer.byteLength;
      
      return {
        compressedBuffer,
        compressionRatio,
        originalSize
      };
    } catch (error) {
      console.error('File compression failed:', error);
      return {
        compressedBuffer: fileBuffer,
        compressionRatio: 1,
        originalSize
      };
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(documentId: string, userId: string): Promise<FileMetadata | null> {
    // Check permissions
    const permission = await checkFilePermission(documentId, userId, FilePermission.READ);
    if (!permission.allowed) {
      return null;
    }

    const result = await sql`
      SELECT 
        d.*,
        u.id as uploader_id,
        u.email as uploader_email,
        u.company_name as uploader_company,
        dr.id as data_room_id,
        dr.name as data_room_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN data_rooms dr ON d.data_room_id = dr.id
      WHERE d.id = ${documentId}
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const doc = result.rows[0];
    const lastDot = doc.file_name.lastIndexOf('.');
    const extension = lastDot > 0 ? doc.file_name.substring(lastDot + 1).toLowerCase() : '';

    return {
      id: doc.id,
      name: doc.file_name,
      size: doc.file_size,
      type: doc.mime_type,
      extension,
      uploaded_at: doc.uploaded_at,
      uploaded_by: {
        id: doc.uploader_id,
        email: doc.uploader_email,
        company_name: doc.uploader_company
      },
      access_level: doc.access_level,
      is_encrypted: doc.is_encrypted,
      download_count: doc.download_count,
      last_accessed_at: doc.last_accessed_at,
      expires_at: doc.expires_at,
      thumbnail_url: doc.thumbnail_url,
      folder_path: doc.folder_path,
      data_room: doc.data_room_id ? {
        id: doc.data_room_id,
        name: doc.data_room_name
      } : undefined
    };
  }

  /**
   * Move file to different folder/data room
   */
  async moveFile(
    documentId: string,
    userId: string,
    destination: {
      folder_path?: string;
      data_room_id?: string;
    }
  ): Promise<boolean> {
    // Check permissions
    const permission = await checkFilePermission(documentId, userId, FilePermission.ADMIN);
    if (!permission.allowed) {
      throw new Error('Insufficient permissions to move file');
    }

    const result = await sql`
      UPDATE documents 
      SET 
        folder_path = ${destination.folder_path || null},
        data_room_id = ${destination.data_room_id || null},
        updated_at = NOW()
      WHERE id = ${documentId}
    `;

    // Log the move operation
    if (result.rowCount > 0) {
      await sql`
        INSERT INTO access_logs (id, user_id, document_id, action, timestamp, additional_data)
        VALUES (
          ${uuidv4()}, ${userId}, ${documentId}, 'file_move', NOW(),
          ${JSON.stringify(destination)}
        )
      `;
    }

    return result.rowCount > 0;
  }

  /**
   * Delete file permanently
   */
  async deleteFile(documentId: string, userId: string): Promise<boolean> {
    // Check permissions
    const permission = await checkFilePermission(documentId, userId, FilePermission.DELETE);
    if (!permission.allowed) {
      throw new Error('Insufficient permissions to delete file');
    }

    // Get document info
    const docResult = await sql`
      SELECT blob_url, thumbnail_url FROM documents WHERE id = ${documentId}
    `;

    if (docResult.rows.length === 0) {
      return false;
    }

    const document = docResult.rows[0];

    try {
      // Delete from blob storage
      if (document.blob_url) {
        const blobPath = new URL(document.blob_url).pathname.substring(1);
        await del(blobPath);
      }

      // Delete thumbnail if exists
      if (document.thumbnail_url) {
        const thumbnailPath = new URL(document.thumbnail_url).pathname.substring(1);
        await del(thumbnailPath);
      }

      // Delete database records (cascade will handle related records)
      await sql`DELETE FROM documents WHERE id = ${documentId}`;

      // Log deletion
      await sql`
        INSERT INTO access_logs (id, user_id, document_id, action, timestamp)
        VALUES (${uuidv4()}, ${userId}, ${documentId}, 'file_delete', NOW())
      `;

      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  /**
   * Bulk file operations
   */
  async bulkOperation(
    operation: BulkFileOperation,
    userId: string
  ): Promise<BulkOperationResult> {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const documentId of operation.document_ids) {
      try {
        let success = false;

        switch (operation.operation) {
          case 'delete':
            success = await this.deleteFile(documentId, userId);
            break;

          case 'move':
            if (operation.parameters?.target_folder || operation.parameters?.target_data_room_id) {
              success = await this.moveFile(documentId, userId, {
                folder_path: operation.parameters.target_folder,
                data_room_id: operation.parameters.target_data_room_id
              });
            }
            break;

          case 'change_access':
            if (operation.parameters?.new_access_level) {
              const result = await sql`
                UPDATE documents 
                SET access_level = ${operation.parameters.new_access_level}
                WHERE id = ${documentId}
              `;
              success = result.rowCount > 0;
            }
            break;

          default:
            throw new Error(`Unsupported operation: ${operation.operation}`);
        }

        results.push({
          document_id: documentId,
          success,
          error: success ? undefined : 'Operation failed'
        });

        if (success) {
          successful++;
        } else {
          failed++;
        }
      } catch (error: any) {
        results.push({
          document_id: documentId,
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    return {
      success: failed === 0,
      results,
      summary: {
        total: operation.document_ids.length,
        successful,
        failed
      }
    };
  }

  /**
   * Get file statistics
   */
  async getFileStatistics(userId?: string): Promise<FileStatistics> {
    const userFilter = userId ? `WHERE d.uploaded_by = '${userId}'` : '';

    const [
      totalStats,
      typeStats,
      accessLevelStats,
      virusStats,
      topDownloaded,
      storageByUser,
      recentUploads
    ] = await Promise.all([
      // Total statistics
      sql.query(`
        SELECT 
          COUNT(*) as total_files,
          SUM(file_size) as total_size,
          COUNT(CASE WHEN is_encrypted = true THEN 1 END) as encrypted_files,
          COUNT(CASE WHEN is_public = true THEN 1 END) as public_files
        FROM documents d ${userFilter}
      `),

      // Files by type
      sql.query(`
        SELECT mime_type, COUNT(*) as count
        FROM documents d ${userFilter}
        GROUP BY mime_type
        ORDER BY count DESC
        LIMIT 10
      `),

      // Files by access level
      sql.query(`
        SELECT access_level, COUNT(*) as count
        FROM documents d ${userFilter}
        GROUP BY access_level
      `),

      // Virus scan statistics
      sql.query(`
        SELECT virus_scan_status, COUNT(*) as count
        FROM documents d ${userFilter}
        GROUP BY virus_scan_status
      `),

      // Top downloaded files
      sql.query(`
        SELECT id, file_name, download_count
        FROM documents d ${userFilter}
        ORDER BY download_count DESC
        LIMIT 10
      `),

      // Storage by user (admin only)
      !userId ? sql`
        SELECT 
          u.id as user_id,
          u.email,
          COUNT(d.id) as file_count,
          SUM(d.file_size) as total_size
        FROM users u
        LEFT JOIN documents d ON u.id = d.uploaded_by
        GROUP BY u.id, u.email
        ORDER BY total_size DESC NULLS LAST
        LIMIT 20
      ` : Promise.resolve({ rows: [] }),

      // Recent uploads
      sql.query(`
        SELECT * FROM documents d ${userFilter}
        ORDER BY uploaded_at DESC
        LIMIT 10
      `)
    ]);

    // Process results
    const filesByType: Record<string, number> = {};
    typeStats.rows.forEach(row => {
      filesByType[row.mime_type] = parseInt(row.count);
    });

    const filesByAccessLevel: any = {};
    accessLevelStats.rows.forEach(row => {
      filesByAccessLevel[row.access_level] = parseInt(row.count);
    });

    const virusScanSummary: any = {};
    virusStats.rows.forEach(row => {
      virusScanSummary[row.virus_scan_status] = parseInt(row.count);
    });

    return {
      total_files: parseInt(totalStats.rows[0].total_files),
      total_size_bytes: parseInt(totalStats.rows[0].total_size || '0'),
      encrypted_files: parseInt(totalStats.rows[0].encrypted_files),
      public_files: parseInt(totalStats.rows[0].public_files),
      files_by_type: filesByType,
      files_by_access_level: filesByAccessLevel,
      virus_scan_summary: virusScanSummary,
      top_downloaded_files: topDownloaded.rows.map(row => ({
        id: row.id,
        name: row.file_name,
        download_count: row.download_count
      })),
      storage_by_user: storageByUser.rows.map(row => ({
        user_id: row.user_id,
        email: row.email,
        file_count: row.file_count || 0,
        total_size: row.total_size || 0
      })),
      recent_uploads: recentUploads.rows as SecureDocument[]
    };
  }

  /**
   * Create share link for file
   */
  async createShareLink(
    documentId: string,
    userId: string,
    options: {
      expires_in_hours?: number;
      max_downloads?: number;
      password?: string;
    } = {}
  ): Promise<string> {
    // Check permissions
    const permission = await checkFilePermission(documentId, userId, FilePermission.SHARE);
    if (!permission.allowed) {
      throw new Error('Insufficient permissions to share file');
    }

    const expiresInSeconds = (options.expires_in_hours || 24) * 3600;
    
    const signedUrlResult = await generateSignedUrl({
      document_id: documentId,
      user_id: userId,
      action: 'download',
      expires_in_seconds: expiresInSeconds,
      max_uses: options.max_downloads || 10
    });

    // Log share creation
    await sql`
      INSERT INTO access_logs (id, user_id, document_id, action, timestamp, additional_data)
      VALUES (
        ${uuidv4()}, ${userId}, ${documentId}, 'file_share', NOW(),
        ${JSON.stringify({ expires_in_hours: options.expires_in_hours, max_downloads: options.max_downloads })}
      )
    `;

    return signedUrlResult.url;
  }
}

// Export singleton instance
export const fileManager = new FileManagerService();