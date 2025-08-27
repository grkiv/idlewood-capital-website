/**
 * Data Room File Organization Service
 * Manage file organization within secure data rooms
 */

import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import { DataRoomFileStructure, SecureDocument } from '../types/files';
import { DataRoom, DataRoomWithDetails } from '../types/database';
import { checkFilePermission, FilePermission } from './permissions';
import { fileManager } from './file-manager';

/**
 * Data room service class
 */
export class DataRoomService {
  /**
   * Create a new data room
   */
  async createDataRoom(
    name: string,
    createdBy: string,
    options: {
      access_code?: string;
      expires_at?: Date;
      is_active?: boolean;
    } = {}
  ): Promise<DataRoom> {
    const id = uuidv4();
    const access_code = options.access_code || this.generateAccessCode();

    const result = await sql`
      INSERT INTO data_rooms (
        id, name, access_code, created_by, expires_at, is_active
      ) VALUES (
        ${id}, ${name}, ${access_code}, ${createdBy}, 
        ${options.expires_at || null}, ${options.is_active !== false}
      )
      RETURNING *
    `;

    // Log data room creation
    await sql`
      INSERT INTO access_logs (id, user_id, action, timestamp, additional_data)
      VALUES (
        ${uuidv4()}, ${createdBy}, 'data_room_create', NOW(),
        ${JSON.stringify({ data_room_id: id, name, access_code })}
      )
    `;

    return result.rows[0] as DataRoom;
  }

