import React from 'react';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variantStyles = {
    primary:
      'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg focus:ring-primary-400 active:bg-primary-800',
    secondary:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg focus:ring-emerald-400 active:bg-emerald-800',
    success:
      'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg focus:ring-green-400 active:bg-green-800',
    warning:
      'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg focus:ring-amber-400 active:bg-amber-800',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg focus:ring-red-400 active:bg-red-800',
    outline:
      'border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-gray-300',
    ghost:
      'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:ring-gray-300',
  };

  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 gap-1.5 min-h-[36px]',
    md: 'text-base px-4 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-lg px-6 py-3.5 gap-2.5 min-h-[52px]',
    xl: 'text-xl px-7 py-4 gap-3 min-h-[60px] font-semibold',
    '2xl': 'text-2xl px-8 py-5 gap-3.5 min-h-[72px] font-bold tracking-wide shadow-xl',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {isLoading ? (
        <Spinner size={size === '2xl' || size === 'xl' ? 'md' : 'sm'} className="mr-2" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
