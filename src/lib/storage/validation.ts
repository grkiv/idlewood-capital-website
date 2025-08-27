/**
 * File Validation and Processing Utilities
 * Comprehensive file validation, virus scanning preparation, and processing
 */

import { fileTypeFromBuffer } from 'file-type';
import mimeTypes from 'mime-types';
import { getCachedStorageConfig, isFileTypeAllowed, shouldCompress, shouldGenerateThumbnail } from './config';
import { FileValidationResult, FileProcessingOptions } from '../types/files';
import { generateFileHash } from './encryption';

/**
 * Maximum file size constants
 */
const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024; // 1GB (Vercel Blob limit)
const MIN_FILE_SIZE_BYTES = 1; // 1 byte minimum

/**
 * Dangerous file signatures (magic numbers) to check
 */
const DANGEROUS_SIGNATURES = new Map([
  // Executables
  ['4D5A', 'PE/COFF executable'],
  ['7F454C46', 'ELF executable'],
  ['CAFEBABE', 'Java bytecode'],
  ['FEEDFACE', 'Mach-O binary'],
  ['CEFAEDFE', 'Mach-O binary (reverse)'],
  
  // Scripts
  ['23212F', 'Shell script (#!/)'],
  ['3C3F706870', 'PHP script'],
  ['3C25', 'ASP/JSP script'],
  
  // Archive bombs (partial detection)
  ['504B0304', 'ZIP file (check for zip bomb)'],
  ['1F8B08', 'GZIP file (check compression ratio)'],
]);

/**
 * File type detection result
 */
export interface FileTypeInfo {
  mimeType: string;
  extension: string;
  isRecognized: boolean;
  detectedType?: string;
}

/**
 * Security scan result
 */
export interface SecurityScanResult {
  safe: boolean;
  issues: string[];
  warnings: string[];
  suspiciousContent: boolean;
  compressionRatio?: number;
}

/**
 * Detect file type from buffer
 */
export async function detectFileType(buffer: ArrayBuffer): Promise<FileTypeInfo> {
  const uint8Array = new Uint8Array(buffer);
  const detected = await fileTypeFromBuffer(uint8Array);
  
  if (detected) {
    return {
      mimeType: detected.mime,
      extension: detected.ext,
      isRecognized: true,
      detectedType: detected.mime
    };
  }
  
  // Fallback to basic analysis
  return {
    mimeType: 'application/octet-stream',
    extension: 'bin',
    isRecognized: false
  };
}

/**
 * Validate file buffer against dangerous signatures
 */
