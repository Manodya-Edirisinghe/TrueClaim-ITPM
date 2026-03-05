'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const formInputBaseClasses =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-1 focus-visible:border-[#0A66C2] ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-100 ' +
  'file:border-0 file:bg-[#0A66C2] file:text-white file:rounded-md file:px-4 file:py-1.5 file:text-sm file:font-medium file:cursor-pointer file:mr-3 ' +
  'selection:bg-[#0A66C2]/20 selection:text-gray-900';

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
