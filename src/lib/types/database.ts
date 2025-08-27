// User roles enum
export enum UserRole {
  ADMIN = 'admin',
  INVESTOR = 'investor',
  USER = 'user'
}

// Access log actions enum
export enum AccessAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  DOCUMENT_VIEW = 'document_view',
  DOCUMENT_DOWNLOAD = 'document_download',
  DATA_ROOM_ACCESS = 'data_room_access',
  FILE_UPLOAD = 'file_upload',
  FILE_DELETE = 'file_delete',
  FILE_SHARE = 'file_share',
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke'
}

// Base entity interface
interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at?: Date;
}

// User entity
export interface User extends BaseEntity {
  email: string;
  password_hash: string;
  role: UserRole;
  company_name?: string;
  last_login?: Date;
  is_active: boolean;
}

// User creation input (without id, timestamps, and password_hash)
export interface CreateUserInput {
  email: string;
  password: string;
  role?: UserRole;
  company_name?: string;
  is_active?: boolean;
}

// User update input
export interface UpdateUserInput {
  email?: string;
  role?: UserRole;
  company_name?: string;
  is_active?: boolean;
  last_login?: Date;
}

// Document entity
export interface Document extends BaseEntity {
  user_id?: string; // FK to users table
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string; // FK to users table
  uploaded_at: Date;
  is_public: boolean;
}

// Document creation input
export interface CreateDocumentInput {
  user_id?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  is_public?: boolean;
}

// Document update input
export interface UpdateDocumentInput {
  file_name?: string;
  file_path?: string;
  is_public?: boolean;
}

// Access log entity
export interface AccessLog {
  id: string;
  user_id?: string; // FK to users table
  document_id?: string; // FK to documents table
  action: AccessAction;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}

// Access log creation input
export interface CreateAccessLogInput {
  user_id?: string;
  document_id?: string;
  action: AccessAction;
  ip_address?: string;
  user_agent?: string;
}

// Data room entity
export interface DataRoom extends BaseEntity {
  name: string;
  access_code: string;
  created_by: string; // FK to users table
  expires_at?: Date;
  is_active: boolean;
}

// Data room creation input
export interface CreateDataRoomInput {
  name: string;
  access_code: string;
  created_by: string;
  expires_at?: Date;
  is_active?: boolean;
}

// Data room update input
export interface UpdateDataRoomInput {
  name?: string;
  access_code?: string;
  expires_at?: Date;
  is_active?: boolean;
}

// Data room documents junction entity
export interface DataRoomDocument {
  id: string;
  data_room_id: string; // FK to data_rooms table
  document_id: string; // FK to documents table
  added_at: Date;
}

// Data room document creation input
export interface CreateDataRoomDocumentInput {
  data_room_id: string;
  document_id: string;
}

// Query result types
export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// Search parameters
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'ASC' | 'DESC';
  };
}

// Database error types
export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  table?: string;
  column?: string;
}

// User with related data for detailed views
export interface UserWithStats extends User {
  document_count?: number;
  last_access?: Date;
  data_rooms_created?: number;
}

// Document with user information
export interface DocumentWithUser extends Document {
  uploader?: Pick<User, 'id' | 'email' | 'company_name'>;
}

// Data room with documents and creator info
export interface DataRoomWithDetails extends DataRoom {
  creator?: Pick<User, 'id' | 'email' | 'company_name'>;
  documents?: DocumentWithUser[];
  document_count?: number;
}

// Access log with user and document details
export interface AccessLogWithDetails extends AccessLog {
  user?: Pick<User, 'id' | 'email' | 'company_name'>;
  document?: Pick<Document, 'id' | 'file_name'>;
}