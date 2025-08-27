/**
 * File Access Permissions Service
 * Granular permission management for secure file access control
 */

import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import { FileAccessPermission, FilePermission, SecureDocument } from '../types/files';
import { UserRole } from '../types/database';
import { AuthUser } from '../types/auth';

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  permissions: FilePermission[];
  reason?: string;
  expires_at?: Date;
}

/**
 * Permission grant parameters
 */
export interface GrantPermissionParams {
  document_id: string;
  user_id: string;
  permission_type: FilePermission;
  granted_by: string;
  expires_at?: Date;
}

/**
 * Bulk permission operation
 */
export interface BulkPermissionOperation {
  document_ids: string[];
  user_ids: string[];
  permission_type: FilePermission;
  expires_at?: Date;
}

/**
 * Check if user has specific permission for a document
 */
export async function checkFilePermission(
  documentId: string,
  userId: string,
  requiredPermission: FilePermission
): Promise<PermissionCheckResult> {
  try {
    // Get document with user and permission info
    const documentResult = await sql`
      SELECT 
        d.*,
        u.role as owner_role,
        CASE WHEN d.uploaded_by = ${userId} THEN true ELSE false END as is_owner
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = ${documentId}
    `;

    if (documentResult.rows.length === 0) {
      return {
        allowed: false,
        permissions: [],
        reason: 'Document not found'
      };
    }

    const document = documentResult.rows[0];

    // Check if document has expired
    if (document.expires_at && new Date(document.expires_at) < new Date()) {
      return {
        allowed: false,
        permissions: [],
        reason: 'Document has expired'
      };
    }

    // Get user info
    const userResult = await sql`
      SELECT id, role FROM users WHERE id = ${userId} AND is_active = true
    `;

    if (userResult.rows.length === 0) {
      return {
        allowed: false,
        permissions: [],
        reason: 'User not found or inactive'
      };
    }

    const user = userResult.rows[0];

    // Admin users have all permissions
    if (user.role === UserRole.ADMIN) {
      return {
        allowed: true,
        permissions: [FilePermission.READ, FilePermission.DOWNLOAD, FilePermission.SHARE, FilePermission.DELETE, FilePermission.ADMIN],
        reason: 'Admin access'
      };
    }

    // File owner has all permissions except admin
    if (document.is_owner) {
      return {
        allowed: true,
        permissions: [FilePermission.READ, FilePermission.DOWNLOAD, FilePermission.SHARE, FilePermission.DELETE],
        reason: 'Owner access'
      };
    }

    // Check public access for public documents
    if (document.is_public && (requiredPermission === FilePermission.READ || requiredPermission === FilePermission.DOWNLOAD)) {
      return {
        allowed: true,
        permissions: [FilePermission.READ, FilePermission.DOWNLOAD],
        reason: 'Public access'
      };
    }

    // Check explicit user permissions
    const permissionResult = await sql`
      SELECT permission_type, expires_at, is_active
      FROM file_permissions
      WHERE document_id = ${documentId} 
        AND user_id = ${userId}
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY granted_at DESC
    `;

    const userPermissions = permissionResult.rows.map(row => row.permission_type as FilePermission);

    // Check if user is in allowed_user_ids array
    if (document.allowed_user_ids && document.allowed_user_ids.includes(userId)) {
      userPermissions.push(FilePermission.READ, FilePermission.DOWNLOAD);
    }

    // Check role-based permissions
    if (document.allowed_role_types && document.allowed_role_types.includes(user.role)) {
      userPermissions.push(FilePermission.READ, FilePermission.DOWNLOAD);
    }

    // Check data room access if document is in a data room
    if (document.data_room_id) {
      const dataRoomAccess = await checkDataRoomAccess(document.data_room_id, userId);
      if (dataRoomAccess.allowed) {
        userPermissions.push(FilePermission.READ, FilePermission.DOWNLOAD);
      }
    }

    // Remove duplicates
    const uniquePermissions = [...new Set(userPermissions)];

    // Check if user has required permission
    const hasPermission = uniquePermissions.includes(requiredPermission) || 
                         (requiredPermission === FilePermission.READ && uniquePermissions.length > 0);

    // Get earliest expiration date
    const activePermissions = permissionResult.rows.filter(row => row.is_active);
    const expiresAt = activePermissions.length > 0 ? 
      new Date(Math.min(...activePermissions.map(p => new Date(p.expires_at || Date.now()).getTime()))) : 
      undefined;

    return {
      allowed: hasPermission,
      permissions: uniquePermissions,
      reason: hasPermission ? 'Explicit permission granted' : 'Permission denied',
      expires_at: expiresAt
    };

  } catch (error) {
    console.error('Permission check failed:', error);
    return {
      allowed: false,
      permissions: [],
      reason: 'Permission check failed'
    };
  }
}

