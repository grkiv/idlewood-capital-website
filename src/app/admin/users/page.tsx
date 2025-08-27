'use client';

import { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import DashboardNavigation from '@/components/navigation/DashboardNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button, IconButton } from '@/components/ui/Button';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { Table, Pagination } from '@/components/ui/Table';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { User, UserRole, CreateUserInput } from '@/lib/types/database';
import Link from 'next/link';

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  filters: {
    search: string;
    role: UserRole | '';
    status: 'all' | 'active' | 'inactive';
  };
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  showCreateModal: boolean;
  showDeleteModal: boolean;
  selectedUser: User | null;
}

interface NewUserForm {
  email: string;
  password: string;
  role: UserRole;
  company_name: string;
  is_active: boolean;
}

export default function UsersPage() {
  const [state, setState] = useState<UsersState>({
    users: [],
    loading: true,
    error: null,
    totalPages: 1,
    currentPage: 1,
    filters: {
      search: '',
      role: '',
      status: 'all'
    },
    sortBy: 'created_at',
    sortDirection: 'desc',
    showCreateModal: false,
    showDeleteModal: false,
    selectedUser: null
  });

  const [newUser, setNewUser] = useState<NewUserForm>({
    email: '',
    password: '',
    role: UserRole.INVESTOR,
    company_name: '',
    is_active: true
  });

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [state.filters, state.sortBy, state.sortDirection, state.currentPage]);

  const loadUsers = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Mock data - would come from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@idlewoodcapital.com',
          password_hash: 'hashed',
          role: UserRole.ADMIN,
          company_name: 'Idlewood Capital',
          last_login: new Date(Date.now() - 30 * 60 * 1000),
          is_active: true,
          created_at: new Date('2024-01-15')
        },
        {
          id: '2',
          email: 'investor1@company.com',
          password_hash: 'hashed',
          role: UserRole.INVESTOR,
          company_name: 'ABC Investment Corp',
          last_login: new Date(Date.now() - 2 * 60 * 60 * 1000),
          is_active: true,
          created_at: new Date('2024-02-01')
        },
        {
          id: '3',
          email: 'investor2@firm.com',
          password_hash: 'hashed',
          role: UserRole.INVESTOR,
          company_name: 'XYZ Investment Firm',
          last_login: new Date(Date.now() - 24 * 60 * 60 * 1000),
          is_active: true,
          created_at: new Date('2024-02-15')
        },
        {
          id: '4',
          email: 'inactive@example.com',
          password_hash: 'hashed',
          role: UserRole.INVESTOR,
          company_name: 'Inactive Company',
          is_active: false,
          created_at: new Date('2024-01-30')
        }
      ];

      // Apply filters
      let filteredUsers = mockUsers;
      
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(search) ||
          user.company_name?.toLowerCase().includes(search)
        );
      }

      if (state.filters.role) {
        filteredUsers = filteredUsers.filter(user => user.role === state.filters.role);
      }

      if (state.filters.status !== 'all') {
        const isActive = state.filters.status === 'active';
        filteredUsers = filteredUsers.filter(user => user.is_active === isActive);
      }

      setState(prev => ({
        ...prev,
        users: filteredUsers,
        totalPages: Math.ceil(filteredUsers.length / 20),
        loading: false
      }));

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real implementation, this would make API call
      console.log('Creating user:', newUser);
      
      // Reset form and close modal
      setNewUser({
        email: '',
        password: '',
        role: UserRole.INVESTOR,
        company_name: '',
        is_active: true
      });
      
      setState(prev => ({ ...prev, showCreateModal: false }));
      
      // Reload users
      await loadUsers();
      
    } catch (err: any) {
      alert(`Failed to create user: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!state.selectedUser) return;

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Deleting user:', state.selectedUser.id);
      
      setState(prev => ({
        ...prev,
        showDeleteModal: false,
        selectedUser: null
      }));
      
      // Reload users
      await loadUsers();
      
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Toggling user status:', user.id, !user.is_active);
      
      // Reload users
      await loadUsers();
      
    } catch (err: any) {
      alert(`Failed to update user: ${err.message}`);
    }
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'email',
      title: 'User',
      sortable: true,
      render: (value: string, row: User) => (
        <div>
          <p className="text-white font-medium">{value}</p>
          {row.company_name && (
            <p className="text-sm text-gray-400">{row.company_name}</p>
          )}
        </div>
      )
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value: UserRole) => <RoleBadge role={value} />
    },
    {
      key: 'is_active',
      title: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <StatusBadge status={value ? 'active' : 'inactive'} />
      )
    },
    {
      key: 'last_login',
      title: 'Last Login',
      sortable: true,
      render: (value: Date | undefined) => (
        <span className="text-gray-300">{formatDate(value)}</span>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value: Date) => (
        <span className="text-gray-300">{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: User) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/users/${row.id}`}>
            <IconButton variant="ghost" size="sm" title="Edit User">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </IconButton>
          </Link>
          
          <IconButton
            onClick={() => toggleUserStatus(row)}
            variant="ghost"
            size="sm"
            title={row.is_active ? 'Deactivate User' : 'Activate User'}
          >
            {row.is_active ? (
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </IconButton>

          <IconButton
            onClick={() => setState(prev => ({
              ...prev,
              selectedUser: row,
              showDeleteModal: true
            }))}
            variant="ghost"
            size="sm"
            title="Delete User"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </IconButton>
        </div>
      )
    }
  ];

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: UserRole.ADMIN, label: 'Admin' },
    { value: UserRole.INVESTOR, label: 'Investor' },
    { value: UserRole.USER, label: 'User' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active Only' },
    { value: 'inactive', label: 'Inactive Only' }
  ];

  return (
    <AdminRoute>
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
        <DashboardNavigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
              <p className="text-gray-400">
                Create, edit, and manage investor and admin accounts
              </p>
            </div>
            <Button
              onClick={() => setState(prev => ({ ...prev, showCreateModal: true }))}
              variant="primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create User
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search users..."
                  value={state.filters.search}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    filters: { ...prev.filters, search: e.target.value },
                    currentPage: 1
                  }))}
                  icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>}
                  fullWidth
                />
                
                <Select
                  label="Role"
                  value={state.filters.role}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    filters: { ...prev.filters, role: e.target.value as UserRole | '' },
                    currentPage: 1
                  }))}
                  options={roleOptions}
                  fullWidth
                />
                
                <Select
                  label="Status"
                  value={state.filters.status}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    filters: { ...prev.filters, status: e.target.value as any },
                    currentPage: 1
                  }))}
                  options={statusOptions}
                  fullWidth
                />
                
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setState(prev => ({
                      ...prev,
                      filters: { search: '', role: '', status: 'all' },
                      currentPage: 1
                    }))}
                    fullWidth
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <LoadingState
            isLoading={state.loading}
            error={state.error}
            loadingMessage="Loading users..."
            isEmpty={state.users.length === 0}
            emptyState={
              <Card>
                <CardContent className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
                  <p className="text-gray-400 mb-6">
                    {state.filters.search || state.filters.role || state.filters.status !== 'all'
                      ? 'No users match your current filters'
                      : 'No users have been created yet'
                    }
                  </p>
                  <Button
                    onClick={() => setState(prev => ({ ...prev, showCreateModal: true }))}
                    variant="primary"
                  >
                    Create First User
                  </Button>
                </CardContent>
              </Card>
            }
          >
            <div>
              <Table
                columns={columns}
                data={state.users}
                loading={state.loading}
                onSort={(key, direction) => setState(prev => ({
                  ...prev,
                  sortBy: key,
                  sortDirection: direction
                }))}
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
                    totalItems={state.users.length}
                  />
                </div>
              )}
            </div>
          </LoadingState>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={state.showCreateModal}
        onClose={() => setState(prev => ({ ...prev, showCreateModal: false }))}
        title="Create New User"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            fullWidth
            required
          />
          
          <Input
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
            fullWidth
            required
            helperText="Minimum 8 characters"
          />
          
          <Input
            label="Company Name"
            value={newUser.company_name}
            onChange={(e) => setNewUser(prev => ({ ...prev, company_name: e.target.value }))}
            fullWidth
          />
          
          <Select
            label="Role"
            value={newUser.role}
            onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as UserRole }))}
            options={[
              { value: UserRole.INVESTOR, label: 'Investor' },
              { value: UserRole.ADMIN, label: 'Admin' },
              { value: UserRole.USER, label: 'User' }
            ]}
            fullWidth
          />
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={newUser.is_active}
              onChange={(e) => setNewUser(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-gold-600 bg-gray-100 border-gray-300 rounded focus:ring-gold-500"
            />
            <label htmlFor="is_active" className="text-white">
              Active Account
            </label>
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setState(prev => ({ ...prev, showCreateModal: false }))}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={creating}
              disabled={creating || !newUser.email || !newUser.password}
            >
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={state.showDeleteModal}
        onClose={() => setState(prev => ({ ...prev, showDeleteModal: false, selectedUser: null }))}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete user "${state.selectedUser?.email}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </AdminRoute>
  );
}