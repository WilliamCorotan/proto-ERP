import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {}
const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, ...props }, ref) => {
    return <div className={cn('grid gap-2', className)} ref={ref} {...props} />;
  }
);
RadioGroup.displayName = 'RadioGroup';
export interface RadioGroupItemProps extends
  React.InputHTMLAttributes<HTMLInputElement> {}
const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type="radio"
          className={cn(
            'peer aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:border-primary',
            className
          )}
          ref={ref}
          {...props} />
        
        <div className="pointer-events-none absolute left-0 top-0 hidden h-4 w-4 items-center justify-center peer-checked:flex">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
      </div>);

  }
);
RadioGroupItem.displayName = 'RadioGroupItem';
export { RadioGroup, RadioGroupItem };