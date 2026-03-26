'use client';

import React from 'react';
import Link from 'next/link';
import { RegisterForm } from '@/components/form/register-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link href="/landing">
          <Button
            variant="ghost"
            className="mb-8 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">Create an Account</h1>
          <p className="text-gray-400 text-lg">
            Join the Lost and Found system to report and claim your items
          </p>
        </div>

        {/* Register Form */}
        <RegisterForm />
      </div>
    </div>
  );
}