'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { InvestorRoute } from '@/components/auth/ProtectedRoute';
import DashboardNavigation from '@/components/navigation/DashboardNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { DataRoom } from '@/lib/types/database';
import Link from 'next/link';

interface DataRoomAccess extends DataRoom {
  document_count: number;
  last_accessed?: Date;
  can_access: boolean;
}

interface DataRoomsState {
  dataRooms: DataRoomAccess[];
  loading: boolean;
  error: string | null;
  accessCode: string;
  showAccessModal: boolean;
  selectedDataRoom: DataRoomAccess | null;
  accessLoading: boolean;
}

export default function DataRoomsPage() {
  const { user } = useAuth();
  const [state, setState] = useState<DataRoomsState>({
    dataRooms: [],
    loading: true,
    error: null,
    accessCode: '',
    showAccessModal: false,
    selectedDataRoom: null,
    accessLoading: false
  });

  useEffect(() => {
    loadDataRooms();
  }, []);

  const loadDataRooms = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Mock data for now - would come from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDataRooms: DataRoomAccess[] = [
        {
          id: '1',
          name: 'Project Alpha - Due Diligence',
          access_code: 'ALPHA2024',
          created_by: 'admin-user-id',
          created_at: new Date('2024-01-15'),
          is_active: true,
          expires_at: new Date('2024-12-31'),
          document_count: 15,
          last_accessed: new Date('2024-08-15'),
          can_access: true
        },
        {
          id: '2',
          name: 'Q3 Financial Reports',
          access_code: 'Q3FIN2024',
          created_by: 'admin-user-id',
          created_at: new Date('2024-07-01'),
          is_active: true,
          expires_at: new Date('2024-10-31'),
          document_count: 8,
          last_accessed: new Date('2024-08-20'),
          can_access: true
        },
        {
          id: '3',  \n          name: 'Market Analysis - Restricted',\n          access_code: 'MARKET2024',\n          created_by: 'admin-user-id',\n          created_at: new Date('2024-06-15'),\n          is_active: true,\n          document_count: 12,\n          can_access: false\n        }\n      ];\n\n      setState(prev => ({\n        ...prev,\n        dataRooms: mockDataRooms,\n        loading: false\n      }));\n\n    } catch (err: any) {\n      setState(prev => ({\n        ...prev,\n        loading: false,\n        error: err.message\n      }));\n    }\n  };\n\n  const handleAccessRequest = (dataRoom: DataRoomAccess) => {\n    setState(prev => ({\n      ...prev,\n      selectedDataRoom: dataRoom,\n      showAccessModal: true,\n      accessCode: ''\n    }));\n  };\n\n  const handleAccessSubmit = async () => {\n    if (!state.selectedDataRoom || !state.accessCode.trim()) return;\n\n    setState(prev => ({ ...prev, accessLoading: true }));\n\n    try {\n      const response = await fetch(`/api/files/access/${state.accessCode}`, {\n        method: 'POST',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify({\n          data_room_id: state.selectedDataRoom.id\n        })\n      });\n\n      if (!response.ok) {\n        const errorData = await response.json();\n        throw new Error(errorData.error?.message || 'Access denied');\n      }\n\n      // Success - refresh data rooms and close modal\n      await loadDataRooms();\n      setState(prev => ({\n        ...prev,\n        showAccessModal: false,\n        selectedDataRoom: null,\n        accessCode: '',\n        accessLoading: false\n      }));\n\n      alert('Access granted! You can now view the data room contents.');\n\n    } catch (err: any) {\n      setState(prev => ({ ...prev, accessLoading: false }));\n      alert(`Access failed: ${err.message}`);\n    }\n  };\n\n  const formatDate = (date: Date | undefined): string => {\n    if (!date) return 'Never';\n    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], {\n      hour: '2-digit',\n      minute: '2-digit'\n    });\n  };\n\n  const isExpired = (expiresAt?: Date): boolean => {\n    return expiresAt ? new Date() > new Date(expiresAt) : false;\n  };\n\n  const getStatusBadge = (dataRoom: DataRoomAccess) => {\n    if (!dataRoom.is_active) return <StatusBadge status=\"inactive\" />;\n    if (isExpired(dataRoom.expires_at)) return <StatusBadge status=\"error\" />;\n    if (!dataRoom.can_access) return <StatusBadge status=\"pending\" />;\n    return <StatusBadge status=\"active\" />;\n  };\n\n  return (\n    <InvestorRoute>\n      <div className=\"bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen\">\n        <DashboardNavigation />\n        \n        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">\n          {/* Header */}\n          <div className=\"mb-8\">\n            <h1 className=\"text-3xl font-bold text-white mb-2\">Data Rooms</h1>\n            <p className=\"text-gray-400\">\n              Secure access to confidential documents and due diligence materials\n            </p>\n          </div>\n\n          <LoadingState\n            isLoading={state.loading}\n            error={state.error}\n            loadingMessage=\"Loading data rooms...\"\n            isEmpty={state.dataRooms.length === 0}\n            emptyState={\n              <Card>\n                <CardContent className=\"text-center py-12\">\n                  <svg className=\"mx-auto h-16 w-16 text-gray-500 mb-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10\" />\n                  </svg>\n                  <h3 className=\"text-xl font-semibold text-white mb-2\">No Data Rooms Available</h3>\n                  <p className=\"text-gray-400\">\n                    No data rooms have been created or shared with you yet.\n                  </p>\n                </CardContent>\n              </Card>\n            }\n          >\n            <div className=\"grid gap-6 md:grid-cols-2 lg:grid-cols-3\">\n              {state.dataRooms.map((dataRoom) => (\n                <Card key={dataRoom.id} className=\"flex flex-col\" hover>\n                  <CardHeader>\n                    <div className=\"flex items-start justify-between\">\n                      <CardTitle size=\"md\" className=\"flex-1 mr-3\">\n                        {dataRoom.name}\n                      </CardTitle>\n                      {getStatusBadge(dataRoom)}\n                    </div>\n                  </CardHeader>\n                  <CardContent className=\"flex-1\">\n                    <div className=\"space-y-3 mb-6\">\n                      <div className=\"flex justify-between text-sm\">\n                        <span className=\"text-gray-400\">Documents</span>\n                        <span className=\"text-white font-medium\">{dataRoom.document_count}</span>\n                      </div>\n                      \n                      <div className=\"flex justify-between text-sm\">\n                        <span className=\"text-gray-400\">Created</span>\n                        <span className=\"text-white\">\n                          {new Date(dataRoom.created_at).toLocaleDateString()}\n                        </span>\n                      </div>\n                      \n                      {dataRoom.expires_at && (\n                        <div className=\"flex justify-between text-sm\">\n                          <span className=\"text-gray-400\">Expires</span>\n                          <span className={`font-medium ${\n                            isExpired(dataRoom.expires_at) ? 'text-red-400' : 'text-white'\n                          }`}>\n                            {new Date(dataRoom.expires_at).toLocaleDateString()}\n                          </span>\n                        </div>\n                      )}\n                      \n                      {dataRoom.last_accessed && (\n                        <div className=\"flex justify-between text-sm\">\n                          <span className=\"text-gray-400\">Last Accessed</span>\n                          <span className=\"text-white\">\n                            {formatDate(dataRoom.last_accessed)}\n                          </span>\n                        </div>\n                      )}\n                    </div>\n                    \n                    <div className=\"space-y-2\">\n                      {dataRoom.can_access && dataRoom.is_active && !isExpired(dataRoom.expires_at) ? (\n                        <Link href={`/dashboard/data-rooms/${dataRoom.id}`}>\n                          <Button variant=\"primary\" fullWidth>\n                            <svg className=\"w-4 h-4 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n                              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />\n                            </svg>\n                            View Documents\n                          </Button>\n                        </Link>\n                      ) : (\n                        <Button\n                          onClick={() => handleAccessRequest(dataRoom)}\n                          variant=\"outline\"\n                          fullWidth\n                          disabled={!dataRoom.is_active || isExpired(dataRoom.expires_at)}\n                        >\n                          <svg className=\"w-4 h-4 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n                            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth=\"2\" d=\"M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z\" />\n                          </svg>\n                          {dataRoom.can_access ? 'Access Expired' : 'Request Access'}\n                        </Button>\n                      )}\n                      \n                      {!dataRoom.is_active && (\n                        <p className=\"text-center text-sm text-gray-400\">This data room is inactive</p>\n                      )}\n                    </div>\n                  </CardContent>\n                </Card>\n              ))}\n            </div>\n          </LoadingState>\n        </div>\n      </div>\n\n      {/* Access Code Modal */}\n      <Modal\n        isOpen={state.showAccessModal}\n        onClose={() => setState(prev => ({\n          ...prev,\n          showAccessModal: false,\n          selectedDataRoom: null,\n          accessCode: ''\n        }))}\n        title=\"Enter Access Code\"\n        size=\"sm\"\n      >\n        <div className=\"space-y-4\">\n          <div>\n            <p className=\"text-gray-300 mb-4\">\n              Please enter the access code for \"<strong>{state.selectedDataRoom?.name}</strong>\" to gain access to its documents.\n            </p>\n            <Input\n              label=\"Access Code\"\n              value={state.accessCode}\n              onChange={(e) => setState(prev => ({ ...prev, accessCode: e.target.value }))}\n              placeholder=\"Enter access code...\"\n              fullWidth\n              autoFocus\n            />\n          </div>\n          \n          <div className=\"flex gap-3 justify-end\">\n            <Button\n              variant=\"ghost\"\n              onClick={() => setState(prev => ({\n                ...prev,\n                showAccessModal: false,\n                selectedDataRoom: null,\n                accessCode: ''\n              }))}\n              disabled={state.accessLoading}\n            >\n              Cancel\n            </Button>\n            <Button\n              variant=\"primary\"\n              onClick={handleAccessSubmit}\n              loading={state.accessLoading}\n              disabled={!state.accessCode.trim()}\n            >\n              Submit\n            </Button>\n          </div>\n        </div>\n      </Modal>\n    </InvestorRoute>\n  );\n}"