import React from 'react';
import { getCardClasses, CardVariant, cn } from '../../styles/designSystem';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default', 
  className = '',
  onClick,
  hover = false,
  glow = false,
  padding = 'md'
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  };

  return (
    <div 
      className={cn(
        getCardClasses(variant),
        paddingClasses[padding],
        hover && 'hover:scale-[1.02] cursor-pointer',
        glow && 'shadow-[0_0_40px_rgba(59,130,246,0.2)]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
