import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import {
  AccessLog,
  CreateAccessLogInput,
  AccessLogWithDetails,
  AccessAction,
  PaginationParams
} from '../types/database';

/**
 * Access log database operations
 */

// Create a new access log entry
export async function createAccessLog(logData: CreateAccessLogInput): Promise<AccessLog> {
  const id = uuidv4();
  
  const result = await sql`
    INSERT INTO access_logs (
      id, user_id, document_id, action, ip_address, user_agent
    ) VALUES (
      ${id},
      ${logData.user_id || null},
      ${logData.document_id || null},
      ${logData.action},
      ${logData.ip_address || null},
      ${logData.user_agent || null}
    )
    RETURNING id, user_id, document_id, action, ip_address, user_agent, timestamp
  `;

  return result.rows[0] as AccessLog;
}

// Get access log by ID
export async function getAccessLogById(id: string): Promise<AccessLog | null> {
  const result = await sql`
    SELECT id, user_id, document_id, action, ip_address, user_agent, timestamp
    FROM access_logs
    WHERE id = ${id}
  `;

  return result.rows[0] as AccessLog || null;
}

// Get access logs with user and document details
export async function getAccessLogsWithDetails(
  params: PaginationParams = {}
): Promise<AccessLogWithDetails[]> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT 
      al.id, al.user_id, al.document_id, al.action, al.ip_address, al.user_agent, al.timestamp,
      u.id as user_detail_id, u.email, u.company_name,
      d.id as document_detail_id, d.file_name
    FROM access_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN documents d ON al.document_id = d.id
    ORDER BY al.timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    document_id: row.document_id,
    action: row.action,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    timestamp: row.timestamp,
    user: row.user_detail_id ? {
      id: row.user_detail_id,
      email: row.email,
      company_name: row.company_name
    } : undefined,
    document: row.document_detail_id ? {
      id: row.document_detail_id,
      file_name: row.file_name
    } : undefined
  })) as AccessLogWithDetails[];
}

// Get access logs by user
export async function getAccessLogsByUser(
  userId: string, 
  params: PaginationParams = {}
): Promise<AccessLog[]> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT id, user_id, document_id, action, ip_address, user_agent, timestamp
    FROM access_logs
    WHERE user_id = ${userId}
    ORDER BY timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows as AccessLog[];
}

// Get access logs by document
export async function getAccessLogsByDocument(
  documentId: string, 
  params: PaginationParams = {}
): Promise<AccessLogWithDetails[]> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT 
      al.id, al.user_id, al.document_id, al.action, al.ip_address, al.user_agent, al.timestamp,
      u.id as user_detail_id, u.email, u.company_name,
      d.id as document_detail_id, d.file_name
    FROM access_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN documents d ON al.document_id = d.id
    WHERE al.document_id = ${documentId}
    ORDER BY al.timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    document_id: row.document_id,
    action: row.action,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    timestamp: row.timestamp,
    user: row.user_detail_id ? {
      id: row.user_detail_id,
      email: row.email,
      company_name: row.company_name
    } : undefined,
    document: row.document_detail_id ? {
      id: row.document_detail_id,
      file_name: row.file_name
    } : undefined
  })) as AccessLogWithDetails[];
}

// Get access logs by action type
export async function getAccessLogsByAction(
  action: AccessAction, 
  params: PaginationParams = {}
): Promise<AccessLogWithDetails[]> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT 
      al.id, al.user_id, al.document_id, al.action, al.ip_address, al.user_agent, al.timestamp,
      u.id as user_detail_id, u.email, u.company_name,
      d.id as document_detail_id, d.file_name
    FROM access_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN documents d ON al.document_id = d.id
    WHERE al.action = ${action}
    ORDER BY al.timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    document_id: row.document_id,
    action: row.action,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    timestamp: row.timestamp,
    user: row.user_detail_id ? {
      id: row.user_detail_id,
      email: row.email,
      company_name: row.company_name
    } : undefined,
    document: row.document_detail_id ? {
      id: row.document_detail_id,
      file_name: row.file_name
    } : undefined
  })) as AccessLogWithDetails[];
}