  /**
   * Get data room with file structure
   */
  async getDataRoomStructure(dataRoomId: string, userId: string): Promise<DataRoomFileStructure | null> {
    // Check if user can access data room
    const dataRoomResult = await sql`
      SELECT * FROM data_rooms 
      WHERE id = ${dataRoomId} 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (dataRoomResult.rows.length === 0) {
      return null;
    }

    const dataRoom = dataRoomResult.rows[0];

    // Check access permissions (owner or explicit access)
    if (dataRoom.created_by !== userId) {
      // Check if user has been granted access
      const accessCheck = await sql`
        SELECT COUNT(*) as count FROM access_logs
        WHERE user_id = ${userId} 
          AND action = 'data_room_access'
          AND additional_data @> ${JSON.stringify({ data_room_id: dataRoomId })}
          AND timestamp > NOW() - INTERVAL '30 days'
      `;

      if (parseInt(accessCheck.rows[0].count) === 0) {
        return null;
      }
    }

    // Get all files in the data room
    const filesResult = await sql`
      SELECT 
        d.*,
        u.email as uploader_email,
        u.company_name as uploader_company
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.data_room_id = ${dataRoomId}
        AND (d.expires_at IS NULL OR d.expires_at > NOW())
      ORDER BY d.folder_path, d.file_name
    `;

    const documents = filesResult.rows.map(row => ({
      ...row,
      uploader: row.uploader_email ? {
        id: row.uploaded_by,
        email: row.uploader_email,
        company_name: row.uploader_company
      } : undefined
    })) as SecureDocument[];

    // Organize files by folder
    const folderMap = new Map<string, {
      path: string;
      name: string;
      file_count: number;
      total_size: number;
      documents: SecureDocument[];
    }>();

    let totalFiles = 0;
    let totalSize = 0;

    for (const doc of documents) {
      const folderPath = doc.folder_path || 'root';
      const folderName = folderPath === 'root' ? 'Root' : folderPath.split('/').pop() || folderPath;

      if (!folderMap.has(folderPath)) {
        folderMap.set(folderPath, {
          path: folderPath,
          name: folderName,
          file_count: 0,
          total_size: 0,
          documents: []
        });
      }

      const folder = folderMap.get(folderPath)!;
      folder.documents.push(doc);
      folder.file_count++;
      folder.total_size += doc.file_size;

      totalFiles++;
      totalSize += doc.file_size;
    }

    return {
      id: dataRoom.id,
      name: dataRoom.name,
      folders: Array.from(folderMap.values()),
      total_files: totalFiles,
      total_size: totalSize
    };
  }

  /**
   * Add files to data room
   */
  async addFilesToDataRoom(
    dataRoomId: string,
    documentIds: string[],
    userId: string,
    folderPath?: string
  ): Promise<{
    successful: number;
    failed: number;
    results: Array<{
      document_id: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;

    // Verify data room exists and user has access
    const dataRoomResult = await sql`
      SELECT * FROM data_rooms 
      WHERE id = ${dataRoomId} 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND created_by = ${userId}
    `;

    if (dataRoomResult.rows.length === 0) {
      // All operations fail if no access to data room
      return {
        successful: 0,
        failed: documentIds.length,
        results: documentIds.map(id => ({
          document_id: id,
          success: false,
          error: 'Data room not found or access denied'
        }))
      };
    }

    for (const documentId of documentIds) {
      try {
        // Check if user can admin the document
        const permission = await checkFilePermission(documentId, userId, FilePermission.ADMIN);
        if (!permission.allowed) {
          results.push({
            document_id: documentId,
            success: false,
            error: 'Insufficient permissions for document'
          });
          failed++;
          continue;
        }

        // Update document to belong to data room
        const updateResult = await sql`
          UPDATE documents 
          SET data_room_id = ${dataRoomId}, 
              folder_path = ${folderPath || null},
              updated_at = NOW()
          WHERE id = ${documentId}
        `;

        if (updateResult.rowCount > 0) {
          results.push({
            document_id: documentId,
            success: true
          });
          successful++;
        } else {
          results.push({
            document_id: documentId,
            success: false,
            error: 'Document not found'
          });
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

    // Log the operation
    await sql`
      INSERT INTO access_logs (id, user_id, action, timestamp, additional_data)
      VALUES (
        ${uuidv4()}, ${userId}, 'data_room_files_add', NOW(),
        ${JSON.stringify({ 
          data_room_id: dataRoomId, 
          document_count: documentIds.length,
          successful,
          failed,
          folder_path: folderPath
        })}
      )
    `;

    return { successful, failed, results };
  }

  /**
   * Remove files from data room
   */
  async removeFilesFromDataRoom(
    dataRoomId: string,
    documentIds: string[],
    userId: string
  ): Promise<{
    successful: number;
    failed: number;
    results: Array<{
      document_id: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;

    // Verify data room access
    const dataRoomResult = await sql`
      SELECT * FROM data_rooms 
      WHERE id = ${dataRoomId} 
        AND created_by = ${userId}
    `;

    if (dataRoomResult.rows.length === 0) {
      return {
        successful: 0,
        failed: documentIds.length,
        results: documentIds.map(id => ({
          document_id: id,
          success: false,
          error: 'Data room not found or access denied'
        }))
      };
    }

    for (const documentId of documentIds) {
      try {
        // Remove from data room (don't delete the file)
        const updateResult = await sql`
          UPDATE documents 
          SET data_room_id = NULL, updated_at = NOW()
          WHERE id = ${documentId} AND data_room_id = ${dataRoomId}
        `;

        if (updateResult.rowCount > 0) {
          results.push({
            document_id: documentId,
            success: true
          });
          successful++;
        } else {
          results.push({
            document_id: documentId,
            success: false,
            error: 'Document not found in data room'
          });
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

    // Log the operation
    await sql`
      INSERT INTO access_logs (id, user_id, action, timestamp, additional_data)
      VALUES (
        ${uuidv4()}, ${userId}, 'data_room_files_remove', NOW(),
        ${JSON.stringify({ 
          data_room_id: dataRoomId, 
          document_count: documentIds.length,
          successful,
          failed
        })}
      )
    `;

    return { successful, failed, results };
  }

  /**
   * Create folder in data room
   */
  async createFolder(
    dataRoomId: string,
    folderPath: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Verify data room access
      const dataRoomResult = await sql`
        SELECT * FROM data_rooms 
        WHERE id = ${dataRoomId} 
          AND created_by = ${userId}
      `;

      if (dataRoomResult.rows.length === 0) {
        return false;
      }

      // Validate folder path
      if (!folderPath || folderPath.includes('..') || folderPath.startsWith('/')) {
        return false;
      }

      // Log folder creation (we don't need to create actual folder records, 
      // they exist implicitly through file paths)
      await sql`
        INSERT INTO access_logs (id, user_id, action, timestamp, additional_data)
        VALUES (
          ${uuidv4()}, ${userId}, 'data_room_folder_create', NOW(),
          ${JSON.stringify({ data_room_id: dataRoomId, folder_path: folderPath })}
        )
      `;

      return true;

    } catch (error) {
      console.error('Folder creation error:', error);
      return false;
    }
  }

  /**
   * Grant access to data room
   */
  async grantDataRoomAccess(
    dataRoomId: string,
    userIds: string[],
    grantedBy: string,
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      // Verify data room exists and grantor has access
      const dataRoomResult = await sql`
        SELECT * FROM data_rooms 
        WHERE id = ${dataRoomId} 
          AND created_by = ${grantedBy}
      `;

      if (dataRoomResult.rows.length === 0) {
        return false;
      }

      // Grant access by logging access events
      for (const userId of userIds) {
        await sql`
          INSERT INTO access_logs (id, user_id, action, timestamp, additional_data)
          VALUES (
            ${uuidv4()}, ${userId}, 'data_room_access', NOW(),
            ${JSON.stringify({ 
              data_room_id: dataRoomId, 
              granted_by: grantedBy,
              expires_at: expiresAt
            })}
          )
        `;
      }

      return true;

    } catch (error) {
      console.error('Data room access grant error:', error);
      return false;
    }
  }

  /**
   * Get user's accessible data rooms
   */
  async getUserDataRooms(userId: string): Promise<DataRoomWithDetails[]> {
    const result = await sql`
      SELECT DISTINCT
        dr.*,
        u.email as creator_email,
        u.company_name as creator_company,
        COUNT(d.id) as document_count,
        SUM(d.file_size) as total_size
      FROM data_rooms dr
      LEFT JOIN users u ON dr.created_by = u.id
      LEFT JOIN documents d ON dr.id = d.data_room_id
      WHERE (
        dr.created_by = ${userId}
        OR EXISTS (
          SELECT 1 FROM access_logs al
          WHERE al.user_id = ${userId}
            AND al.action = 'data_room_access'
            AND al.additional_data @> ${JSON.stringify({ data_room_id: '' })}
            AND al.timestamp > NOW() - INTERVAL '30 days'
        )
      )
      AND dr.is_active = true
      AND (dr.expires_at IS NULL OR dr.expires_at > NOW())
      GROUP BY dr.id, dr.name, dr.access_code, dr.created_by, dr.expires_at, 
               dr.created_at, dr.updated_at, dr.is_active, u.email, u.company_name
      ORDER BY dr.created_at DESC
    `;

    return result.rows.map(row => ({
      ...row,
      creator: row.creator_email ? {
        id: row.created_by,
        email: row.creator_email,
        company_name: row.creator_company
      } : undefined,
      documents: [], // Would need separate query for full details
      document_count: parseInt(row.document_count || '0')
    })) as DataRoomWithDetails[];
  }

  /**
   * Generate secure access code
   */
  private generateAccessCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get data room statistics
   */
  async getDataRoomStats(dataRoomId: string, userId: string): Promise<{
    file_count: number;
    total_size: number;
    folder_count: number;
    recent_uploads: SecureDocument[];
    access_logs: Array<{
      user_email: string;
      action: string;
      timestamp: Date;
    }>;
  } | null> {
    // Verify access
    const dataRoomResult = await sql`
      SELECT * FROM data_rooms 
      WHERE id = ${dataRoomId} 
        AND created_by = ${userId}
    `;

    if (dataRoomResult.rows.length === 0) {
      return null;
    }

    // Get file statistics
    const fileStats = await sql`
      SELECT 
        COUNT(*) as file_count,
        SUM(file_size) as total_size,
        COUNT(DISTINCT folder_path) as folder_count
      FROM documents
      WHERE data_room_id = ${dataRoomId}
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    // Get recent uploads
    const recentUploads = await sql`
      SELECT d.*, u.email as uploader_email
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.data_room_id = ${dataRoomId}
      ORDER BY d.uploaded_at DESC
      LIMIT 10
    `;

    // Get access logs
    const accessLogs = await sql`
      SELECT 
        u.email as user_email,
        al.action,
        al.timestamp
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.additional_data @> ${JSON.stringify({ data_room_id: dataRoomId })}
      ORDER BY al.timestamp DESC
      LIMIT 20
    `;

    return {
      file_count: parseInt(fileStats.rows[0].file_count || '0'),
      total_size: parseInt(fileStats.rows[0].total_size || '0'),
      folder_count: Math.max(1, parseInt(fileStats.rows[0].folder_count || '1')), // At least root
      recent_uploads: recentUploads.rows as SecureDocument[],
      access_logs: accessLogs.rows
    };
  }
}

// Export singleton instance
export const dataRoomService = new DataRoomService();