/**
 * Check data room access permissions
 */
async function checkDataRoomAccess(dataRoomId: string, userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const result = await sql`
      SELECT dr.*, 
             CASE WHEN dr.created_by = ${userId} THEN true ELSE false END as is_creator
      FROM data_rooms dr
      WHERE dr.id = ${dataRoomId} 
        AND dr.is_active = true
        AND (dr.expires_at IS NULL OR dr.expires_at > NOW())
    `;

    if (result.rows.length === 0) {
      return { allowed: false, reason: 'Data room not found or expired' };
    }

    const dataRoom = result.rows[0];

    // Data room creator has access
    if (dataRoom.is_creator) {
      return { allowed: true, reason: 'Data room creator' };
    }

    // Check if user has been granted access to data room
    const accessResult = await sql`
      SELECT al.* FROM access_logs al
      WHERE al.user_id = ${userId}
        AND al.action = 'data_room_access'
        AND al.timestamp > NOW() - INTERVAL '30 days'
      ORDER BY al.timestamp DESC
      LIMIT 1
    `;

    return {
      allowed: accessResult.rows.length > 0,
      reason: accessResult.rows.length > 0 ? 'Recent data room access' : 'No data room access found'
    };

  } catch (error) {
    console.error('Data room access check failed:', error);
    return { allowed: false, reason: 'Access check failed' };
  }
}

/**
 * Grant permission to user for a document
 */
export async function grantFilePermission(params: GrantPermissionParams): Promise<FileAccessPermission> {
  const id = uuidv4();
  
  const result = await sql`
    INSERT INTO file_permissions (
      id, document_id, user_id, permission_type, granted_by, expires_at
    ) VALUES (
      ${id}, ${params.document_id}, ${params.user_id}, ${params.permission_type},
      ${params.granted_by}, ${params.expires_at || null}
    )
    ON CONFLICT (document_id, user_id, permission_type)
    DO UPDATE SET
      granted_by = ${params.granted_by},
      granted_at = NOW(),
      expires_at = ${params.expires_at || null},
      is_active = true
    RETURNING *
  `;

  return result.rows[0] as FileAccessPermission;
}

/**
 * Revoke permission from user for a document
 */
export async function revokeFilePermission(
  documentId: string,
  userId: string,
  permissionType: FilePermission,
  revokedBy: string
): Promise<boolean> {
  const result = await sql`
    UPDATE file_permissions 
    SET is_active = false, updated_at = NOW()
    WHERE document_id = ${documentId}
      AND user_id = ${userId}
      AND permission_type = ${permissionType}
      AND is_active = true
  `;

  // Log the revocation
  await sql`
    INSERT INTO access_logs (id, user_id, document_id, action, timestamp, additional_data)
    VALUES (
      ${uuidv4()}, ${revokedBy}, ${documentId}, 'permission_revoke', NOW(),
      ${JSON.stringify({ target_user: userId, permission: permissionType })}
    )
  `;

  return result.rowCount > 0;
}

/**
 * Get all permissions for a document
 */
