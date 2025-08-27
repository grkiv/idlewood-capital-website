'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ 
  children, 
  className = '', 
  padding = 'md', 
  hover = false,
  gradient = false 
}: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseClasses = gradient 
    ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm'
    : 'bg-slate-800/50 backdrop-blur-sm';

  const hoverClasses = hover ? 'hover:bg-slate-800/70 transition-all duration-200' : '';

  return (
    <div className={`${baseClasses} rounded-xl shadow-xl border border-slate-700 ${paddingClasses[padding]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CardTitle({ children, className = '', size = 'lg' }: CardTitleProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <h3 className={`font-bold text-white ${sizeClasses[size]} ${className}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}