import React from 'react';
import { cn } from '../../lib/utils';
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div
        className={cn(
          'absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none',
          className
        )}>
        
        {content}
        <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
      </div>
    </div>);

}