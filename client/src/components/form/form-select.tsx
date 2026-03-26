'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const formSelectBaseClasses =
  'flex h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FF5] focus-visible:ring-offset-0 focus-visible:border-[#6C3FF5] ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-black/20 ' +
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