export function scanForDangerousSignatures(buffer: ArrayBuffer): SecurityScanResult {
  const uint8Array = new Uint8Array(buffer);
  const issues: string[] = [];
  const warnings: string[] = [];
  let suspiciousContent = false;
  
  // Check first 16 bytes for known dangerous signatures
  const header = Array.from(uint8Array.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join('');
  
  for (const [signature, description] of DANGEROUS_SIGNATURES.entries()) {
    if (header.startsWith(signature)) {
      if (signature === '504B0304') {
        // ZIP file - check for potential zip bomb
        warnings.push('ZIP archive detected - checking for compression bomb');
      } else if (signature === '1F8B08') {
        // GZIP file - check compression ratio
        warnings.push('GZIP archive detected - checking compression ratio');
      } else {
        issues.push(`Potentially dangerous file type detected: ${description}`);
        suspiciousContent = true;
      }
    }
  }
  
  // Check for embedded executables (simplified)
  if (header.includes('4D5A') && buffer.byteLength > 1000) {
    warnings.push('File may contain embedded executable content');
    suspiciousContent = true;
  }
  
  // Basic zip bomb detection (high compression ratio)
  let compressionRatio: number | undefined;
  if (header.startsWith('504B') || header.startsWith('1F8B')) {
    // This is a simplified check - in production you'd want more sophisticated detection
    const estimatedUncompressedSize = buffer.byteLength * 10; // Assume 10:1 is suspicious
    compressionRatio = estimatedUncompressedSize / buffer.byteLength;
    
    if (compressionRatio > 100) {
      issues.push('Potential zip bomb detected - extremely high compression ratio');
      suspiciousContent = true;
    } else if (compressionRatio > 50) {
      warnings.push('High compression ratio detected - possible zip bomb');
    }
  }
  
  return {
    safe: issues.length === 0,
    issues,
    warnings,
    suspiciousContent,
    compressionRatio
  };
}

/**
 * Validate file size and quota
 */
export async function validateFileSizeAndQuota(
  fileSize: number,
  userId: string,
  currentUsageBytes: number = 0
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const config = getCachedStorageConfig();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic size checks
  if (fileSize < MIN_FILE_SIZE_BYTES) {
    errors.push('File is empty or corrupted');
  }
  
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    errors.push(`File size exceeds maximum limit of ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB`);
  }
  
  if (fileSize > config.maxFileSize) {
    errors.push(`File size exceeds configured limit of ${Math.round(config.maxFileSize / 1024 / 1024)}MB`);
  }
  
  // Quota check (would need to query database in real implementation)
  const estimatedQuotaUsage = currentUsageBytes + fileSize;
  if (estimatedQuotaUsage > config.defaultQuotaBytes) {
    errors.push('File would exceed storage quota');
  }
  
  // Warning for large files
  if (fileSize > config.maxFileSize * 0.8) {
    warnings.push('File is close to maximum size limit');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
  file: File,
  userId: string,
  currentUsageBytes: number = 0
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = getCachedStorageConfig();
  
  try {
    // Basic file properties validation
    if (!file.name || file.name.trim().length === 0) {
      errors.push('File name is required');
    }
    
    if (file.name.length > 255) {
      errors.push('File name is too long (maximum 255 characters)');
    }
    
    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.(exe|scr|bat|cmd|com|pif|vbs|js|jar|app)$/i,
      /\.(asp|php|jsp|cgi)$/i,
      /\.(sh|bash|zsh|fish)$/i,
      /^\./,  // Hidden files
      /\.\./  // Directory traversal
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        errors.push('File name contains suspicious patterns');
        break;
      }
    }
    
    // Size validation
    const sizeValidation = await validateFileSizeAndQuota(file.size, userId, currentUsageBytes);
    errors.push(...sizeValidation.errors);
    warnings.push(...sizeValidation.warnings);
    
    // Read file buffer for advanced validation
    const buffer = await file.arrayBuffer();
    
    // Detect actual file type
    const fileTypeInfo = await detectFileType(buffer);
    
    // MIME type validation
    const declaredMimeType = file.type || mimeTypes.lookup(file.name) || 'application/octet-stream';
    
    if (fileTypeInfo.isRecognized && fileTypeInfo.mimeType !== declaredMimeType) {
      warnings.push(`File type mismatch: declared as ${declaredMimeType}, detected as ${fileTypeInfo.mimeType}`);
    }
    
    // Check if file type is allowed
    const actualMimeType = fileTypeInfo.isRecognized ? fileTypeInfo.mimeType : declaredMimeType;
    if (!isFileTypeAllowed(actualMimeType, config)) {
      errors.push(`File type ${actualMimeType} is not allowed`);
    }
    
    // Security scan
    const securityScan = scanForDangerousSignatures(buffer);
    errors.push(...securityScan.issues);
    warnings.push(...securityScan.warnings);
    
    // Additional checks for specific file types
    if (actualMimeType.startsWith('image/')) {
      // Basic image validation could be added here
      if (buffer.byteLength < 100) {
        errors.push('Image file appears to be corrupted (too small)');
      }
    }
    
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: actualMimeType,
      extension: fileTypeInfo.extension,
      is_compressed: shouldCompress(file.size, actualMimeType, config),
      estimated_compressed_size: shouldCompress(file.size, actualMimeType, config) 
        ? Math.round(file.size * 0.7) // Rough estimate
        : undefined
    };
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      file_info: fileInfo
    };
    
  } catch (error) {
    console.error('File validation error:', error);
    return {
      valid: false,
      errors: ['File validation failed due to internal error'],
      warnings: []
    };
  }
}

/**
 * Prepare virus scanning metadata
 * In production, this would integrate with actual antivirus services
 */
export function prepareVirusScanMetadata(file: File, fileHash: string) {
  return {
    filename: file.name,
    size: file.size,
    mimeType: file.type,
    hash: fileHash,
    scanRequested: new Date(),
    scanProvider: 'pending', // Would be actual provider like ClamAV, VirusTotal, etc.
    scanId: `scan_${Date.now()}_${Math.random().toString(36).substring(2)}`
  };
}