// Get access logs within date range
export async function getAccessLogsByDateRange(
  startDate: Date,
  endDate: Date,
  params: PaginationParams = {}
): Promise<AccessLogWithDetails[]> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT 
      al.id, al.user_id, al.document_id, al.action, al.ip_address, al.user_agent, al.timestamp,
      u.id as user_detail_id, u.email, u.company_name,
      d.id as document_detail_id, d.file_name
    FROM access_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN documents d ON al.document_id = d.id
    WHERE al.timestamp >= ${startDate.toISOString()} AND al.timestamp <= ${endDate.toISOString()}
    ORDER BY al.timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    document_id: row.document_id,
    action: row.action,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    timestamp: row.timestamp,
    user: row.user_detail_id ? {
      id: row.user_detail_id,
      email: row.email,
      company_name: row.company_name
    } : undefined,
    document: row.document_detail_id ? {
      id: row.document_detail_id,
      file_name: row.file_name
    } : undefined
  })) as AccessLogWithDetails[];
}

// Count access logs
export async function getAccessLogCount(filters?: {
  user_id?: string;
  document_id?: string;
  action?: AccessAction;
  start_date?: Date;
  end_date?: Date;
}): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM access_logs';
  const conditions: string[] = [];
  const values: any[] = [];
  let valueIndex = 1;

  if (filters?.user_id) {
    conditions.push(`user_id = $${valueIndex++}`);
    values.push(filters.user_id);
  }

  if (filters?.document_id) {
    conditions.push(`document_id = $${valueIndex++}`);
    values.push(filters.document_id);
  }

  if (filters?.action) {
    conditions.push(`action = $${valueIndex++}`);
    values.push(filters.action);
  }

  if (filters?.start_date && filters?.end_date) {
    conditions.push(`timestamp >= $${valueIndex++} AND timestamp <= $${valueIndex++}`);
    values.push(filters.start_date.toISOString(), filters.end_date.toISOString());
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = await sql.query(query, values);
  return parseInt(result.rows[0].count);
}

// Get access log statistics
export async function getAccessLogStats(): Promise<{
  total_logs: number;
  unique_users: number;
  unique_documents: number;
  actions_breakdown: { action: AccessAction; count: number }[];
  recent_activity: AccessLogWithDetails[];
}> {
  // Get total counts
  const totals = await sql`
    SELECT 
      COUNT(*) as total_logs,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT document_id) as unique_documents
    FROM access_logs
  `;

  // Get action breakdown
  const actionBreakdown = await sql`
    SELECT action, COUNT(*) as count
    FROM access_logs
    GROUP BY action
    ORDER BY count DESC
  `;

  // Get recent activity (last 10 entries)
  const recentActivity = await getAccessLogsWithDetails({ limit: 10, offset: 0 });

  return {
    total_logs: parseInt(totals.rows[0].total_logs),
    unique_users: parseInt(totals.rows[0].unique_users),
    unique_documents: parseInt(totals.rows[0].unique_documents),
    actions_breakdown: actionBreakdown.rows.map(row => ({
      action: row.action as AccessAction,
      count: parseInt(row.count)
    })),
    recent_activity: recentActivity
  };
}

// Delete old access logs (for cleanup/archival)
export async function deleteOldAccessLogs(olderThanDays: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await sql`
    DELETE FROM access_logs
    WHERE timestamp < ${cutoffDate.toISOString()}
  `;

  return result.rowCount;
}

// Convenience function to log user login
export async function logUserLogin(
  userId: string, 
  ipAddress?: string, 
  userAgent?: string
): Promise<AccessLog> {
  return createAccessLog({
    user_id: userId,
    action: AccessAction.LOGIN,
    ip_address: ipAddress,
    user_agent: userAgent
  });
}

// Convenience function to log user logout
export async function logUserLogout(
  userId: string, 
  ipAddress?: string, 
  userAgent?: string
): Promise<AccessLog> {
  return createAccessLog({
    user_id: userId,
    action: AccessAction.LOGOUT,
    ip_address: ipAddress,
    user_agent: userAgent
  });
}

// Convenience function to log document view
export async function logDocumentView(
  userId: string,
  documentId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AccessLog> {
  return createAccessLog({
    user_id: userId,
    document_id: documentId,
    action: AccessAction.DOCUMENT_VIEW,
    ip_address: ipAddress,
    user_agent: userAgent
  });
}

// Convenience function to log document download
export async function logDocumentDownload(
  userId: string,
  documentId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AccessLog> {
  return createAccessLog({
    user_id: userId,
    document_id: documentId,
    action: AccessAction.DOCUMENT_DOWNLOAD,
    ip_address: ipAddress,
    user_agent: userAgent
  });
}