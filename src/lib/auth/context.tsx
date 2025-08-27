'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  AuthContextType, 
  AuthUser, 
  AuthResponse,
  AuthErrorCode 
} from '@/lib/types/auth';
import { UserRole } from '@/lib/types/database';

// Create authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authentication context provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshPromise, setRefreshPromise] = useState<Promise<boolean> | null>(null);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = user !== null;

  /**
   * Login function
   */
  const login = useCallback(async (
    email: string, 
    password: string, 
    remember: boolean = false
  ): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Login failed',
          ...data
        };
      }

      if (data.success && data.user) {
        setUser(data.user);
        return {
          success: true,
          message: data.message,
          user: data.user
        };
      }

      return {
        success: false,
        message: 'Invalid response from server'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error occurred during login'
      };
    }
  }, []);

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Clear any pending refresh promise
      setRefreshPromise(null);
    }
  }, []);

  /**
   * Refresh authentication
   */
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    // If there's already a refresh in progress, return that promise
    if (refreshPromise) {
      return refreshPromise;
    }

    const promise = (async (): Promise<boolean> => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Get current user info (this should be cached or stored)
            // For now, we'll make a separate call to get user info
            const userResponse = await fetch('/api/auth/me', {
              credentials: 'include',
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.success && userData.user) {
                setUser(userData.user);
                return true;
              }
            }
          }
        }

        // Refresh failed, user needs to login again
        setUser(null);
        return false;

      } catch (error) {
        console.error('Token refresh error:', error);
        setUser(null);
        return false;
      } finally {
        setRefreshPromise(null);
      }
    })();

    setRefreshPromise(promise);
    return promise;
  }, [refreshPromise]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  /**
   * Check if user has all specified roles
   */
  const hasAllRoles = useCallback((roles: UserRole[]): boolean => {
    // In our single-role system, this means user has the one required role
    return user ? (roles.length === 1 && roles[0] === user.role) : false;
  }, [user]);

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // Try to refresh tokens on app start
      await refreshAuth();
      
      setIsLoading(false);
    };

    initAuth();
  }, [refreshAuth]);

  /**
   * Set up automatic token refresh
   */
  useEffect(() => {
    if (!user) return;

    // Set up interval to refresh tokens every 25 minutes (5 minutes before expiry)
    const refreshInterval = setInterval(() => {
      refreshAuth();
    }, 25 * 60 * 1000); // 25 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, [user, refreshAuth]);

  /**
   * Handle visibility change to refresh on focus
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Refresh auth when user comes back to the tab
        refreshAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshAuth]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
    hasRole,
    hasAnyRole,
    hasAllRoles
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Higher-order component for route protection
 */
export function withAuthRequired<P extends object>(
  Component: React.ComponentType<P>,
  roles?: UserRole[],
  redirectTo: string = '/investor-portal'
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, hasAnyRole } = useAuth();

    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
        </div>
      );
    }

    // Redirect to login if not authenticated
    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return null;
    }

    // Check role permissions
    if (roles && !hasAnyRole(roles)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-300">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

/**
 * Hook for protected routes
 */
export function useRequireAuth(roles?: UserRole[]) {
  const { user, isLoading, hasAnyRole } = useAuth();

  const isAuthenticated = !!user;
  const isAuthorized = !roles || (user && hasAnyRole(roles));

  return {
    user,
    isLoading,
    isAuthenticated,
    isAuthorized: isAuthenticated && isAuthorized,
    needsLogin: !isLoading && !isAuthenticated,
    accessDenied: !isLoading && isAuthenticated && !isAuthorized
  };
}