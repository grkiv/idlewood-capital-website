/**
 * Signed URL Generation Service
 * Secure temporary access URLs for file downloads with access control
 */

import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import { SignedUrlConfig, SignedUrlResult } from '../types/files';
import { generateAccessToken } from './encryption';
import { checkFilePermission, FilePermission } from './permissions';
import { getCachedStorageConfig } from './config';

/**
 * Generate signed URL for secure file access
 */
export async function generateSignedUrl(
  config: SignedUrlConfig
): Promise<SignedUrlResult> {
  const { 
    document_id, 
    user_id, 
    action = 'download', 
    expires_in_seconds,
    max_uses = 1,
    ip_restrictions = [],
    user_agent_restrictions = []
  } = config;

  const storageConfig = getCachedStorageConfig();
  
  // Determine expiration time
  const expirySeconds = expires_in_seconds || storageConfig.defaultSignedUrlExpiry;
  const maxExpiry = storageConfig.maxSignedUrlExpiry;
  
  if (expirySeconds > maxExpiry) {
    throw new Error(`Expiry time cannot exceed ${maxExpiry} seconds`);
  }

  const expiresAt = new Date(Date.now() + (expirySeconds * 1000));
  
  // Verify user has permission for the action
  if (user_id) {
    const requiredPermission = action === 'download' ? FilePermission.DOWNLOAD : FilePermission.READ;
    const permissionCheck = await checkFilePermission(document_id, user_id, requiredPermission);
    
    if (!permissionCheck.allowed) {
      throw new Error(`User does not have ${requiredPermission} permission for this document`);
    }
  }

  // Generate secure token
  const token = generateAccessToken();
  const urlId = uuidv4();

  // Store signed URL record
  await sql`
    INSERT INTO signed_urls (
      id, document_id, user_id, url_token, action, expires_at, 
      max_uses, current_uses, ip_restrictions, created_at
    ) VALUES (
      ${urlId}, ${document_id}, ${user_id || null}, ${token}, 
      ${action}, ${expiresAt}, ${max_uses}, 0, ${ip_restrictions}
    )
  `;

  // Generate the actual URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const signedUrl = `${baseUrl}/api/files/access/${token}`;

  return {
    url: signedUrl,
    token,
    expires_at: expiresAt,
    max_uses,
    current_uses: 0
  };
}

/**
 * Validate and use signed URL
 */
export async function validateSignedUrl(
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  valid: boolean;
  document_id?: string;
  action?: string;
  error?: string;
  uses_remaining?: number;
}> {
  try {
    // Get signed URL record
    const result = await sql`
      SELECT * FROM signed_urls 
      WHERE url_token = ${token} 
        AND expires_at > NOW() 
        AND is_revoked = false
    `;

    if (result.rows.length === 0) {
      return {
        valid: false,
        error: 'Invalid or expired token'
      };
    }

    const signedUrl = result.rows[0];

    // Check usage limits
    if (signedUrl.current_uses >= signedUrl.max_uses) {
      return {
        valid: false,
        error: 'URL usage limit exceeded'
      };
    }

    // Check IP restrictions if set
    if (signedUrl.ip_restrictions && signedUrl.ip_restrictions.length > 0 && ipAddress) {
      const isIpAllowed = signedUrl.ip_restrictions.some((allowedIp: string) => {
        // Simple IP matching - in production you might want more sophisticated matching
        return allowedIp === ipAddress || allowedIp === '*';
      });

      if (!isIpAllowed) {
        return {
          valid: false,
          error: 'Access denied from this IP address'
        };
      }
    }

    // Increment usage count
    await sql`
      UPDATE signed_urls 
      SET current_uses = current_uses + 1, last_used_at = NOW()
      WHERE url_token = ${token}
    `;

    // Check if document still exists and is accessible
    const documentResult = await sql`
      SELECT id, blob_url, file_name, mime_type, is_encrypted, virus_scan_status
      FROM documents 
      WHERE id = ${signedUrl.document_id}
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (documentResult.rows.length === 0) {
      return {
        valid: false,
        error: 'Document not found or expired'
      };
    }

    const document = documentResult.rows[0];

    // Check virus scan status
    if (document.virus_scan_status === 'infected') {
      return {
        valid: false,
        error: 'Document is infected and cannot be accessed'
      };
    }

    return {
      valid: true,
      document_id: signedUrl.document_id,
      action: signedUrl.action,
      uses_remaining: signedUrl.max_uses - (signedUrl.current_uses + 1)
    };

  } catch (error) {
    console.error('Signed URL validation error:', error);
    return {
      valid: false,
      error: 'Validation failed'
    };
  }
}

/**
 * Revoke signed URL
 */
export async function revokeSignedUrl(token: string, revokedBy?: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE signed_urls 
      SET is_revoked = true, updated_at = NOW()
      WHERE url_token = ${token} AND is_revoked = false
    `;

    if (result.rowCount > 0 && revokedBy) {
      // Log revocation
      const urlInfo = await sql`
        SELECT document_id FROM signed_urls WHERE url_token = ${token}
      `;

      if (urlInfo.rows.length > 0) {
        await sql`
          INSERT INTO access_logs (id, user_id, document_id, action, timestamp, additional_data)
          VALUES (
            ${uuidv4()}, ${revokedBy}, ${urlInfo.rows[0].document_id}, 
            'url_revoke', NOW(), ${JSON.stringify({ token_prefix: token.substring(0, 8) })}
          )
        `;
      }
    }

    return result.rowCount > 0;
  } catch (error) {
    console.error('Failed to revoke signed URL:', error);
    return false;
  }
}

