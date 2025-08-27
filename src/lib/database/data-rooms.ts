import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import {
  DataRoom,
  CreateDataRoomInput,
  UpdateDataRoomInput,
  DataRoomWithDetails,
  DataRoomDocument,
  CreateDataRoomDocumentInput,
  PaginationParams
} from '../types/database';

/**
 * Data room database operations
 */

// Create a new data room
export async function createDataRoom(roomData: CreateDataRoomInput): Promise<DataRoom> {
  const id = uuidv4();
  
  const result = await sql`
    INSERT INTO data_rooms (
      id, name, access_code, created_by, expires_at, is_active
    ) VALUES (
      ${id},
      ${roomData.name},
      ${roomData.access_code},
      ${roomData.created_by},
      ${roomData.expires_at || null},
      ${roomData.is_active !== false}
    )
    RETURNING id, name, access_code, created_by, expires_at, created_at, updated_at, is_active
  `;

  return result.rows[0] as DataRoom;
}

// Get data room by ID
export async function getDataRoomById(id: string): Promise<DataRoom | null> {
  const result = await sql`
    SELECT id, name, access_code, created_by, expires_at, created_at, updated_at, is_active
    FROM data_rooms
    WHERE id = ${id} AND is_active = true
  `;

  return result.rows[0] as DataRoom || null;
}

// Get data room by access code
export async function getDataRoomByAccessCode(accessCode: string): Promise<DataRoom | null> {
  const result = await sql`
    SELECT id, name, access_code, created_by, expires_at, created_at, updated_at, is_active
    FROM data_rooms
    WHERE access_code = ${accessCode} 
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > NOW())
  `;

  return result.rows[0] as DataRoom || null;
}

// Get data room with full details (creator and documents)
export async function getDataRoomWithDetails(id: string): Promise<DataRoomWithDetails | null> {
  const result = await sql`
    SELECT 
      dr.id, dr.name, dr.access_code, dr.created_by, dr.expires_at, 
      dr.created_at, dr.updated_at, dr.is_active,
      u.id as creator_id, u.email as creator_email, u.company_name as creator_company,
      COUNT(drd.document_id) as document_count
    FROM data_rooms dr
    LEFT JOIN users u ON dr.created_by = u.id
    LEFT JOIN data_room_documents drd ON dr.id = drd.data_room_id
    WHERE dr.id = ${id} AND dr.is_active = true
    GROUP BY dr.id, dr.name, dr.access_code, dr.created_by, dr.expires_at, 
             dr.created_at, dr.updated_at, dr.is_active,
             u.id, u.email, u.company_name
  `;

  const row = result.rows[0];
  if (!row) return null;

  // Get documents for this data room
  const documentsResult = await sql`
    SELECT 
      d.id, d.user_id, d.file_name, d.file_path, d.file_size, d.mime_type, 
      d.uploaded_by, d.uploaded_at, d.created_at, d.updated_at, d.is_public,
      u.id as uploader_id, u.email as uploader_email, u.company_name as uploader_company
    FROM data_room_documents drd
    JOIN documents d ON drd.document_id = d.id
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE drd.data_room_id = ${id}
    ORDER BY drd.added_at DESC
  `;

  return {
    ...row,
    document_count: parseInt(row.document_count || '0'),
    creator: row.creator_id ? {
      id: row.creator_id,
      email: row.creator_email,
      company_name: row.creator_company
    } : undefined,
    documents: documentsResult.rows.map(doc => ({
      ...doc,
      uploader: doc.uploader_id ? {
        id: doc.uploader_id,
        email: doc.uploader_email,
        company_name: doc.uploader_company
      } : undefined
    }))
  } as DataRoomWithDetails;
}

