'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { InvestorRoute } from '@/components/auth/ProtectedRoute';
import DashboardNavigation from '@/components/navigation/DashboardNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { AccessAction } from '@/lib/types/database';

interface ActivityLog {
  id: string;
  user_id: string;
  document_id?: string;
  action: AccessAction;
  ip_address?: string;
  timestamp: Date;
  document_name?: string;
  data_room_name?: string;
  details?: string;
}

interface ActivityState {
  activities: ActivityLog[];
  loading: boolean;
  error: string | null;
  filters: {
    action: AccessAction | '';
    dateRange: string;
    search: string;
  };
  page: number;
  totalPages: number;
}

export default function ActivityPage() {
  const { user } = useAuth();
  const [state, setState] = useState<ActivityState>({
    activities: [],
    loading: true,
    error: null,
    filters: {
      action: '',
      dateRange: '30',
      search: ''
    },
    page: 1,
    totalPages: 1
  });

  useEffect(() => {
    loadActivity();
  }, [state.filters, state.page]);

  const loadActivity = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Mock data for now - would come from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockActivities: ActivityLog[] = [
        {
          id: '1',
          user_id: user?.id || '',
          document_id: 'doc-1',
          action: AccessAction.DOCUMENT_DOWNLOAD,
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          document_name: 'Q3 Financial Report.pdf',
          details: 'Downloaded quarterly financial report'
        },
        {
          id: '2',
          user_id: user?.id || '',
          action: AccessAction.DATA_ROOM_ACCESS,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          data_room_name: 'Project Alpha - Due Diligence',
          details: 'Accessed data room with 15 documents'
        },\n        {\n          id: '3',\n          user_id: user?.id || '',\n          document_id: 'doc-2',\n          action: AccessAction.DOCUMENT_VIEW,\n          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),\n          document_name: 'Investment Summary.docx',\n          details: 'Viewed investment summary document'\n        },\n        {\n          id: '4',\n          user_id: user?.id || '',\n          action: AccessAction.LOGIN,\n          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),\n          ip_address: '192.168.1.100',\n          details: 'Logged into investor portal'\n        },\n        {\n          id: '5',\n          user_id: user?.id || '',\n          document_id: 'doc-3',\n          action: AccessAction.DOCUMENT_DOWNLOAD,\n          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),\n          document_name: 'Legal Agreement.pdf',\n          details: 'Downloaded legal documentation'\n        },\n        {\n          id: '6',\n          user_id: user?.id || '',\n          action: AccessAction.DATA_ROOM_ACCESS,\n          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),\n          data_room_name: 'Q3 Financial Reports',\n          details: 'Accessed quarterly reports data room'\n        }\n      ];\n\n      // Apply filters\n      let filteredActivities = mockActivities;\n      \n      if (state.filters.action) {\n        filteredActivities = filteredActivities.filter(a => a.action === state.filters.action);\n      }\n      \n      if (state.filters.search) {\n        const searchLower = state.filters.search.toLowerCase();\n        filteredActivities = filteredActivities.filter(a => \n          a.document_name?.toLowerCase().includes(searchLower) ||\n          a.data_room_name?.toLowerCase().includes(searchLower) ||\n          a.details?.toLowerCase().includes(searchLower)\n        );\n      }\n      \n      if (state.filters.dateRange !== 'all') {\n        const days = parseInt(state.filters.dateRange);\n        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);\n        filteredActivities = filteredActivities.filter(a => new Date(a.timestamp) > cutoff);\n      }\n\n      setState(prev => ({\n        ...prev,\n        activities: filteredActivities,\n        loading: false,\n        totalPages: Math.ceil(filteredActivities.length / 20)\n      }));\n\n    } catch (err: any) {\n      setState(prev => ({\n        ...prev,\n        loading: false,\n        error: err.message\n      }));\n    }\n  };\n\n  const getActionIcon = (action: AccessAction) => {\n    switch (action) {\n      case AccessAction.LOGIN:\n        return (\n          <svg className=\"w-5 h-5 text-green-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1\" />\n          </svg>\n        );\n      case AccessAction.LOGOUT:\n        return (\n          <svg className=\"w-5 h-5 text-red-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1\" />\n          </svg>\n        );\n      case AccessAction.DOCUMENT_VIEW:\n        return (\n          <svg className=\"w-5 h-5 text-blue-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M15 12a3 3 0 11-6 0 3 3 0 016 0z\" />\n            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z\" />\n          </svg>\n        );\n      case AccessAction.DOCUMENT_DOWNLOAD:\n        return (\n          <svg className=\"w-5 h-5 text-purple-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10\" />\n          </svg>\n        );\n      case AccessAction.DATA_ROOM_ACCESS:\n        return (\n          <svg className=\"w-5 h-5 text-yellow-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10\" />\n          </svg>\n        );\n      default:\n        return (\n          <svg className=\"w-5 h-5 text-gray-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />\n          </svg>\n        );\n    }\n  };\n\n  const formatActionName = (action: AccessAction): string => {\n    switch (action) {\n      case AccessAction.LOGIN: return 'Login';\n      case AccessAction.LOGOUT: return 'Logout';\n      case AccessAction.DOCUMENT_VIEW: return 'Document View';\n      case AccessAction.DOCUMENT_DOWNLOAD: return 'Document Download';\n      case AccessAction.DATA_ROOM_ACCESS: return 'Data Room Access';\n      case AccessAction.FILE_UPLOAD: return 'File Upload';\n      case AccessAction.FILE_DELETE: return 'File Delete';\n      case AccessAction.FILE_SHARE: return 'File Share';\n      default: return action;\n    }\n  };\n\n  const formatTimeAgo = (date: Date): string => {\n    const now = new Date();\n    const diffMs = now.getTime() - date.getTime();\n    const diffMins = Math.floor(diffMs / 60000);\n    const diffHours = Math.floor(diffMs / 3600000);\n    const diffDays = Math.floor(diffMs / 86400000);\n\n    if (diffMins < 1) return 'Just now';\n    if (diffMins < 60) return `${diffMins}m ago`;\n    if (diffHours < 24) return `${diffHours}h ago`;\n    if (diffDays < 30) return `${diffDays}d ago`;\n    return date.toLocaleDateString();\n  };\n\n  const actionOptions = [\n    { value: '', label: 'All Actions' },\n    { value: AccessAction.LOGIN, label: 'Login' },\n    { value: AccessAction.LOGOUT, label: 'Logout' },\n    { value: AccessAction.DOCUMENT_VIEW, label: 'Document View' },\n    { value: AccessAction.DOCUMENT_DOWNLOAD, label: 'Document Download' },\n    { value: AccessAction.DATA_ROOM_ACCESS, label: 'Data Room Access' }\n  ];\n\n  const dateRangeOptions = [\n    { value: '1', label: 'Last 24 hours' },\n    { value: '7', label: 'Last 7 days' },\n    { value: '30', label: 'Last 30 days' },\n    { value: '90', label: 'Last 90 days' },\n    { value: 'all', label: 'All time' }\n  ];\n\n  return (\n    <InvestorRoute>\n      <div className=\"bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen\">\n        <DashboardNavigation />\n        \n        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">\n          {/* Header */}\n          <div className=\"mb-8\">\n            <h1 className=\"text-3xl font-bold text-white mb-2\">Activity Log</h1>\n            <p className=\"text-gray-400\">\n              Track your document access, downloads, and login history\n            </p>\n          </div>\n\n          {/* Filters */}\n          <Card className=\"mb-6\">\n            <CardContent>\n              <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">\n                <Input\n                  placeholder=\"Search activities...\"\n                  value={state.filters.search}\n                  onChange={(e) => setState(prev => ({\n                    ...prev,\n                    filters: { ...prev.filters, search: e.target.value },\n                    page: 1\n                  }))}\n                  icon={<svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\" />\n                  </svg>}\n                  fullWidth\n                />\n                \n                <Select\n                  label=\"Action Type\"\n                  value={state.filters.action}\n                  onChange={(e) => setState(prev => ({\n                    ...prev,\n                    filters: { ...prev.filters, action: e.target.value as AccessAction | '' },\n                    page: 1\n                  }))}\n                  options={actionOptions}\n                  fullWidth\n                />\n                \n                <Select\n                  label=\"Time Range\"\n                  value={state.filters.dateRange}\n                  onChange={(e) => setState(prev => ({\n                    ...prev,\n                    filters: { ...prev.filters, dateRange: e.target.value },\n                    page: 1\n                  }))}\n                  options={dateRangeOptions}\n                  fullWidth\n                />\n              </div>\n            </CardContent>\n          </Card>\n\n          {/* Activity List */}\n          <LoadingState\n            isLoading={state.loading}\n            error={state.error}\n            loadingMessage=\"Loading activity log...\"\n            isEmpty={state.activities.length === 0}\n            emptyState={\n              <Card>\n                <CardContent className=\"text-center py-12\">\n                  <svg className=\"mx-auto h-16 w-16 text-gray-500 mb-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\" />\n                  </svg>\n                  <h3 className=\"text-xl font-semibold text-white mb-2\">No Activity Found</h3>\n                  <p className=\"text-gray-400 mb-6\">\n                    {state.filters.search || state.filters.action\n                      ? 'No activities match your current filters'\n                      : 'No activity recorded yet'\n                    }\n                  </p>\n                  {(state.filters.search || state.filters.action) && (\n                    <Button\n                      onClick={() => setState(prev => ({\n                        ...prev,\n                        filters: { action: '', dateRange: '30', search: '' },\n                        page: 1\n                      }))}\n                      variant=\"outline\"\n                    >\n                      Clear Filters\n                    </Button>\n                  )}\n                </CardContent>\n              </Card>\n            }\n          >\n            <Card>\n              <CardContent>\n                <div className=\"space-y-4\">\n                  {state.activities.map((activity, index) => (\n                    <div key={activity.id} className=\"flex items-start space-x-4 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors\">\n                      <div className=\"flex-shrink-0 mt-1\">\n                        {getActionIcon(activity.action)}\n                      </div>\n                      \n                      <div className=\"flex-1 min-w-0\">\n                        <div className=\"flex items-center justify-between mb-1\">\n                          <p className=\"text-white font-medium\">\n                            {formatActionName(activity.action)}\n                          </p>\n                          <span className=\"text-sm text-gray-400\">\n                            {formatTimeAgo(activity.timestamp)}\n                          </span>\n                        </div>\n                        \n                        {activity.document_name && (\n                          <p className=\"text-gray-300 text-sm mb-1\">\n                            Document: <span className=\"text-gold-400\">{activity.document_name}</span>\n                          </p>\n                        )}\n                        \n                        {activity.data_room_name && (\n                          <p className=\"text-gray-300 text-sm mb-1\">\n                            Data Room: <span className=\"text-gold-400\">{activity.data_room_name}</span>\n                          </p>\n                        )}\n                        \n                        {activity.details && (\n                          <p className=\"text-gray-400 text-sm\">{activity.details}</p>\n                        )}\n                        \n                        {activity.ip_address && (\n                          <p className=\"text-gray-400 text-xs mt-1\">\n                            IP: {activity.ip_address}\n                          </p>\n                        )}\n                      </div>\n                      \n                      <div className=\"text-xs text-gray-500\">\n                        {new Date(activity.timestamp).toLocaleTimeString([], {\n                          hour: '2-digit',\n                          minute: '2-digit'\n                        })}\n                      </div>\n                    </div>\n                  ))}\n                </div>\n              </CardContent>\n            </Card>\n          </LoadingState>\n        </div>\n      </div>\n    </InvestorRoute>\n  );\n}"