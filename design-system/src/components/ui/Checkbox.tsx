import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';
export interface CheckboxProps extends
  React.InputHTMLAttributes<HTMLInputElement> {}
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className={cn(
            'peer h-4 w-4 shrink-0 appearance-none rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:text-primary-foreground',
            className
          )}
          ref={ref}
          {...props} />
        
        <Check className="pointer-events-none absolute left-0 top-0 h-4 w-4 hidden peer-checked:block text-primary-foreground" />
      </div>);

  }
);
Checkbox.displayName = 'Checkbox';
export { Checkbox };