// Update data room
export async function updateDataRoom(id: string, updates: UpdateDataRoomInput): Promise<DataRoom | null> {
  const setParts: string[] = [];
  const values: any[] = [];
  let valueIndex = 1;

  if (updates.name !== undefined) {
    setParts.push(`name = $${valueIndex++}`);
    values.push(updates.name);
  }
  if (updates.access_code !== undefined) {
    setParts.push(`access_code = $${valueIndex++}`);
    values.push(updates.access_code);
  }
  if (updates.expires_at !== undefined) {
    setParts.push(`expires_at = $${valueIndex++}`);
    values.push(updates.expires_at);
  }
  if (updates.is_active !== undefined) {
    setParts.push(`is_active = $${valueIndex++}`);
    values.push(updates.is_active);
  }

  if (setParts.length === 0) {
    return await getDataRoomById(id);
  }

  values.push(id);
  const query = `
    UPDATE data_rooms 
    SET ${setParts.join(', ')}, updated_at = NOW()
    WHERE id = $${valueIndex} AND is_active = true
    RETURNING id, name, access_code, created_by, expires_at, created_at, updated_at, is_active
  `;

  const result = await sql.query(query, values);
  return result.rows[0] as DataRoom || null;
}

// Soft delete data room (set is_active to false)
export async function deleteDataRoom(id: string): Promise<boolean> {
  const result = await sql`
    UPDATE data_rooms 
    SET is_active = false, updated_at = NOW()
    WHERE id = ${id}
  `;

  return result.rowCount > 0;
}

// Get data rooms with pagination
export async function getDataRooms(params: PaginationParams = {}): Promise<DataRoomWithDetails[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT 
      dr.id, dr.name, dr.access_code, dr.created_by, dr.expires_at, 
      dr.created_at, dr.updated_at, dr.is_active,
      u.id as creator_id, u.email as creator_email, u.company_name as creator_company,
      COUNT(drd.document_id) as document_count
    FROM data_rooms dr
    LEFT JOIN users u ON dr.created_by = u.id
    LEFT JOIN data_room_documents drd ON dr.id = drd.data_room_id
    WHERE dr.is_active = true
    GROUP BY dr.id, dr.name, dr.access_code, dr.created_by, dr.expires_at, 
             dr.created_at, dr.updated_at, dr.is_active,
             u.id, u.email, u.company_name
    ORDER BY dr.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows.map(row => ({
    ...row,
    document_count: parseInt(row.document_count || '0'),
    creator: row.creator_id ? {
      id: row.creator_id,
      email: row.creator_email,
      company_name: row.creator_company
    } : undefined
  })) as DataRoomWithDetails[];
}

// Get data rooms created by a user
export async function getDataRoomsByCreator(
  creatorId: string, 
  params: PaginationParams = {}
): Promise<DataRoomWithDetails[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT 
      dr.id, dr.name, dr.access_code, dr.created_by, dr.expires_at, 
      dr.created_at, dr.updated_at, dr.is_active,
      u.id as creator_id, u.email as creator_email, u.company_name as creator_company,
      COUNT(drd.document_id) as document_count
    FROM data_rooms dr
    LEFT JOIN users u ON dr.created_by = u.id
    LEFT JOIN data_room_documents drd ON dr.id = drd.data_room_id
    WHERE dr.created_by = ${creatorId} AND dr.is_active = true
    GROUP BY dr.id, dr.name, dr.access_code, dr.created_by, dr.expires_at, 
             dr.created_at, dr.updated_at, dr.is_active,
             u.id, u.email, u.company_name
    ORDER BY dr.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows.map(row => ({
    ...row,
    document_count: parseInt(row.document_count || '0'),
    creator: row.creator_id ? {
      id: row.creator_id,
      email: row.creator_email,
      company_name: row.creator_company
    } : undefined
  })) as DataRoomWithDetails[];
}

