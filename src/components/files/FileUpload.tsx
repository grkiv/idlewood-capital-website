'use client';

/**
 * File Upload Component
 * React component for secure file upload with progress tracking
 */

import React, { useState, useRef, useCallback } from 'react';
import { FileUploadInput, FileUploadProgress, FileUploadResult, FileErrorCode } from '@/lib/types/files';
import { FileAccessLevel } from '@/lib/storage/config';

/**
 * Upload configuration interface
 */
interface FileUploadProps {
  onUploadComplete?: (result: FileUploadResult) => void;
  onUploadProgress?: (progress: FileUploadProgress) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  className?: string;
  dataRoomId?: string;
  folderPath?: string;
  accessLevel?: FileAccessLevel;
  encrypt?: boolean;
  compress?: boolean;
}

/**
 * File upload component with drag & drop support
 */
export function FileUpload({
  onUploadComplete,
  onUploadProgress,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  allowedTypes = [],
  multiple = false,
  className = '',
  dataRoomId,
  folderPath,
  accessLevel = FileAccessLevel.PRIVATE,
  encrypt = true,
  compress = false
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file before upload
   */
  const validateFile = useCallback((file: File): string | null => {
    // Size check
    if (file.size > maxFileSize) {
      return `File "${file.name}" is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`;
    }

    // Type check
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type "${file.type}" is not allowed for "${file.name}".`;
    }

    // Name check
    if (!file.name || file.name.trim().length === 0) {
      return 'File name cannot be empty.';
    }

    if (file.name.length > 255) {
      return `File name "${file.name}" is too long (maximum 255 characters).`;
    }

    return null;
  }, [maxFileSize, allowedTypes]);

  /**
   * Upload a single file
   */
  const uploadFile = useCallback(async (file: File): Promise<FileUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add optional parameters
    if (dataRoomId) formData.append('data_room_id', dataRoomId);
    if (folderPath) formData.append('folder_path', folderPath);
    formData.append('access_level', accessLevel);
    formData.append('encrypt', encrypt.toString());
    formData.append('compress', compress.toString());

    const xhr = new XMLHttpRequest();
    
    return new Promise<FileUploadResult>((resolve, reject) => {
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded * 100) / event.total);
          const estimatedTimeRemaining = event.loaded > 0 ? 
            ((event.total - event.loaded) * (Date.now() - uploadStartTime)) / event.loaded : 
            undefined;

          const progress: FileUploadProgress = {
            file_name: file.name,
            total_size: event.total,
            uploaded_size: event.loaded,
            percentage,
            stage: percentage < 100 ? 'uploading' : 'processing',
            estimated_time_remaining: estimatedTimeRemaining
          };

          setUploadProgress(prev => 
            prev.map(p => p.file_name === file.name ? progress : p)
          );
          onUploadProgress?.(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result: FileUploadResult = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error?.message || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Upload timeout'));
      };

      const uploadStartTime = Date.now();
      xhr.timeout = 300000; // 5 minutes
      xhr.open('POST', '/api/files/upload');
      xhr.send(formData);
    });
  }, [dataRoomId, folderPath, accessLevel, encrypt, compress, onUploadProgress]);

  /**
   * Handle file selection and upload
   */
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (isUploading) return;

    const fileArray = Array.from(files);
    if (!multiple && fileArray.length > 1) {
      onUploadError?.('Multiple file upload is not allowed');
      return;
    }

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        onUploadError?.(error);
        return;
      }
    }

    setIsUploading(true);
    
    // Initialize progress tracking
    const initialProgress = fileArray.map(file => ({
      file_name: file.name,
      total_size: file.size,
      uploaded_size: 0,
      percentage: 0,
      stage: 'validating' as const
    }));
    setUploadProgress(initialProgress);

    try {
      const results: FileUploadResult[] = [];

      for (const file of fileArray) {
        try {
          // Update progress to uploading stage
          setUploadProgress(prev => 
            prev.map(p => 
              p.file_name === file.name 
                ? { ...p, stage: 'uploading' as const }
                : p
            )
          );

          const result = await uploadFile(file);
          results.push(result);

          // Update progress to complete
          setUploadProgress(prev => 
            prev.map(p => 
              p.file_name === file.name 
                ? { ...p, percentage: 100, stage: 'complete' as const }
                : p
            )
          );

          onUploadComplete?.(result);

        } catch (error: any) {
          // Update progress to error
          setUploadProgress(prev => 
            prev.map(p => 
              p.file_name === file.name 
                ? { ...p, stage: 'error' as const, error: error.message }
                : p
            )
          );

          onUploadError?.(error.message);
        }
      }

    } finally {
      setIsUploading(false);
      
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);
    }
  }, [isUploading, multiple, validateFile, uploadFile, onUploadComplete, onUploadError]);

  /**
   * Drag and drop handlers
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  /**
   * File input change handler
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    
    // Reset input value to allow uploading the same file again
    e.target.value = '';
  }, [handleFileUpload]);

  /**
   * Click handler for upload area
   */
  const handleUploadAreaClick = useCallback(() => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  }, [isUploading]);

  return (
    <div className={`file-upload-container ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          file-upload-area
          ${isDragOver ? 'drag-over' : ''}
          ${isUploading ? 'uploading' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadAreaClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleUploadAreaClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={isUploading}
        />

        <div className="upload-content">
          {isUploading ? (
            <div className="upload-status">
              <div className="spinner" />
              <p>Uploading files...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <h3>Upload Files</h3>
              <p>
                {isDragOver
                  ? 'Drop files here to upload'
                  : 'Drag & drop files here or click to browse'}
              </p>
              <div className="upload-info">
                <p>Maximum file size: {Math.round(maxFileSize / 1024 / 1024)}MB</p>
                {allowedTypes.length > 0 && (
                  <p>Allowed types: {allowedTypes.join(', ')}</p>
                )}
                {encrypt && <p>🔒 Files will be encrypted</p>}
                {compress && <p>📦 Files will be compressed</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress Display */}
      {uploadProgress.length > 0 && (
        <div className="upload-progress-container">
          <h4>Upload Progress</h4>
          {uploadProgress.map((progress) => (
            <div key={progress.file_name} className="progress-item">
              <div className="progress-header">
                <span className="file-name">{progress.file_name}</span>
                <span className="progress-percentage">
                  {progress.stage === 'complete' ? '✅' : 
                   progress.stage === 'error' ? '❌' : 
                   `${progress.percentage}%`}
                </span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              <div className="progress-details">
                <span className="stage">
                  {progress.stage === 'validating' && 'Validating...'}
                  {progress.stage === 'uploading' && 'Uploading...'}
                  {progress.stage === 'processing' && 'Processing...'}
                  {progress.stage === 'encrypting' && 'Encrypting...'}
                  {progress.stage === 'scanning' && 'Scanning...'}
                  {progress.stage === 'complete' && 'Complete'}
                  {progress.stage === 'error' && `Error: ${progress.error}`}
                </span>
                
                {progress.stage === 'uploading' && (
                  <span className="size-info">
                    {Math.round(progress.uploaded_size / 1024)} KB of {Math.round(progress.total_size / 1024)} KB
                  </span>
                )}

                {progress.estimated_time_remaining && progress.estimated_time_remaining > 0 && (
                  <span className="time-remaining">
                    {Math.round(progress.estimated_time_remaining / 1000)}s remaining
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .file-upload-container {
          width: 100%;
        }

        .file-upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fafafa;
        }

        .file-upload-area:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .file-upload-area.drag-over {
          border-color: #3b82f6;
          background: #dbeafe;
        }

        .file-upload-area.uploading {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .upload-content {
          max-width: 400px;
          margin: 0 auto;
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .upload-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .upload-info {
          margin-top: 16px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .upload-info p {
          margin: 4px 0;
        }

        .upload-progress-container {
          margin-top: 24px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .upload-progress-container h4 {
          margin: 0 0 16px 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .progress-item {
          margin-bottom: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .file-name {
          font-weight: 500;
          color: #1f2937;
        }

        .progress-percentage {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .progress-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .stage {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export default FileUpload;