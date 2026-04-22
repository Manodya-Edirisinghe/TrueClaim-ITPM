'use client';

import Link from 'next/link';
import { FeedbackForm } from '@/components/form/feedback-form';
import { ArrowLeft } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pt-24 pb-12">
      <Link
        href="/landing"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/60 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Back to Home
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Share Your Feedback</h1>
        <p className="mt-2 text-sm text-white/60">
          Help us improve the Lost and Found system by sharing your experience.
        </p>
      </div>

      <FeedbackForm />
    </main>
  );
}