/**
 * Generate processing recommendations based on file analysis
 */
export function generateProcessingRecommendations(
  file: File,
  validationResult: FileValidationResult
): FileProcessingOptions {
  const config = getCachedStorageConfig();
  const fileInfo = validationResult.file_info;
  
  if (!fileInfo) {
    return {
      encryption: { enabled: false },
      compression: { enabled: false },
      thumbnail: { enabled: false },
      virus_scanning: { enabled: false }
    };
  }
  
  return {
    encryption: {
      enabled: config.encryptionEnabled,
      force: fileInfo.type.includes('financial') || fileInfo.name.toLowerCase().includes('confidential')
    },
    
    compression: {
      enabled: fileInfo.is_compressed && fileInfo.size > config.compressionThreshold,
      quality: config.compressionQuality,
      threshold_bytes: config.compressionThreshold,
      algorithm: 'gzip'
    },
    
    thumbnail: {
      enabled: shouldGenerateThumbnail(fileInfo.type, config),
      max_width: config.thumbnailMaxWidth,
      max_height: config.thumbnailMaxHeight,
      quality: config.thumbnailQuality,
      format: 'jpeg'
    },
    
    virus_scanning: {
      enabled: config.virusScanningEnabled,
      async: fileInfo.size > 50 * 1024 * 1024 // Async for files > 50MB
    },
    
    watermarking: {
      enabled: false, // Will be set based on access level and user preferences
      position: 'bottom-right'
    }
  };
}

/**
 * Extract file metadata for database storage
 */
export async function extractFileMetadata(
  file: File,
  processingOptions: FileProcessingOptions
): Promise<{
  hash: string;
  metadata: Record<string, any>;
}> {
  const buffer = await file.arrayBuffer();
  const hash = await generateFileHash(buffer);
  const typeInfo = await detectFileType(buffer);
  
  const metadata = {
    originalName: file.name,
    originalSize: file.size,
    detectedMimeType: typeInfo.mimeType,
    detectedExtension: typeInfo.extension,
    isTypeRecognized: typeInfo.isRecognized,
    processingRecommended: processingOptions,
    extractedAt: new Date(),
    clientLastModified: file.lastModified ? new Date(file.lastModified) : null
  };
  
  return {
    hash,
    metadata
  };
}

/**
 * Sanitize filename for secure storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace dangerous chars with underscore
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Collapse multiple underscores
    .trim();
  
  // Ensure filename isn't empty
  if (!sanitized || sanitized === '_') {
    sanitized = 'unnamed_file';
  }
  
  // Limit length
  if (sanitized.length > 200) {
    const lastDotIndex = sanitized.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const name = sanitized.substring(0, lastDotIndex);
      const extension = sanitized.substring(lastDotIndex);
      sanitized = name.substring(0, 200 - extension.length) + extension;
    } else {
      sanitized = sanitized.substring(0, 200);
    }
  }
  
  return sanitized;
}

/**
 * Check if file upload would exceed quota
 */
export function wouldExceedQuota(
  fileSize: number,
  currentUsage: number,
  quotaLimit: number,
  bufferPercentage: number = 0.05 // 5% buffer
): boolean {
  const effectiveLimit = quotaLimit * (1 - bufferPercentage);
  return (currentUsage + fileSize) > effectiveLimit;
}

/**
 * Estimate processing time based on file size and operations
 */
export function estimateProcessingTime(
  fileSize: number,
  operations: FileProcessingOptions
): number {
  let estimatedMs = 100; // Base processing time
  
  // Upload time (rough estimate: 1MB/second)
  estimatedMs += (fileSize / (1024 * 1024)) * 1000;
  
  // Encryption overhead
  if (operations.encryption?.enabled) {
    estimatedMs += (fileSize / (1024 * 1024)) * 200; // 200ms per MB
  }
  
  // Compression overhead
  if (operations.compression?.enabled) {
    estimatedMs += (fileSize / (1024 * 1024)) * 500; // 500ms per MB
  }
  
  // Thumbnail generation
  if (operations.thumbnail?.enabled) {
    estimatedMs += 2000; // Fixed 2 seconds for thumbnail
  }
  
  // Virus scanning
  if (operations.virus_scanning?.enabled) {
    estimatedMs += (fileSize / (1024 * 1024)) * 300; // 300ms per MB
  }
  
  return Math.round(estimatedMs);
}