// Count data rooms
export async function getDataRoomCount(filters?: { created_by?: string; is_active?: boolean }): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM data_rooms';
  const conditions: string[] = [];
  const values: any[] = [];
  let valueIndex = 1;

  if (filters?.created_by) {
    conditions.push(`created_by = $${valueIndex++}`);
    values.push(filters.created_by);
  }

  if (filters?.is_active !== undefined) {
    conditions.push(`is_active = $${valueIndex++}`);
    values.push(filters.is_active);
  } else {
    conditions.push('is_active = true'); // Default to active only
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = await sql.query(query, values);
  return parseInt(result.rows[0].count);
}

/**
 * Data room document operations
 */

// Add document to data room
export async function addDocumentToDataRoom(
  roomDocumentData: CreateDataRoomDocumentInput
): Promise<DataRoomDocument> {
  const id = uuidv4();
  
  const result = await sql`
    INSERT INTO data_room_documents (id, data_room_id, document_id)
    VALUES (${id}, ${roomDocumentData.data_room_id}, ${roomDocumentData.document_id})
    ON CONFLICT (data_room_id, document_id) DO NOTHING
    RETURNING id, data_room_id, document_id, added_at
  `;

  if (result.rows.length === 0) {
    // Document already exists in the room, fetch it
    const existing = await sql`
      SELECT id, data_room_id, document_id, added_at
      FROM data_room_documents
      WHERE data_room_id = ${roomDocumentData.data_room_id} 
        AND document_id = ${roomDocumentData.document_id}
    `;
    return existing.rows[0] as DataRoomDocument;
  }

  return result.rows[0] as DataRoomDocument;
}

// Remove document from data room
export async function removeDocumentFromDataRoom(
  dataRoomId: string,
  documentId: string
): Promise<boolean> {
  const result = await sql`
    DELETE FROM data_room_documents
    WHERE data_room_id = ${dataRoomId} AND document_id = ${documentId}
  `;

  return result.rowCount > 0;
}

// Get documents in a data room
export async function getDataRoomDocuments(
  dataRoomId: string,
  params: PaginationParams = {}
): Promise<any[]> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const result = await sql`
    SELECT 
      d.id, d.user_id, d.file_name, d.file_path, d.file_size, d.mime_type, 
      d.uploaded_by, d.uploaded_at, d.created_at, d.updated_at, d.is_public,
      u.id as uploader_id, u.email as uploader_email, u.company_name as uploader_company,
      drd.added_at
    FROM data_room_documents drd
    JOIN documents d ON drd.document_id = d.id
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE drd.data_room_id = ${dataRoomId}
    ORDER BY drd.added_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return result.rows.map(row => ({
    ...row,
    uploader: row.uploader_id ? {
      id: row.uploader_id,
      email: row.uploader_email,
      company_name: row.uploader_company
    } : undefined
  }));
}

// Check if document exists in data room
export async function isDocumentInDataRoom(
  dataRoomId: string,
  documentId: string
): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM data_room_documents
    WHERE data_room_id = ${dataRoomId} AND document_id = ${documentId}
  `;

  return result.rows.length > 0;
}

// Generate unique access code
export async function generateUniqueAccessCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existing = await sql`
      SELECT 1 FROM data_rooms WHERE access_code = ${code}
    `;

    if (existing.rows.length === 0) {
      return code;
    }

    attempts++;
  }

  throw new Error('Unable to generate unique access code after maximum attempts');
}

// Get expired data rooms
export async function getExpiredDataRooms(): Promise<DataRoom[]> {
  const result = await sql`
    SELECT id, name, access_code, created_by, expires_at, created_at, updated_at, is_active
    FROM data_rooms
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW() 
      AND is_active = true
  `;

  return result.rows as DataRoom[];
}

// Deactivate expired data rooms
export async function deactivateExpiredDataRooms(): Promise<number> {
  const result = await sql`
    UPDATE data_rooms 
    SET is_active = false, updated_at = NOW()
    WHERE expires_at IS NOT NULL 
      AND expires_at < NOW() 
      AND is_active = true
  `;

  return result.rowCount;
}