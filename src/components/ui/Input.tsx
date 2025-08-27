'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const inputClasses = `
    block px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
    ${icon ? 'pl-10' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextareaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const textareaClasses = `
    block px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed resize-vertical
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={textareaClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-400">{helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  options,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const selectClasses = `
    block px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white
    focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:ring-red-500' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={selectClasses}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-400">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';