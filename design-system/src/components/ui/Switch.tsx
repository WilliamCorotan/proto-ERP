import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
export interface SwitchProps extends
  React.InputHTMLAttributes<HTMLInputElement> {}
const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input type="checkbox" className="peer sr-only" ref={ref} {...props} />
        <div
          className={cn(
            'h-6 w-11 rounded-full bg-input transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:bg-primary',
            className
          )}>
          
          <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform peer-checked:translate-x-5" />
        </div>
      </div>);

  }
);
Switch.displayName = 'Switch';
export { Switch };