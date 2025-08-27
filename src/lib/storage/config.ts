/**
 * File Storage Configuration
 * Centralized configuration for Vercel Blob storage and security settings
 */

export interface StorageConfig {
  // Vercel Blob Configuration
  blobReadWriteToken: string;
  blobBaseUrl?: string;
  
  // Security Configuration
  encryptionEnabled: boolean;
  encryptionKey: string;
  virusScanningEnabled: boolean;
  
  // File Limits
  maxFileSize: number; // bytes
  maxFilesPerUser: number;
  defaultQuotaBytes: number;
  
  // Allowed File Types
  allowedMimeTypes: string[];
  restrictedMimeTypes: string[];
  
  // Temporary Access
  defaultSignedUrlExpiry: number; // seconds
  maxSignedUrlExpiry: number; // seconds
  
  // Compression
  compressionEnabled: boolean;
  compressionThreshold: number; // bytes
  compressionQuality: number; // 0-100
  
  // Thumbnails
  thumbnailEnabled: boolean;
  thumbnailMaxWidth: number;
  thumbnailMaxHeight: number;
  thumbnailQuality: number;
}

/**
 * Get storage configuration from environment variables
 */
export function getStorageConfig(): StorageConfig {
  return {
    // Vercel Blob
    blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN || '',
    blobBaseUrl: process.env.BLOB_BASE_URL,
    
    // Security
    encryptionEnabled: process.env.FILE_ENCRYPTION_ENABLED === 'true',
    encryptionKey: process.env.FILE_ENCRYPTION_KEY || '',
    virusScanningEnabled: process.env.VIRUS_SCANNING_ENABLED === 'true',
    
    // File Limits (defaults)
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
    maxFilesPerUser: parseInt(process.env.MAX_FILES_PER_USER || '1000'),
    defaultQuotaBytes: parseInt(process.env.DEFAULT_QUOTA_BYTES || '10737418240'), // 10GB
    
    // MIME Types
    allowedMimeTypes: [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/rtf',
      
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/tiff',
      'image/bmp',
      
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-tar',
      
      // Other business formats
      'application/json',
      'application/xml',
      'text/xml'
    ],
    
    restrictedMimeTypes: [
      'application/x-executable',
      'application/x-msdownload',
      'application/x-msdos-program',
      'application/x-msdos-windows',
      'application/x-download',
      'application/bat',
      'application/x-bat',
      'application/com',
      'application/x-com',
      'application/exe',
      'application/x-exe',
      'application/x-winexe',
      'application/x-winhlp',
      'application/x-winhelp',
      'application/x-javascript',
      'text/javascript',
      'application/hta'
    ],
    
    // Temporary Access
    defaultSignedUrlExpiry: parseInt(process.env.DEFAULT_SIGNED_URL_EXPIRY || '3600'), // 1 hour
    maxSignedUrlExpiry: parseInt(process.env.MAX_SIGNED_URL_EXPIRY || '604800'), // 1 week
    
    // Compression
    compressionEnabled: process.env.FILE_COMPRESSION_ENABLED !== 'false',
    compressionThreshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1048576'), // 1MB
    compressionQuality: parseInt(process.env.COMPRESSION_QUALITY || '85'),
    
    // Thumbnails
    thumbnailEnabled: process.env.THUMBNAIL_ENABLED !== 'false',
    thumbnailMaxWidth: parseInt(process.env.THUMBNAIL_MAX_WIDTH || '300'),
    thumbnailMaxHeight: parseInt(process.env.THUMBNAIL_MAX_HEIGHT || '300'),
    thumbnailQuality: parseInt(process.env.THUMBNAIL_QUALITY || '80')
  };
}

/**
 * Validate storage configuration
 */
