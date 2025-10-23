import React from 'react';
import { getBadgeClasses, BadgeVariant, cn } from '../../styles/designSystem';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'info', 
  className = '',
  size = 'md',
  glow = false,
  pulse = false,
  icon
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  // التأكد من أن variant صالح
  const safeVariant = variant || 'info';
  
  return (
    <span className={cn(
      getBadgeClasses(safeVariant),
      sizeClasses[size],
      glow && 'shadow-lg',
      pulse && 'animate-pulse',
      'inline-flex items-center gap-1.5',
      className
    )}>
      {icon && icon}
      {children}
    </span>
  );
};
