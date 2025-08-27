'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import DashboardNavigation from '@/components/navigation/DashboardNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  totalDataRooms: number;
  storageUsed: number;
  storageLimit: number;
  recentUploads: number;
  pendingReviews: number;
}

interface RecentActivity {
  id: string;
  type: 'user_created' | 'document_uploaded' | 'data_room_created' | 'login' | 'download';
  description: string;
  timestamp: Date;
  user_email?: string;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  dismissed?: boolean;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock data - would come from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalUsers: 47,
        activeUsers: 32,
        totalDocuments: 156,
        totalDataRooms: 8,
        storageUsed: 8.4,
        storageLimit: 100,
        recentUploads: 12,
        pendingReviews: 3
      });

      setRecentActivity([
        {
          id: '1',
          type: 'document_uploaded',
          description: 'Q3 Financial Report uploaded',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          user_email: 'admin@idlewoodcapital.com'
        },
        {
          id: '2',
          type: 'user_created',
          description: 'New investor account created',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          user_email: 'newuser@example.com'
        },
        {
          id: '3',
          type: 'data_room_created',
          description: 'Project Beta data room created',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user_email: 'admin@idlewoodcapital.com'
        },
        {
          id: '4',
          type: 'download',
          description: 'Investment Summary downloaded',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          user_email: 'investor@company.com'
        }
      ]);

      setSystemAlerts([
        {
          id: '1',
          type: 'warning',
          message: 'Storage usage is approaching 10GB limit',
          timestamp: new Date(Date.now() - 60 * 60 * 1000)
        },
        {
          id: '2',
          type: 'info',
          message: '3 documents are pending review',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setSystemAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const quickStats = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'text-blue-500',
      href: '/admin/users'
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'text-green-500'
    },
    {
      label: 'Total Documents',
      value: stats?.totalDocuments || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-purple-500',
      href: '/admin/documents'
    },
    {
      label: 'Data Rooms',
      value: stats?.totalDataRooms || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-yellow-500',
      href: '/admin/data-rooms'
    }
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_created':
        return <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>;
      case 'document_uploaded':
        return <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>;
      case 'data_room_created':
        return <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>;
      case 'login':
        return <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>;
      case 'download':
        return <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>;
      default:
        return <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <AdminRoute>
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
        <DashboardNavigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">
              Manage users, documents, and system settings for Idlewood Capital
            </p>
          </div>

          <LoadingState
            isLoading={loading}
            error={error}
            loadingMessage="Loading admin dashboard..."
          >
            {/* System Alerts */}
            {systemAlerts.length > 0 && (
              <div className="mb-8 space-y-3">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      alert.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                      alert.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {alert.type === 'warning' && (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      )}
                      {alert.type === 'info' && (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span>{alert.message}</span>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {quickStats.map((stat) => {
                const Component = stat.href ? Link : 'div';
                return (
                  <Component
                    key={stat.label}
                    {...(stat.href ? { href: stat.href } : {})}
                    className={`block ${stat.href ? 'hover:scale-105 cursor-pointer' : ''} transition-all duration-200`}
                  >
                    <Card hover={!!stat.href}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                        <div className={`${stat.color} bg-current bg-opacity-20 p-3 rounded-lg`}>
                          <div className={stat.color}>
                            {stat.icon}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Component>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Storage Usage */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle size="md">Storage Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Used</span>
                        <span className="text-white">
                          {stats?.storageUsed} GB of {stats?.storageLimit} GB
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            stats && (stats.storageUsed / stats.storageLimit) > 0.8
                              ? 'bg-gradient-to-r from-red-500 to-red-600'
                              : stats && (stats.storageUsed / stats.storageLimit) > 0.6
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                              : 'bg-gradient-to-r from-gold-500 to-gold-600'
                          }`}
                          style={{ 
                            width: stats 
                              ? `${Math.min((stats.storageUsed / stats.storageLimit) * 100, 100)}%` 
                              : '0%'
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Available</span>
                          <p className="text-white font-medium">
                            {stats ? (stats.storageLimit - stats.storageUsed).toFixed(1) : 0} GB
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Usage</span>
                          <p className="text-white font-medium">
                            {stats ? Math.round((stats.storageUsed / stats.storageLimit) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle size="md">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Link href="/admin/users/new">
                        <Button variant="outline" fullWidth className="justify-start">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Create User
                        </Button>
                      </Link>
                      
                      <Link href="/admin/documents/upload">
                        <Button variant="outline" fullWidth className="justify-start">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Upload Documents
                        </Button>
                      </Link>
                      
                      <Link href="/admin/data-rooms/new">
                        <Button variant="outline" fullWidth className="justify-start">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Create Data Room
                        </Button>
                      </Link>

                      <Link href="/admin/analytics">
                        <Button variant="outline" fullWidth className="justify-start">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          View Analytics
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle size="md">Recent Activity</CardTitle>
                      <Link href="/admin/activity">
                        <Button variant="ghost" size="sm">
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                          <div className="flex-shrink-0 mt-0.5">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium">
                              {activity.description}
                            </p>
                            {activity.user_email && (
                              <p className="text-gray-400 text-xs mt-1">
                                by {activity.user_email}
                              </p>
                            )}
                            <p className="text-gray-400 text-xs mt-1">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-4">
                          <p className="text-gray-400">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </LoadingState>
        </div>
      </div>
    </AdminRoute>
  );
}