export function validateStorageConfig(config: StorageConfig): void {
  const errors: string[] = [];
  
  if (!config.blobReadWriteToken) {
    errors.push('BLOB_READ_WRITE_TOKEN is required');
  }
  
  if (config.encryptionEnabled && !config.encryptionKey) {
    errors.push('FILE_ENCRYPTION_KEY is required when encryption is enabled');
  }
  
  if (config.encryptionKey && config.encryptionKey.length < 32) {
    errors.push('FILE_ENCRYPTION_KEY must be at least 32 characters long');
  }
  
  if (config.maxFileSize < 1024) {
    errors.push('MAX_FILE_SIZE must be at least 1KB');
  }
  
  if (config.maxFileSize > 1073741824) { // 1GB
    errors.push('MAX_FILE_SIZE cannot exceed 1GB for Vercel Blob');
  }
  
  if (config.compressionQuality < 1 || config.compressionQuality > 100) {
    errors.push('COMPRESSION_QUALITY must be between 1 and 100');
  }
  
  if (config.thumbnailQuality < 1 || config.thumbnailQuality > 100) {
    errors.push('THUMBNAIL_QUALITY must be between 1 and 100');
  }
  
  if (errors.length > 0) {
    throw new Error(`Storage configuration errors:\n${errors.join('\n')}`);
  }
}

/**
 * File security levels
 */
export enum FileAccessLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
  CONFIDENTIAL = 'confidential'
}

/**
 * File operation types for audit logging
 */
export enum FileOperation {
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  VIEW = 'view',
  DELETE = 'delete',
  SHARE = 'share',
  PREVIEW = 'preview',
  THUMBNAIL = 'thumbnail'
}

/**
 * Virus scan status types
 */
export enum VirusScanStatus {
  PENDING = 'pending',
  CLEAN = 'clean',
  INFECTED = 'infected',
  ERROR = 'error',
  SKIPPED = 'skipped'
}

/**
 * File permission types
 */
export enum FilePermission {
  READ = 'read',
  DOWNLOAD = 'download',
  SHARE = 'share',
  DELETE = 'delete',
  ADMIN = 'admin'
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(originalName: string, userId: string): string {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 15);
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100); // Limit length
  
  return `${userId}/${timestamp}_${randomSuffix}_${sanitizedName}${extension ? '.' + extension : ''}`;
}

/**
 * Check if file type is allowed
 */
export function isFileTypeAllowed(mimeType: string, config: StorageConfig): boolean {
  // Check if explicitly restricted
  if (config.restrictedMimeTypes.includes(mimeType)) {
    return false;
  }
  
  // Check if in allowed list
  return config.allowedMimeTypes.includes(mimeType);
}

/**
 * Check if file should be compressed
 */
export function shouldCompress(fileSize: number, mimeType: string, config: StorageConfig): boolean {
  if (!config.compressionEnabled || fileSize < config.compressionThreshold) {
    return false;
  }
  
  // Don't compress already compressed formats
  const nonCompressibleTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'video/*',
    'audio/*'
  ];
  
  return !nonCompressibleTypes.some(type => 
    type.endsWith('*') ? mimeType.startsWith(type.slice(0, -1)) : mimeType === type
  );
}

/**
 * Check if thumbnail should be generated
 */
export function shouldGenerateThumbnail(mimeType: string, config: StorageConfig): boolean {
  if (!config.thumbnailEnabled) {
    return false;
  }
  
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/bmp'];
  return imageTypes.includes(mimeType);
}

/**
 * Generate folder path for file organization
 */
export function generateFolderPath(userId: string, dataRoomId?: string, customPath?: string): string {
  const basePath = `users/${userId}`;
  
  if (dataRoomId) {
    return `${basePath}/data-rooms/${dataRoomId}${customPath ? `/${customPath}` : ''}`;
  }
  
  if (customPath) {
    return `${basePath}/${customPath}`;
  }
  
  return `${basePath}/documents`;
}

/**
 * Storage configuration singleton
 */
let cachedConfig: StorageConfig | null = null;

export function getCachedStorageConfig(): StorageConfig {
  if (!cachedConfig) {
    cachedConfig = getStorageConfig();
    validateStorageConfig(cachedConfig);
  }
  return cachedConfig;
}