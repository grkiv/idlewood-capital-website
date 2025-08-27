/**
 * File Storage Types
 * TypeScript interfaces and types for secure file storage operations
 */

import { FileAccessLevel, FileOperation, VirusScanStatus, FilePermission } from '../storage/config';

/**
 * Base file entity with enhanced security features
 */
export interface SecureDocument {
  id: string;
  user_id?: string;
  file_name: string;
  file_path: string;
  blob_url?: string;
  file_size: number;
  original_size?: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: Date;
  created_at: Date;
  updated_at?: Date;
  is_public: boolean;
  
  // Security fields
  is_encrypted: boolean;
  encryption_key_id?: string;
  hash_sha256?: string;
  access_level: FileAccessLevel;
  
  // Virus scanning
  virus_scan_status: VirusScanStatus;
  virus_scan_date?: Date;
  
  // Organization
  data_room_id?: string;
  folder_path?: string;
  
  // Access control
  allowed_user_ids?: string[];
  allowed_role_types?: string[];
  expires_at?: Date;
  
  // Metadata
  compression_ratio?: number;
  is_compressed: boolean;
  thumbnail_url?: string;
  download_count: number;
  last_accessed_at?: Date;
  watermark_text?: string;
}

/**
 * File upload input interface
 */
export interface FileUploadInput {
  file: File;
  user_id?: string;
  data_room_id?: string;
  folder_path?: string;
  is_public?: boolean;
  access_level?: FileAccessLevel;
  expires_at?: Date;
  allowed_user_ids?: string[];
  watermark_text?: string;
  encrypt?: boolean;
  compress?: boolean;
}

/**
 * File upload progress tracking
 */
export interface FileUploadProgress {
  file_name: string;
  total_size: number;
  uploaded_size: number;
  percentage: number;
  stage: 'validating' | 'uploading' | 'processing' | 'encrypting' | 'scanning' | 'complete' | 'error';
  error?: string;
  estimated_time_remaining?: number;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  success: boolean;
  document?: SecureDocument;
  error?: string;
  warnings?: string[];
}

/**
 * File download parameters
 */
export interface FileDownloadParams {
  document_id: string;
  user_id: string;
  add_watermark?: boolean;
  track_access?: boolean;
  ip_address?: string;
  user_agent?: string;
}

/**
 * File download result
 */
export interface FileDownloadResult {
  success: boolean;
  blob_url?: string;
  signed_url?: string;
  expires_at?: Date;
  content_type?: string;
  content_length?: number;
  filename?: string;
  error?: string;
}

/**
 * File access permission
 */
export interface FileAccessPermission {
  id: string;
  document_id: string;
  user_id: string;
  permission_type: FilePermission;
  granted_by: string;
  granted_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

/**
 * File access log entry
 */
export interface FileAccessLog {
  id: string;
  document_id: string;
  user_id?: string;
  action: FileOperation;
  ip_address?: string;
  user_agent?: string;
  file_size?: number;
  duration_ms?: number;
  success: boolean;
  error_message?: string;
  additional_metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Signed URL configuration
 */
export interface SignedUrlConfig {
  document_id: string;
  user_id?: string;
  action: 'download' | 'preview' | 'thumbnail';
  expires_in_seconds?: number;
  max_uses?: number;
  ip_restrictions?: string[];
  user_agent_restrictions?: string[];
}

/**
 * Signed URL result
 */
export interface SignedUrlResult {
  url: string;
  token: string;
  expires_at: Date;
  max_uses: number;
  current_uses: number;
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  id: string;
  user_id: string;
  quota_bytes: number;
  used_bytes: number;
  file_count: number;
  max_file_size: number;
  allowed_mime_types?: string[];
  created_at: Date;
  updated_at?: Date;
  
