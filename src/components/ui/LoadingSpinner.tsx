'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'gold' | 'white' | 'blue' | 'red';
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'gold', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    gold: 'border-gold-500',
    white: 'border-white',
    blue: 'border-blue-500',
    red: 'border-red-500'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`} />
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  className = '' 
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-3 text-white text-sm">{message}</p>
        )}
      </div>
    </div>
  );
}

interface LoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingMessage?: string;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
  className?: string;
}

export function LoadingState({
  isLoading,
  error,
  children,
  loadingMessage = 'Loading...',
  emptyState,
  isEmpty = false,
  className = ''
}: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-gray-400">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="bg-red-500/10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Error</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (isEmpty && emptyState) {
    return <>{emptyState}</>;
  }

  return <>{children}</>;
}