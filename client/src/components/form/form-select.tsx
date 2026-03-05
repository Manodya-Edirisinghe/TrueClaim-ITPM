'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const formSelectBaseClasses =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-1 focus-visible:border-[#0A66C2] ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-100 ' +
  'cursor-pointer';

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        data-form-select
        className={cn(formSelectBaseClasses, className)}
        {...props}
      >
        {children}
      </select>
    );
  }
);
FormSelect.displayName = 'FormSelect';

export { FormSelect };
