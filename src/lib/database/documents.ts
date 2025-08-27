import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import {
  Document,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentWithUser,
  PaginationParams,
  SearchParams
} from '../types/database';

/**
 * Document database operations
 */

// Create a new document
export async function createDocument(documentData: CreateDocumentInput): Promise<Document> {
  const id = uuidv4();
  
  const result = await sql`
    INSERT INTO documents (
      id, user_id, file_name, file_path, file_size, mime_type, uploaded_by, is_public
    ) VALUES (
      ${id},
      ${documentData.user_id || null},
      ${documentData.file_name},
      ${documentData.file_path},
      ${documentData.file_size},
      ${documentData.mime_type},
      ${documentData.uploaded_by},
      ${documentData.is_public !== undefined ? documentData.is_public : false}
    )
    RETURNING id, user_id, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at, created_at, updated_at, is_public
  `;

  return result.rows[0] as Document;
}

// Get document by ID
export async function getDocumentById(id: string): Promise<Document | null> {
  const result = await sql`
    SELECT id, user_id, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at, created_at, updated_at, is_public
    FROM documents
    WHERE id = ${id}
  `;

  return result.rows[0] as Document || null;
}

// Get document with uploader information
export async function getDocumentWithUser(id: string): Promise<DocumentWithUser | null> {
  const result = await sql`
    SELECT 
      d.id, d.user_id, d.file_name, d.file_path, d.file_size, d.mime_type, 
      d.uploaded_by, d.uploaded_at, d.created_at, d.updated_at, d.is_public,
      u.id as uploader_id, u.email as uploader_email, u.company_name as uploader_company
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.id = ${id}
  `;

  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    uploader: row.uploader_id ? {
      id: row.uploader_id,
      email: row.uploader_email,
      company_name: row.uploader_company
    } : undefined
  } as DocumentWithUser;
}

// Update document
export async function updateDocument(id: string, updates: UpdateDocumentInput): Promise<Document | null> {
  const setParts: string[] = [];
  const values: any[] = [];
  let valueIndex = 1;

  if (updates.file_name !== undefined) {
    setParts.push(`file_name = $${valueIndex++}`);
    values.push(updates.file_name);
  }
  if (updates.file_path !== undefined) {
    setParts.push(`file_path = $${valueIndex++}`);
    values.push(updates.file_path);
  }
  if (updates.is_public !== undefined) {
    setParts.push(`is_public = $${valueIndex++}`);
    values.push(updates.is_public);
  }

  if (setParts.length === 0) {
    return await getDocumentById(id);
  }

  values.push(id);
  const query = `
    UPDATE documents 
    SET ${setParts.join(', ')}, updated_at = NOW()
    WHERE id = $${valueIndex}
    RETURNING id, user_id, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at, created_at, updated_at, is_public
  `;

  const result = await sql.query(query, values);
  return result.rows[0] as Document || null;
}

