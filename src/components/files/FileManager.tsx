'use client';

/**
 * File Manager Component
 * React component for file listing, download, and management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  SecureDocument, 
  FileSearchParams, 
  FileSearchResult,
  FileMetadata,
  FileErrorCode
} from '@/lib/types/files';
import { FileAccessLevel } from '@/lib/storage/config';

/**
 * File manager props
 */
interface FileManagerProps {
  userId?: string;
  dataRoomId?: string;
  folderPath?: string;
  allowUpload?: boolean;
  allowDelete?: boolean;
  allowShare?: boolean;
  className?: string;
  onFileSelect?: (file: SecureDocument) => void;
  onFileDownload?: (file: SecureDocument) => void;
  onFileDelete?: (file: SecureDocument) => void;
}

/**
 * File item component
 */
interface FileItemProps {
  file: SecureDocument;
  onDownload: (file: SecureDocument) => void;
  onDelete?: (file: SecureDocument) => void;
  onShare?: (file: SecureDocument) => void;
  onSelect?: (file: SecureDocument) => void;
  allowDelete?: boolean;
  allowShare?: boolean;
}

function FileItem({ 
  file, 
  onDownload, 
  onDelete, 
  onShare, 
  onSelect,
  allowDelete = false,
  allowShare = false 
}: FileItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      onDownload(file);
    } finally {
      setIsDownloading(false);
    }
  }, [file, onDownload, isDownloading]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📑';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="file-item">
      <div className="file-main">
        <div className="file-info" onClick={() => onSelect?.(file)}>
          <div className="file-icon">
            {getFileIcon(file.mime_type)}
            {file.is_encrypted && <span className="encryption-badge">🔒</span>}
          </div>
          
          <div className="file-details">
            <h4 className="file-name" title={file.file_name}>
              {file.file_name}
            </h4>
            <div className="file-meta">
              <span className="file-size">{formatFileSize(file.file_size)}</span>
              <span className="file-date">{formatDate(file.uploaded_at)}</span>
              <span className={`access-level ${file.access_level}`}>
                {file.access_level}
              </span>
              {file.download_count > 0 && (
                <span className="download-count">
                  {file.download_count} downloads
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="file-actions">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="action-btn download-btn"
            title="Download file"
          >
            {isDownloading ? '⏳' : '⬇️'}
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="action-btn details-btn"
            title="View details"
          >
            ℹ️
          </button>

          {allowShare && onShare && (
            <button
              onClick={() => onShare(file)}
              className="action-btn share-btn"
              title="Share file"
            >
              🔗
            </button>
          )}

          {allowDelete && onDelete && (
            <button
              onClick={() => onDelete(file)}
              className="action-btn delete-btn"
              title="Delete file"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="file-details-panel">
          <div className="detail-row">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{file.mime_type}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Uploaded:</span>
            <span className="detail-value">{formatDate(file.uploaded_at)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Size:</span>
            <span className="detail-value">{formatFileSize(file.file_size)}</span>
          </div>
          {file.original_size && file.original_size !== file.file_size && (
            <div className="detail-row">
              <span className="detail-label">Original Size:</span>
              <span className="detail-value">
                {formatFileSize(file.original_size)}
                <span className="compression-info">
                  (compressed {Math.round((1 - file.file_size / file.original_size) * 100)}%)
                </span>
              </span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Access Level:</span>
            <span className="detail-value">{file.access_level}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Encrypted:</span>
            <span className="detail-value">{file.is_encrypted ? 'Yes' : 'No'}</span>
          </div>
          {file.expires_at && (
            <div className="detail-row">
              <span className="detail-label">Expires:</span>
              <span className="detail-value">{formatDate(file.expires_at)}</span>
            </div>
          )}
          {file.folder_path && (
            <div className="detail-row">
              <span className="detail-label">Folder:</span>
              <span className="detail-value">{file.folder_path}</span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .file-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          margin-bottom: 8px;
          overflow: hidden;
        }

        .file-main {
          display: flex;
          align-items: center;
          padding: 12px 16px;
        }

        .file-info {
          flex: 1;
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .file-icon {
          position: relative;
          font-size: 24px;
          margin-right: 12px;
          min-width: 32px;
        }

        .encryption-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 12px;
        }

        .file-details {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 500;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-meta {
          display: flex;
          gap: 12px;
          font-size: 0.75rem;
          color: #6b7280;
          flex-wrap: wrap;
        }

        .access-level {
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .access-level.public {
          background: #dcfce7;
          color: #166534;
        }

        .access-level.private {
          background: #fef3c7;
          color: #92400e;
        }

        .access-level.restricted {
          background: #fecaca;
          color: #991b1b;
        }

        .access-level.confidential {
          background: #e0e7ff;
          color: #3730a3;
        }

        .file-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: #f3f4f6;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .download-btn:hover {
          background: #dbeafe;
          border-color: #3b82f6;
        }

        .share-btn:hover {
          background: #ecfdf5;
          border-color: #10b981;
        }

        .delete-btn:hover {
          background: #fee2e2;
          border-color: #dc2626;
        }

        .file-details-panel {
          padding: 16px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .detail-row {
          display: flex;
          margin-bottom: 8px;
        }

        .detail-label {
          font-weight: 500;
          color: #374151;
          min-width: 120px;
        }

        .detail-value {
          color: #6b7280;
          flex: 1;
        }

        .compression-info {
          font-size: 0.75rem;
          color: #10b981;
          margin-left: 8px;
        }
      `}</style>
    </div>
  );
}

/**
 * Main file manager component
 */
export function FileManager({
  userId,
  dataRoomId,
  folderPath,
  allowUpload = false,
  allowDelete = false,
  allowShare = false,
  className = '',
  onFileSelect,
  onFileDownload,
  onFileDelete
}: FileManagerProps) {
  const [files, setFiles] = useState<SecureDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'downloads'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  /**
   * Load files from API
   */
  const loadFiles = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const searchParams: FileSearchParams = {
        query: searchQuery || undefined,
        user_id: userId,
        data_room_id: dataRoomId,
        folder_path: folderPath,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage,
        limit: 20
      };

      const queryString = new URLSearchParams(
        Object.entries(searchParams)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString();

      const response = await fetch(`/api/files/search?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load files: ${response.statusText}`);
      }

      const result: FileSearchResult = await response.json();
      setFiles(result.documents);
      setTotalPages(result.total_pages);

    } catch (err: any) {
      console.error('Failed to load files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, dataRoomId, folderPath, searchQuery, sortBy, sortOrder, currentPage, loading]);

  /**
   * Handle file download
   */
  const handleDownload = useCallback(async (file: SecureDocument) => {
    try {
      const response = await fetch(`/api/files/download/${file.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onFileDownload?.(file);

      // Refresh the file list to update download count
      loadFiles();

    } catch (err: any) {
      console.error('Download failed:', err);
      setError(`Download failed: ${err.message}`);
    }
  }, [onFileDownload, loadFiles]);

  /**
   * Handle file deletion
   */
  const handleDelete = useCallback(async (file: SecureDocument) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Delete failed');
      }

      onFileDelete?.(file);
      loadFiles(); // Refresh list

    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(`Delete failed: ${err.message}`);
    }
  }, [onFileDelete, loadFiles]);

  /**
   * Handle file sharing
   */
  const handleShare = useCallback(async (file: SecureDocument) => {
    try {
      const response = await fetch(`/api/files/share/${file.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expires_in_hours: 24,
          max_downloads: 10
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Share failed');
      }

      const result = await response.json();
      
      // Copy share link to clipboard
      await navigator.clipboard.writeText(result.shareUrl);
      alert('Share link copied to clipboard!');

    } catch (err: any) {
      console.error('Share failed:', err);
      setError(`Share failed: ${err.message}`);
    }
  }, []);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((file: SecureDocument) => {
    onFileSelect?.(file);
  }, [onFileSelect]);

  /**
   * Handle search
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page
  }, []);

  /**
   * Load files when dependencies change
   */
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <div className={`file-manager ${className}`}>
      {/* Header */}
      <div className="file-manager-header">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="downloads">Downloads</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? '🔼' : '🔽'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} className="dismiss-btn">✕</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading files...</span>
        </div>
      )}

      {/* File List */}
      <div className="file-list">
        {files.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No files found</h3>
            <p>
              {searchQuery 
                ? `No files match "${searchQuery}"`
                : 'No files have been uploaded yet'}
            </p>
          </div>
        )}

        {files.map(file => (
          <FileItem
            key={file.id}
            file={file}
            onDownload={handleDownload}
            onDelete={allowDelete ? handleDelete : undefined}
            onShare={allowShare ? handleShare : undefined}
            onSelect={handleFileSelect}
            allowDelete={allowDelete}
            allowShare={allowShare}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
            className="pagination-btn"
          >
            Previous
          </button>

          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      <style jsx>{`
        .file-manager {
          width: 100%;
        }

        .file-manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 16px;
        }

        .search-controls {
          flex: 1;
        }

        .search-input {
          width: 100%;
          max-width: 300px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .sort-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .sort-select {
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .sort-order-btn {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 6px 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .error-message {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .dismiss-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #991b1b;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px;
          color: #6b7280;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .file-list {
          min-height: 200px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 1.25rem;
          color: #374151;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding: 16px;
        }

        .pagination-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 14px;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 14px;
          color: #6b7280;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default FileManager;