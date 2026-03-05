'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const formTextareaBaseClasses =
  'flex min-h-[72px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-1 focus-visible:border-[#0A66C2] ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-100 ' +
  'resize-y ' +
  'selection:bg-[#0A66C2]/20 selection:text-gray-900';

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(formTextareaBaseClasses, className)}
        {...props}
      />
    );
  }
);
FormTextarea.displayName = 'FormTextarea';

export { FormTextarea };
