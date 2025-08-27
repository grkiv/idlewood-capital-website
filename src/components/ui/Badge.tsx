'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'sm', 
  className = '' 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const variantClasses = {
    default: 'bg-slate-600 text-slate-200',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    active: { variant: 'success' as const, label: 'Active', icon: '●' },
    inactive: { variant: 'default' as const, label: 'Inactive', icon: '○' },
    pending: { variant: 'warning' as const, label: 'Pending', icon: '◐' },
    error: { variant: 'error' as const, label: 'Error', icon: '✗' },
    success: { variant: 'success' as const, label: 'Success', icon: '✓' }
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  );
}

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const roleConfig = {
    admin: { variant: 'error' as const, icon: '👑' },
    investor: { variant: 'info' as const, icon: '💼' },
    user: { variant: 'default' as const, icon: '👤' }
  };

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;

  return (
    <Badge variant={config.variant} className={className}>
      <span className="mr-1">{config.icon}</span>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}