'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const formTextareaBaseClasses =
  'flex min-h-[72px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/45 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FF5] focus-visible:ring-offset-0 focus-visible:border-[#6C3FF5] ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-black/20 ' +
  'resize-y ' +
  'selection:bg-[#6C3FF5]/20 selection:text-white';

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
