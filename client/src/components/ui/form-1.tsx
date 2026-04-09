"use client";

import React from 'react';
import emailjs from '@emailjs/browser';
import {
  ArrowRight,
  Mail,
  MessageSquareText,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

interface ContactFormData {
  fullName: string;
  email: string;
  message: string;
}

const INITIAL_FORM: ContactFormData = {
  fullName: '',
  email: '',
  message: '',
};

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Example() {
  const [formData, setFormData] = React.useState<ContactFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();

    if (fullName.length < 2) {
      toast.error('Please enter your full name.');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (message.length < 10) {
      toast.error('Message should be at least 10 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        toast.error('Email service is not configured yet.');
        return;
      }

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: fullName,
          from_email: email,
          message,
          reply_to: email,
        },
        {
          publicKey: EMAILJS_PUBLIC_KEY,
        }
      );

      // Keep a server-side record for admin follow-up and auditing.
      await api.post('/contact', {
        fullName,
        email,
        message,
      });
      toast.success('Message sent. We will reach out soon.');
      setFormData(INITIAL_FORM);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.error;
      toast.error(apiMessage || 'Unable to submit your message right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="relative isolate mx-auto grid w-full max-w-5xl gap-8 overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(155deg,rgba(11,14,24,0.95),rgba(6,8,14,0.96))] p-5 text-sm text-slate-100 shadow-[0_32px_90px_rgba(1,8,24,0.65)] md:grid-cols-[1.1fr_1.4fr] md:p-8"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(10,102,194,0.34),transparent_48%),radial-gradient(circle_at_86%_75%,rgba(108,63,245,0.22),transparent_35%)]" />

      <aside className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#0A66C2]/45 bg-[#0A66C2]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec4fa]">
            <Sparkles className="h-3.5 w-3.5" />
            Contact
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
            Let&apos;s build trust back into every claim.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
            Need help with recovery workflows, report quality, or verification?
            Our team replies fast and keeps communication clear.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Direct Email</p>
          <a
            href="mailto:hello@trueclaim.app"
            className="mt-2 inline-flex text-base font-medium text-[#8ec4fa] transition hover:text-white"
          >
            hello@trueclaim.app
          </a>
          <p className="mt-2 text-xs text-white/45">Average response time: under 24 hours</p>
        </div>
      </aside>

      <div className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-md md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-1">
            <label htmlFor="contact-full-name" className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Full Name
            </label>
            <div className="mt-2 flex h-12 items-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] pl-3 transition-all focus-within:border-[#0A66C2]/80 focus-within:ring-2 focus-within:ring-[#0A66C2]/35">
              <UserRound className="h-4.5 w-4.5 text-white/55" />
              <input
                id="contact-full-name"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="h-full w-full bg-transparent px-2 text-white outline-none placeholder:text-white/35"
                placeholder="Alex Johnson"
                required
              />
            </div>
          </div>

          <div className="md:col-span-1">
            <label htmlFor="contact-email-address" className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Email Address
            </label>
            <div className="mt-2 flex h-12 items-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] pl-3 transition-all focus-within:border-[#0A66C2]/80 focus-within:ring-2 focus-within:ring-[#0A66C2]/35">
              <Mail className="h-4.5 w-4.5 text-white/55" />
              <input
                id="contact-email-address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="h-full w-full bg-transparent px-2 text-white outline-none placeholder:text-white/35"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Message
            </label>
            <div className="mt-2 flex items-start gap-2 rounded-2xl border border-white/15 bg-white/[0.03] p-3 transition-all focus-within:border-[#0A66C2]/80 focus-within:ring-2 focus-within:ring-[#0A66C2]/35">
              <MessageSquareText className="mt-1 h-4.5 w-4.5 shrink-0 text-white/55" />
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full resize-none bg-transparent text-white outline-none placeholder:text-white/35"
                placeholder="Tell us what you need help with..."
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(120deg,#0A66C2,#387fcb)] py-3 font-semibold text-white shadow-[0_12px_34px_rgba(10,102,194,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </form>
  );
}