export async function getDocumentPermissions(documentId: string): Promise<(FileAccessPermission & {
  user_email: string;
  user_company: string;
  granted_by_email: string;
})[]> {
  const result = await sql`
    SELECT 
      fp.*,
      u.email as user_email,
      u.company_name as user_company,
      gb.email as granted_by_email
    FROM file_permissions fp
    LEFT JOIN users u ON fp.user_id = u.id
    LEFT JOIN users gb ON fp.granted_by = gb.id
    WHERE fp.document_id = ${documentId}
      AND fp.is_active = true
    ORDER BY fp.granted_at DESC
  `;

  return result.rows;
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<(FileAccessPermission & {
  document_name: string;
  document_access_level: string;
  granted_by_email: string;
})[]> {
  const result = await sql`
    SELECT 
      fp.*,
      d.file_name as document_name,
      d.access_level as document_access_level,
      gb.email as granted_by_email
    FROM file_permissions fp
    LEFT JOIN documents d ON fp.document_id = d.id
    LEFT JOIN users gb ON fp.granted_by = gb.id
    WHERE fp.user_id = ${userId}
      AND fp.is_active = true
      AND (fp.expires_at IS NULL OR fp.expires_at > NOW())
    ORDER BY fp.granted_at DESC
  `;

  return result.rows;
}

/**
 * Grant bulk permissions
 */
export async function grantBulkPermissions(
  operation: BulkPermissionOperation,
  grantedBy: string
): Promise<{
  successful: number;
  failed: number;
  results: Array<{
    document_id: string;
    user_id: string;
    success: boolean;
    error?: string;
  }>;
}> {
  const results = [];
  let successful = 0;
  let failed = 0;

  for (const documentId of operation.document_ids) {
    for (const userId of operation.user_ids) {
      try {
        await grantFilePermission({
          document_id: documentId,
          user_id: userId,
          permission_type: operation.permission_type,
          granted_by: grantedBy,
          expires_at: operation.expires_at
        });

        results.push({
          document_id: documentId,
          user_id: userId,
          success: true
        });
        successful++;
      } catch (error: any) {
        results.push({
          document_id: documentId,
          user_id: userId,
          success: false,
          error: error.message
        });
        failed++;
      }
    }
  }

  return { successful, failed, results };
}

/**
 * Clean up expired permissions
 */
export async function cleanupExpiredPermissions(): Promise<number> {
  const result = await sql`
    UPDATE file_permissions 
    SET is_active = false 
    WHERE expires_at < NOW() 
      AND is_active = true
  `;

  return result.rowCount;
}

/**
 * Check if user can access document based on comprehensive rules
 */
export async function canAccessDocument(
  documentId: string,
  user: AuthUser,
  requiredPermission: FilePermission = FilePermission.READ
): Promise<PermissionCheckResult> {
  // Use the main permission check function
  return await checkFilePermission(documentId, user.id, requiredPermission);
}

/**
 * Check if user can perform admin actions on document
 */
export async function canAdministerDocument(documentId: string, userId: string): Promise<boolean> {
  const result = await checkFilePermission(documentId, userId, FilePermission.ADMIN);
  return result.allowed;
}

/**
 * Get documents accessible by user with permissions
 */
export async function getAccessibleDocuments(
  userId: string,
  requiredPermission: FilePermission = FilePermission.READ
): Promise<SecureDocument[]> {
  const result = await sql`
    SELECT DISTINCT d.*
    FROM documents d
    LEFT JOIN file_permissions fp ON d.id = fp.document_id AND fp.user_id = ${userId} AND fp.is_active = true
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE (
      -- User is owner
      d.uploaded_by = ${userId}
      -- Or document is public and requires read/download permission
      OR (d.is_public = true AND ${requiredPermission} IN ('read', 'download'))
      -- Or user has explicit permission
      OR (fp.permission_type = ${requiredPermission} AND (fp.expires_at IS NULL OR fp.expires_at > NOW()))
      -- Or user is in allowed users array
      OR (d.allowed_user_ids @> ARRAY[${userId}]::UUID[])
      -- Or user role is in allowed roles
      OR (d.allowed_role_types @> ARRAY[(SELECT role FROM users WHERE id = ${userId})]::VARCHAR[])
    )
    AND (d.expires_at IS NULL OR d.expires_at > NOW())
    ORDER BY d.uploaded_at DESC
  `;

  return result.rows as SecureDocument[];
}

/**
 * Update document access control settings
 */
export async function updateDocumentAccess(
  documentId: string,
  updates: {
    is_public?: boolean;
    access_level?: string;
    allowed_user_ids?: string[];
    allowed_role_types?: string[];
    expires_at?: Date;
  },
  updatedBy: string
): Promise<boolean> {
  // Check if user can admin the document
  const canAdmin = await canAdministerDocument(documentId, updatedBy);
  if (!canAdmin) {
    throw new Error('Insufficient permissions to update document access');
  }

  const setParts: string[] = [];
  const values: any[] = [];
  let valueIndex = 1;

  if (updates.is_public !== undefined) {
    setParts.push(`is_public = $${valueIndex++}`);
    values.push(updates.is_public);
  }

  if (updates.access_level !== undefined) {
    setParts.push(`access_level = $${valueIndex++}`);
    values.push(updates.access_level);
  }

  if (updates.allowed_user_ids !== undefined) {
    setParts.push(`allowed_user_ids = $${valueIndex++}`);
    values.push(updates.allowed_user_ids);
  }

  if (updates.allowed_role_types !== undefined) {
    setParts.push(`allowed_role_types = $${valueIndex++}`);
    values.push(updates.allowed_role_types);
  }

  if (updates.expires_at !== undefined) {
    setParts.push(`expires_at = $${valueIndex++}`);
    values.push(updates.expires_at);
  }

  if (setParts.length === 0) {
    return false;
  }

  values.push(documentId);
  const query = `
    UPDATE documents 
    SET ${setParts.join(', ')}, updated_at = NOW()
    WHERE id = $${valueIndex}
  `;

  const result = await sql.query(query, values);
  
  // Log the access change
  await sql`
    INSERT INTO access_logs (id, user_id, document_id, action, timestamp, additional_data)
    VALUES (
      ${uuidv4()}, ${updatedBy}, ${documentId}, 'access_change', NOW(),
      ${JSON.stringify(updates)}
    )
  `;

  return result.rowCount > 0;
}