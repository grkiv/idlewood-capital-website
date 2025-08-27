'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { UserRole } from '@/lib/types/database';
import { RoleBadge } from '@/components/ui/Badge';
import { IconButton, Button } from '@/components/ui/Button';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: [UserRole.INVESTOR, UserRole.ADMIN]
  },
  {
    label: 'Documents',
    href: '/dashboard/documents',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    roles: [UserRole.INVESTOR, UserRole.ADMIN]
  },
  {
    label: 'Data Rooms',
    href: '/dashboard/data-rooms',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    roles: [UserRole.INVESTOR, UserRole.ADMIN]
  },
  {
    label: 'Activity',
    href: '/dashboard/activity',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    roles: [UserRole.INVESTOR, UserRole.ADMIN]
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: [UserRole.INVESTOR, UserRole.ADMIN]
  },
  {
    label: 'Admin Panel',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    roles: [UserRole.ADMIN],
    badge: 'Admin'
  }
];

interface DashboardNavigationProps {
  className?: string;
}

export default function DashboardNavigation({ className = '' }: DashboardNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, hasAnyRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/investor-portal';
  };

  const filteredNavigationItems = navigationItems.filter(item => 
    hasAnyRole(item.roles)
  );

  return (
    <nav className={`bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image
                src="/assets/images/logo.svg"
                alt="Idlewood Capital"
                width={40}
                height={40}
                className="h-10 w-auto filter brightness-0 invert"
              />
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold text-white">IDLEWOOD</span>
                <span className="text-xs font-semibold tracking-wider text-gold-500">CAPITAL</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors group"
              >
                <span className="mr-2 group-hover:text-gold-500">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* User Info */}
            <div className="text-right">
              <p className="text-sm text-white font-medium">
                {user?.company_name || user?.email}
              </p>
              {user?.role && <RoleBadge role={user.role} />}
            </div>

            {/* Main Site Link */}
            <Link
              href="/"
              className="text-gray-300 hover:text-gold-500 transition-colors"
              title="Visit Main Site"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            {/* Logout Button */}
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <IconButton
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant="ghost"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </IconButton>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-700 mt-4 pt-4">
            <div className="space-y-1">
              {filteredNavigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              
              <div className="border-t border-slate-700 pt-4 mt-4">
                <div className="px-3 py-2">
                  <p className="text-sm text-white font-medium">
                    {user?.company_name || user?.email}
                  </p>
                  {user?.role && (
                    <div className="mt-1">
                      <RoleBadge role={user.role} />
                    </div>
                  )}
                </div>
                
                <Link
                  href="/"
                  className="flex items-center px-3 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Main Site
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}