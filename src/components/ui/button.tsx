import React from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Support both new and old API
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  
  // Legacy Catalyst UI props for compatibility
  color?: 'indigo' | 'zinc' | 'emerald' | 'red' | 'amber' | 'yellow' | 'lime' | 'green' | 'teal' | 'sky' | 'blue' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose';
  outline?: boolean;
  plain?: boolean;
  
  children: React.ReactNode;
}

export function Button({
  variant,
  size = 'md',
  color,
  outline,
  plain,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  // Handle legacy props by converting to variant
  let finalVariant = variant;
  if (!finalVariant) {
    if (plain) {
      finalVariant = 'ghost';
    } else if (outline) {
      finalVariant = 'outline';
    } else if (color) {
      finalVariant = 'primary';
    } else {
      finalVariant = 'primary';
    }
  }
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-indigo-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-indigo-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button
      className={cn(
        baseClasses,
        variants[finalVariant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}