'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const formInputBaseClasses =
  'flex h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/45 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FF5] focus-visible:ring-offset-0 focus-visible:border-[#6C3FF5] ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-black/20 ' +
  'file:border-0 file:bg-[#6C3FF5] file:text-white file:rounded-md file:px-4 file:py-1.5 file:text-sm file:font-medium file:cursor-pointer file:mr-3 ' +
  'selection:bg-[#6C3FF5]/20 selection:text-white';

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(formInputBaseClasses, className)}
        {...props}
      />
    );
  }
);
FormInput.displayName = 'FormInput';

export { FormInput };