/**
 * Revoke all signed URLs for a document
 */
export async function revokeDocumentUrls(documentId: string, revokedBy: string): Promise<number> {
  try {
    const result = await sql`
      UPDATE signed_urls 
      SET is_revoked = true, updated_at = NOW()
      WHERE document_id = ${documentId} AND is_revoked = false
    `;

    if (result.rowCount > 0) {
      // Log mass revocation
      await sql`
        INSERT INTO access_logs (id, user_id, document_id, action, timestamp, additional_data)
        VALUES (
          ${uuidv4()}, ${revokedBy}, ${documentId}, 
          'bulk_url_revoke', NOW(), ${JSON.stringify({ revoked_count: result.rowCount })}
        )
      `;
    }

    return result.rowCount;
  } catch (error) {
    console.error('Failed to revoke document URLs:', error);
    return 0;
  }
}

/**
 * Get active signed URLs for a document
 */
export async function getDocumentSignedUrls(documentId: string): Promise<Array<{
  id: string;
  token: string;
  action: string;
  expires_at: Date;
  max_uses: number;
  current_uses: number;
  ip_restrictions: string[];
  created_at: Date;
  last_used_at?: Date;
  user_email?: string;
}>> {
  const result = await sql`
    SELECT 
      su.*,
      u.email as user_email
    FROM signed_urls su
    LEFT JOIN users u ON su.user_id = u.id
    WHERE su.document_id = ${documentId}
      AND su.expires_at > NOW()
      AND su.is_revoked = false
    ORDER BY su.created_at DESC
  `;

  return result.rows;
}

/**
 * Get signed URLs created by a user
 */
export async function getUserSignedUrls(userId: string): Promise<Array<{
  id: string;
  token: string;
  action: string;
  expires_at: Date;
  max_uses: number;
  current_uses: number;
  created_at: Date;
  last_used_at?: Date;
  document_name: string;
  document_id: string;
}>> {
  const result = await sql`
    SELECT 
      su.*,
      d.file_name as document_name
    FROM signed_urls su
    LEFT JOIN documents d ON su.document_id = d.id
    WHERE su.user_id = ${userId}
      AND su.expires_at > NOW()
      AND su.is_revoked = false
    ORDER BY su.created_at DESC
  `;

  return result.rows;
}

/**
 * Clean up expired signed URLs
 */
