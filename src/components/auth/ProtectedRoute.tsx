'use client';

import React from 'react';
import { useRequireAuth } from '@/lib/auth/context';
import { UserRole } from '@/lib/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  accessDeniedComponent?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Loading component
 */
const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

/**
 * Access denied component
 */
const DefaultAccessDeniedComponent = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div className="text-center max-w-md mx-auto px-4">
      <div className="bg-red-500/10 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
      <p className="text-gray-300 mb-6">
        You don't have the required permissions to access this page. 
        Please contact an administrator if you believe this is an error.
      </p>
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gold-600 hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
      >
        Go Back
      </button>
    </div>
  </div>
);

/**
 * Login required component
 */
const LoginRequiredComponent = ({ redirectTo = '/investor-portal' }: { redirectTo?: string }) => {
  React.useEffect(() => {
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  }, [redirectTo]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting to login...</p>
      </div>
    </div>
  );
};

/**
 * Protected route component
 */
export function ProtectedRoute({
  children,
  roles,
  fallback,
  loadingComponent,
  accessDeniedComponent,
  redirectTo = '/investor-portal'
}: ProtectedRouteProps) {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    isAuthorized, 
    needsLogin, 
    accessDenied 
  } = useRequireAuth(roles);

  // Show loading state
  if (isLoading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Redirect to login if not authenticated
  if (needsLogin) {
    return fallback || <LoginRequiredComponent redirectTo={redirectTo} />;
  }

  // Show access denied if authenticated but not authorized
  if (accessDenied) {
    return accessDeniedComponent || <DefaultAccessDeniedComponent />;
  }

  // User is authenticated and authorized, render children
  return <>{children}</>;
}

/**
 * Admin only route component
 */
export function AdminRoute({ 
  children, 
  ...props 
}: Omit<ProtectedRouteProps, 'roles'>) {
  return (
    <ProtectedRoute roles={[UserRole.ADMIN]} {...props}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Investor or admin route component
 */
export function InvestorRoute({ 
  children, 
  ...props 
}: Omit<ProtectedRouteProps, 'roles'>) {
  return (
    <ProtectedRoute roles={[UserRole.INVESTOR, UserRole.ADMIN]} {...props}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Role-based content rendering
 */
interface RoleBasedContentProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export function RoleBasedContent({
  roles,
  children,
  fallback = null,
  requireAll = false
}: RoleBasedContentProps) {
  const { user, hasAnyRole, hasAllRoles } = useRequireAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const hasPermission = requireAll ? hasAllRoles(roles) : hasAnyRole(roles);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Admin only content
 */
export function AdminContent({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <RoleBasedContent roles={[UserRole.ADMIN]} fallback={fallback}>
      {children}
    </RoleBasedContent>
  );
}

/**
 * Investor content (includes admin)
 */
export function InvestorContent({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <RoleBasedContent roles={[UserRole.INVESTOR, UserRole.ADMIN]} fallback={fallback}>
      {children}
    </RoleBasedContent>
  );
}