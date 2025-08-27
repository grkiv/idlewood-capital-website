'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import { InvestorRoute } from '@/components/auth/ProtectedRoute';
import DashboardNavigation from '@/components/navigation/DashboardNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, Pagination } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { SecureDocument, FileSearchParams } from '@/lib/types/files';
import { FileAccessLevel } from '@/lib/storage/config';

interface DocumentsState {
  documents: SecureDocument[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  filters: {
    fileType: string;
    accessLevel: FileAccessLevel | '';
    dateRange: string;
  };
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [state, setState] = useState<DocumentsState>({
    documents: [],
    loading: true,
    error: null,
    totalPages: 1,
    currentPage: 1,
    searchQuery: '',
    filters: {
      fileType: '',
      accessLevel: '',
      dateRange: ''
    },
    sortBy: 'uploaded_at',
    sortDirection: 'desc'
  });

  const loadDocuments = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const searchParams: FileSearchParams = {
        query: state.searchQuery || undefined,
        user_id: user?.id,
        sort_by: state.sortBy as any,
        sort_order: state.sortDirection,
        page: state.currentPage,
        limit: 20
      };

      if (state.filters.accessLevel) {
        searchParams.access_level = state.filters.accessLevel;
      }

      const queryString = new URLSearchParams(
        Object.entries(searchParams)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString();

      const response = await fetch(`/api/files/search?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load documents: ${response.statusText}`);
      }

      const result = await response.json();
      setState(prev => ({
        ...prev,
        documents: result.documents || [],
        totalPages: result.total_pages || 1,
        loading: false
      }));

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  }, [state.searchQuery, state.filters, state.sortBy, state.sortDirection, state.currentPage, user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadDocuments();
    }
  }, [user?.id, loadDocuments]);

  const handleSearch = (query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      currentPage: 1
    }));
  };

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setState(prev => ({
      ...prev,
      sortBy: key,
      sortDirection: direction
    }));
  };

  const handleDownload = async (document: SecureDocument) => {
    try {
      const response = await fetch(`/api/files/download/${document.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Refresh the document list
      loadDocuments();

    } catch (err: any) {
      console.error('Download failed:', err);
      alert(`Download failed: ${err.message}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📑';
    return '📎';
  };

  const getAccessLevelColor = (level: FileAccessLevel) => {
    switch (level) {
      case FileAccessLevel.PUBLIC: return 'success';
      case FileAccessLevel.PRIVATE: return 'warning';
      case FileAccessLevel.RESTRICTED: return 'error';
      case FileAccessLevel.CONFIDENTIAL: return 'info';
      default: return 'default';
    }
  };

  const columns = [
    {
      key: 'file_name',
      title: 'Document',
      sortable: true,
      render: (value: string, row: SecureDocument) => (
        <div className="flex items-center gap-3">
          <span className="text-xl">{getFileTypeIcon(row.mime_type)}</span>
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{value}</p>
            <p className="text-sm text-gray-400">{row.mime_type}</p>
          </div>
        </div>
      )
    },
    {
      key: 'file_size',
      title: 'Size',
      sortable: true,
      render: (value: number) => (
        <span className="text-gray-300">{formatFileSize(value)}</span>
      )
    },
    {
      key: 'access_level',
      title: 'Access',
      sortable: true,
      render: (value: FileAccessLevel) => (
        <Badge variant={getAccessLevelColor(value)}>
          {value.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'uploaded_at',
      title: 'Uploaded',
      sortable: true,
      render: (value: Date) => (
        <div className="text-gray-300">
          <p>{new Date(value).toLocaleDateString()}</p>
          <p className="text-xs text-gray-400">
            {new Date(value).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      )
    },
    {
      key: 'download_count',
      title: 'Downloads',
      sortable: true,
      render: (value: number) => (
        <span className="text-gray-300">{value}</span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: SecureDocument) => (
        <div className="flex items-center gap-2">
          <IconButton
            onClick={() => handleDownload(row)}
            variant="ghost"
            size="sm"
            title="Download"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            title="View Details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </IconButton>
        </div>
      )
    }
  ];

  return (
    <InvestorRoute>
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
        <DashboardNavigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Document Library</h1>
            <p className="text-gray-400">
              Access and download your investment documents, reports, and legal files
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search documents..."
                    value={state.searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                    fullWidth
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    value={state.filters.accessLevel}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        accessLevel: e.target.value as FileAccessLevel | ''
                      },
                      currentPage: 1
                    }))}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    <option value="">All Access Levels</option>
                    <option value={FileAccessLevel.PUBLIC}>Public</option>
                    <option value={FileAccessLevel.PRIVATE}>Private</option>
                    <option value={FileAccessLevel.RESTRICTED}>Restricted</option>
                    <option value={FileAccessLevel.CONFIDENTIAL}>Confidential</option>
                  </select>
                  
                  <Button
                    variant="outline"
                    onClick={() => setState(prev => ({
                      ...prev,
                      searchQuery: '',
                      filters: {
                        fileType: '',
                        accessLevel: '',
                        dateRange: ''
                      },
                      currentPage: 1
                    }))}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <LoadingState
            isLoading={state.loading}
            error={state.error}
            loadingMessage="Loading documents..."
            isEmpty={state.documents.length === 0}
            emptyState={
              <Card>
                <CardContent className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-white mb-2">No Documents Found</h3>
                  <p className="text-gray-400 mb-6">
                    {state.searchQuery 
                      ? `No documents match "${state.searchQuery}"`
                      : 'No documents have been shared with you yet'
                    }
                  </p>
                  {state.searchQuery && (
                    <Button
                      onClick={() => handleSearch('')}
                      variant="outline"
                    >
                      Clear Search
                    </Button>
                  )}
                </CardContent>
              </Card>
            }
          >
            <div>
              <Table
                columns={columns}
                data={state.documents}
                loading={state.loading}
                emptyMessage="No documents found"
                onSort={handleSort}
                sortKey={state.sortBy}
                sortDirection={state.sortDirection}
                rowKey={(row) => row.id}
              />
              
              {state.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={state.currentPage}
                    totalPages={state.totalPages}
                    onPageChange={(page) => setState(prev => ({ ...prev, currentPage: page }))}
                    showInfo
                    pageSize={20}
                    totalItems={state.documents.length * state.totalPages}
                  />
                </div>
              )}
            </div>
          </LoadingState>
        </div>
      </div>
    </InvestorRoute>
  );
}