  // Computed fields
  usage_percentage?: number;
  remaining_bytes?: number;
  is_over_quota?: boolean;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  file_info?: {
    name: string;
    size: number;
    type: string;
    extension: string;
    is_compressed: boolean;
    estimated_compressed_size?: number;
  };
}

/**
 * File search parameters
 */
export interface FileSearchParams {
  query?: string;
  user_id?: string;
  data_room_id?: string;
  folder_path?: string;
  file_types?: string[];
  access_level?: FileAccessLevel;
  date_from?: Date;
  date_to?: Date;
  min_size?: number;
  max_size?: number;
  is_encrypted?: boolean;
  virus_scan_status?: VirusScanStatus;
  sort_by?: 'name' | 'size' | 'date' | 'downloads' | 'relevance';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * File search result
 */
export interface FileSearchResult {
  documents: SecureDocument[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
}

/**
 * File metadata for API responses
 */
export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  uploaded_at: Date;
  uploaded_by: {
    id: string;
    email: string;
    company_name?: string;
  };
  access_level: FileAccessLevel;
  is_encrypted: boolean;
  download_count: number;
  last_accessed_at?: Date;
  expires_at?: Date;
  thumbnail_url?: string;
  folder_path?: string;
  data_room?: {
    id: string;
    name: string;
  };
}

/**
 * Bulk file operation parameters
 */
export interface BulkFileOperation {
  document_ids: string[];
  operation: 'delete' | 'move' | 'copy' | 'change_access' | 'encrypt' | 'decrypt';
  parameters?: {
    target_folder?: string;
    target_data_room_id?: string;
    new_access_level?: FileAccessLevel;
    expires_at?: Date;
  };
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  success: boolean;
  results: {
    document_id: string;
    success: boolean;
    error?: string;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * File compression options
 */
export interface CompressionOptions {
  enabled: boolean;
  quality?: number;
  threshold_bytes?: number;
  algorithm?: 'gzip' | 'deflate' | 'brotli';
}

/**
 * Thumbnail generation options
 */
export interface ThumbnailOptions {
  enabled: boolean;
  max_width?: number;
  max_height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * File processing options
 */
export interface FileProcessingOptions {
  encryption?: {
    enabled: boolean;
    force?: boolean;
  };
  compression?: CompressionOptions;
  thumbnail?: ThumbnailOptions;
  virus_scanning?: {
    enabled: boolean;
    async?: boolean;
  };
  watermarking?: {
    enabled: boolean;
    text?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
}

/**
 * File statistics for admin dashboard
 */
export interface FileStatistics {
  total_files: number;
  total_size_bytes: number;
  encrypted_files: number;
  public_files: number;
  files_by_type: Record<string, number>;
  files_by_access_level: Record<FileAccessLevel, number>;
  virus_scan_summary: Record<VirusScanStatus, number>;
  top_downloaded_files: Array<{
    id: string;
    name: string;
    download_count: number;
  }>;
  storage_by_user: Array<{
    user_id: string;
    email: string;
    file_count: number;
    total_size: number;
  }>;
  recent_uploads: SecureDocument[];
}

/**
 * Audit log query parameters
 */
export interface AuditLogParams {
  user_id?: string;
  document_id?: string;
  action?: FileOperation;
  start_date?: Date;
  end_date?: Date;
  success?: boolean;
  ip_address?: string;
  page?: number;
  limit?: number;
}

/**
 * Data room file organization
 */
export interface DataRoomFileStructure {
  id: string;
  name: string;
  folders: Array<{
    path: string;
    name: string;
    file_count: number;
    total_size: number;
    documents: SecureDocument[];
  }>;
  total_files: number;
  total_size: number;
}

/**
 * File export/backup configuration
 */
export interface FileExportConfig {
  document_ids?: string[];
  user_id?: string;
  data_room_id?: string;
  include_metadata?: boolean;
  include_permissions?: boolean;
  include_audit_logs?: boolean;
  format?: 'zip' | 'tar' | 'individual';
  encryption?: boolean;
}

/**
 * File import configuration
 */
export interface FileImportConfig {
  files: File[];
  target_user_id?: string;
  target_data_room_id?: string;
  folder_path?: string;
  preserve_structure?: boolean;
  access_level?: FileAccessLevel;
  encrypt?: boolean;
  overwrite_existing?: boolean;
}

/**
 * API response wrapper for file operations
 */
export interface FileApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  metadata?: {
    request_id: string;
    timestamp: Date;
    processing_time_ms: number;
  };
}

/**
 * File URL generation parameters
 */
export interface FileUrlParams {
  document_id: string;
  action: 'download' | 'preview' | 'thumbnail';
  expires_in?: number;
  disposition?: 'inline' | 'attachment';
  watermark?: boolean;
}

/**
 * Error types for file operations
 */
export enum FileErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  ACCESS_DENIED = 'ACCESS_DENIED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  VIRUS_DETECTED = 'VIRUS_DETECTED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  EXPIRED_URL = 'EXPIRED_URL',
  INVALID_TOKEN = 'INVALID_TOKEN'
}

/**
 * File operation error
 */
export interface FileError extends Error {
  code: FileErrorCode;
  details?: any;
  document_id?: string;
  user_id?: string;
}