// Delete document
export async function deleteDocument(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM documents WHERE id = ${id}
  `;

  return result.rowCount > 0;
}

// Get documents with pagination and search
export async function getDocuments(
  params: PaginationParams & SearchParams = {}
): Promise<DocumentWithUser[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;
  const searchQuery = params.query;
  const sortField = params.sort?.field || 'uploaded_at';
  const sortDirection = params.sort?.direction || 'DESC';

  let baseQuery = `
    SELECT 
      d.id, d.user_id, d.file_name, d.file_path, d.file_size, d.mime_type, 
      d.uploaded_by, d.uploaded_at, d.created_at, d.updated_at, d.is_public,
      u.id as uploader_id, u.email as uploader_email, u.company_name as uploader_company
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
  `;

  const conditions: string[] = [];
  const values: any[] = [];
  let valueIndex = 1;

  if (searchQuery) {
    conditions.push(`d.file_name ILIKE $${valueIndex++}`);
    values.push(`%${searchQuery}%`);
  }

  if (params.filters?.is_public !== undefined) {
    conditions.push(`d.is_public = $${valueIndex++}`);
    values.push(params.filters.is_public);
  }

  if (params.filters?.user_id) {
    conditions.push(`d.user_id = $${valueIndex++}`);
    values.push(params.filters.user_id);
  }

  if (params.filters?.uploaded_by) {
    conditions.push(`d.uploaded_by = $${valueIndex++}`);
    values.push(params.filters.uploaded_by);
  }

  if (conditions.length > 0) {
    baseQuery += ` WHERE ${conditions.join(' AND ')}`;
  }

  baseQuery += ` ORDER BY d.${sortField} ${sortDirection}`;
  baseQuery += ` LIMIT $${valueIndex++} OFFSET $${valueIndex++}`;
  
  values.push(limit, offset);

  const result = await sql.query(baseQuery, values);
  
  return result.rows.map(row => ({
    ...row,
    uploader: row.uploader_id ? {
      id: row.uploader_id,
      email: row.uploader_email,
      company_name: row.uploader_company
    } : undefined
  })) as DocumentWithUser[];
}

// Get documents by user
export async function getDocumentsByUser(
  userId: string, 
  params: PaginationParams = {}
): Promise<Document[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT id, user_id, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at, created_at, updated_at, is_public
    FROM documents
    WHERE user_id = ${userId} OR uploaded_by = ${userId}
    ORDER BY uploaded_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows as Document[];
}

// Get public documents
export async function getPublicDocuments(params: PaginationParams = {}): Promise<DocumentWithUser[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT 
      d.id, d.user_id, d.file_name, d.file_path, d.file_size, d.mime_type, 
      d.uploaded_by, d.uploaded_at, d.created_at, d.updated_at, d.is_public,
      u.id as uploader_id, u.email as uploader_email, u.company_name as uploader_company
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.is_public = true
    ORDER BY d.uploaded_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows.map(row => ({
    ...row,
    uploader: row.uploader_id ? {
      id: row.uploader_id,
      email: row.uploader_email,
      company_name: row.uploader_company
    } : undefined
  })) as DocumentWithUser[];
}

// Count documents
export async function getDocumentCount(filters?: { user_id?: string; is_public?: boolean }): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM documents';
  const conditions: string[] = [];
  const values: any[] = [];
  let valueIndex = 1;

  if (filters?.user_id) {
    conditions.push(`(user_id = $${valueIndex++} OR uploaded_by = $${valueIndex - 1})`);
    values.push(filters.user_id);
  }

  if (filters?.is_public !== undefined) {
    conditions.push(`is_public = $${valueIndex++}`);
    values.push(filters.is_public);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = await sql.query(query, values);
  return parseInt(result.rows[0].count);
}

// Get documents by MIME type
export async function getDocumentsByMimeType(
  mimeType: string, 
  params: PaginationParams = {}
): Promise<Document[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT id, user_id, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at, created_at, updated_at, is_public
    FROM documents
    WHERE mime_type = ${mimeType}
    ORDER BY uploaded_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows as Document[];
}

// Search documents by filename
export async function searchDocuments(
  searchTerm: string, 
  params: PaginationParams = {}
): Promise<DocumentWithUser[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT 
      d.id, d.user_id, d.file_name, d.file_path, d.file_size, d.mime_type, 
      d.uploaded_by, d.uploaded_at, d.created_at, d.updated_at, d.is_public,
      u.id as uploader_id, u.email as uploader_email, u.company_name as uploader_company,
      ts_rank(to_tsvector('english', d.file_name), plainto_tsquery('english', ${searchTerm})) as rank
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE to_tsvector('english', d.file_name) @@ plainto_tsquery('english', ${searchTerm})
    ORDER BY rank DESC, d.uploaded_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows.map(row => ({
    ...row,
    uploader: row.uploader_id ? {
      id: row.uploader_id,
      email: row.uploader_email,
      company_name: row.uploader_company
    } : undefined
  })) as DocumentWithUser[];
}