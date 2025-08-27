'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { InvestorRoute } from '@/components/auth/ProtectedRoute';
import DashboardNavigation from '@/components/navigation/DashboardNavigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { UserRole } from '@/lib/types/database';

interface DashboardStats {
  totalDocuments: number;
  recentDownloads: number;
  dataRoomsAccess: number;
  storageUsed: number;
  storageLimit: number;
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: Date;
    details: string;
  }>;
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
  href?: string;
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        // Mock data for now - this would come from API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalDocuments: 24,
          recentDownloads: 7,
          dataRoomsAccess: 3,
          storageUsed: 2.4,
          storageLimit: 10,
          recentActivity: [
            {
              id: '1',
              action: 'Downloaded',
              timestamp: new Date(Date.now() - 1000 * 60 * 30),
              details: 'Q3 Financial Report.pdf'
            },
            {
              id: '2',
              action: 'Accessed',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
              details: 'Project Alpha Data Room'
            },
            {
              id: '3',
              action: 'Viewed',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
              details: 'Investment Summary.docx'
            }
          ]
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  const quickStats: QuickStat[] = [
    {
      label: 'Total Documents',
      value: stats?.totalDocuments || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-blue-500',
      href: '/dashboard/documents'
    },
    {
      label: 'Recent Downloads',
      value: stats?.recentDownloads || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      color: 'text-green-500',
      href: '/dashboard/activity'
    },
    {
      label: 'Data Rooms',
      value: stats?.dataRoomsAccess || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-purple-500',
      href: '/dashboard/data-rooms'
    },
    {
      label: 'Storage Used',
      value: stats ? `${stats.storageUsed}/${stats.storageLimit} GB` : '0/0 GB',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'text-yellow-500'
    }
  ];

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <InvestorRoute>
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
        <DashboardNavigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.company_name || user?.email?.split('@')[0]}!
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-gray-400">
                Your Idlewood Capital Investor Dashboard
              </p>
              {user?.role && <RoleBadge role={user.role} />}
            </div>
          </div>

          <LoadingState
            isLoading={loading}
            error={error}
            loadingMessage="Loading dashboard statistics..."
          >
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
                          {stat.change && (
                            <p className="text-sm text-green-400 mt-1">{stat.change}</p>
                          )}
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
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.recentActivity.length ? (
                      <div className="space-y-4">
                        {stats.recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start justify-between p-3 bg-slate-700/30 rounded-lg">
                            <div className="flex-1">
                              <p className="text-white font-medium">
                                {activity.action} <span className="text-gray-400">{activity.details}</span>
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                {formatTimeAgo(activity.timestamp)}
                              </p>
                            </div>
                            <StatusBadge status="success" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-400">No recent activity</p>
                      </div>
                    )}
                    <div className="mt-6">
                      <Link href="/dashboard/activity">
                        <Button variant="outline" fullWidth>
                          View All Activity
                        </Button>
                      </Link>
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
                      <Link href="/dashboard/documents">
                        <Button variant="outline" fullWidth className="justify-start">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Browse Documents
                        </Button>
                      </Link>
                      
                      <Link href="/dashboard/data-rooms">
                        <Button variant="outline" fullWidth className="justify-start">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Access Data Rooms
                        </Button>
                      </Link>
                      
                      <Link href="/dashboard/settings">
                        <Button variant="outline" fullWidth className="justify-start">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Account Settings
                        </Button>
                      </Link>

                      {hasRole(UserRole.ADMIN) && (
                        <Link href="/admin">
                          <Button variant="primary" fullWidth className="justify-start">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Storage Usage */}
                {stats && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle size="md">Storage Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Used</span>
                          <span className="text-white">{stats.storageUsed} GB of {stats.storageLimit} GB</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-gold-500 to-gold-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(stats.storageUsed / stats.storageLimit) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">
                          {Math.round(((stats.storageLimit - stats.storageUsed) / stats.storageLimit) * 100)}% available
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </LoadingState>
        </div>
      </div>
    </InvestorRoute>
  );
}