export async function cleanupExpiredUrls(): Promise<number> {
  const result = await sql`
    DELETE FROM signed_urls 
    WHERE expires_at < NOW() - INTERVAL '7 days'
  `;

  return result.rowCount;
}

/**
 * Generate batch signed URLs for multiple documents
 */
export async function generateBatchSignedUrls(
  configs: SignedUrlConfig[]
): Promise<Array<{
  document_id: string;
  success: boolean;
  result?: SignedUrlResult;
  error?: string;
}>> {
  const results = [];

  for (const config of configs) {
    try {
      const result = await generateSignedUrl(config);
      results.push({
        document_id: config.document_id,
        success: true,
        result
      });
    } catch (error: any) {
      results.push({
        document_id: config.document_id,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Create time-limited data room access URL
 */
export async function generateDataRoomAccessUrl(
  dataRoomId: string,
  userId: string,
  expiresInHours: number = 24
): Promise<string> {
  const token = generateAccessToken();
  const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000));

  // Store the access token
  await sql`
    INSERT INTO signed_urls (
      id, document_id, user_id, url_token, action, expires_at, max_uses
    ) VALUES (
      ${uuidv4()}, ${dataRoomId}, ${userId}, ${token}, 'data_room_access', ${expiresAt}, 999999
    )
  `;

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/data-rooms/access/${token}`;
}

/**
 * Validate data room access token
 */
export async function validateDataRoomAccess(token: string): Promise<{
  valid: boolean;
  data_room_id?: string;
  user_id?: string;
  error?: string;
}> {
  try {
    const result = await sql`
      SELECT su.*, dr.name as data_room_name, dr.is_active as data_room_active
      FROM signed_urls su
      LEFT JOIN data_rooms dr ON su.document_id = dr.id
      WHERE su.url_token = ${token}
        AND su.action = 'data_room_access'
        AND su.expires_at > NOW()
        AND su.is_revoked = false
    `;

    if (result.rows.length === 0) {
      return {
        valid: false,
        error: 'Invalid or expired access token'
      };
    }

    const access = result.rows[0];

    if (!access.data_room_active) {
      return {
        valid: false,
        error: 'Data room is no longer active'
      };
    }

    // Increment usage (but don't enforce limits for data room access)
    await sql`
      UPDATE signed_urls 
      SET current_uses = current_uses + 1, last_used_at = NOW()
      WHERE url_token = ${token}
    `;

    return {
      valid: true,
      data_room_id: access.document_id,
      user_id: access.user_id
    };

  } catch (error) {
    console.error('Data room access validation error:', error);
    return {
      valid: false,
      error: 'Validation failed'
    };
  }
}

/**
 * Get signed URL statistics
 */
export async function getSignedUrlStats(): Promise<{
  total_active: number;
  total_expired: number;
  total_revoked: number;
  by_action: Record<string, number>;
  recent_usage: Array<{
    date: string;
    count: number;
  }>;
}> {
  const [activeResult, expiredResult, revokedResult, actionResult, usageResult] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM signed_urls WHERE expires_at > NOW() AND is_revoked = false`,
    sql`SELECT COUNT(*) as count FROM signed_urls WHERE expires_at <= NOW()`,
    sql`SELECT COUNT(*) as count FROM signed_urls WHERE is_revoked = true`,
    sql`
      SELECT action, COUNT(*) as count 
      FROM signed_urls 
      WHERE expires_at > NOW() AND is_revoked = false 
      GROUP BY action
    `,
    sql`
      SELECT 
        DATE(last_used_at) as date,
        COUNT(*) as count
      FROM signed_urls 
      WHERE last_used_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(last_used_at)
      ORDER BY date DESC
    `
  ]);

  const byAction: Record<string, number> = {};
  actionResult.rows.forEach(row => {
    byAction[row.action] = parseInt(row.count);
  });

  return {
    total_active: parseInt(activeResult.rows[0].count),
    total_expired: parseInt(expiredResult.rows[0].count),
    total_revoked: parseInt(revokedResult.rows[0].count),
    by_action: byAction,
    recent_usage: usageResult.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count)
    }))
  };
}