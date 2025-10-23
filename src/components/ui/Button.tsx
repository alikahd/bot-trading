import React from 'react';
import { getButtonClasses, ButtonVariant, cn } from '../../styles/designSystem';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnly?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  iconOnly = false
}) => {
  const sizeClasses = {
    sm: iconOnly ? 'p-2 text-sm' : 'px-4 py-2 text-sm',
    md: iconOnly ? 'p-3 text-base' : 'px-6 py-3 text-base',
    lg: iconOnly ? 'p-4 text-lg' : 'px-8 py-4 text-lg',
    xl: iconOnly ? 'p-5 text-xl' : 'px-10 py-5 text-xl'
  };

  return (
    <button
      type={type}
      className={cn(
        getButtonClasses(variant),
        sizeClasses[size],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        'inline-flex items-center justify-center gap-2',
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      )}
      {!loading && icon && (iconOnly || iconPosition === 'left') && icon}
      {!iconOnly && children}
      {!loading && icon && !iconOnly && iconPosition === 'right' && icon}
    </button>
  );
};
