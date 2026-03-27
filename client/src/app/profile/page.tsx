'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

type ClaimAlert = {
  claimId: string;
  verificationId: string;
  status: string;
  alertType: 'verification_started' | 'meeting_scheduled' | 'claim_decision';
  message: string;
  alertCreatedAt: string;
  countdownEndsAt: string;
  meetingLocation?: string;
  meetingDateTime?: string;
  itemTitle?: string;
};

export default function ProfilePage() {
  const [email, setEmail] = useState('');
  const [alerts, setAlerts] = useState<ClaimAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAlerts = async (event: FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/claims/alerts/${encodeURIComponent(email.trim())}`);
      setAlerts(response.data?.alerts ?? []);
    } catch {
      toast.error('Failed to load verification alerts for this email.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/landing"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:text-[#0A66C2]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">User Profile Alerts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Check your claim verification ID and meeting details after countdown completion.
      </p>

      <form onSubmit={loadAlerts} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your claimant email"
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:border-[#0A66C2]"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0958a8] disabled:opacity-70"
        >
          {loading ? 'Loading...' : 'Load Alerts'}
        </button>
      </form>

      <section className="mt-6 space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-sm text-muted-foreground">
            No alerts yet. Submit a claim first to receive verification updates.
          </div>
        ) : (
          alerts.map((alert) => (
            <article
              key={`${alert.claimId}-${alert.alertCreatedAt}-${alert.alertType}`}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
            >
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">{alert.itemTitle ?? 'Claim Alert'}</h2>
              <p className="text-sm text-muted-foreground">Verification ID: {alert.verificationId}</p>
              <p className="text-sm text-muted-foreground">Status: {alert.status}</p>
              <p className="mt-2 text-sm text-[hsl(var(--foreground))]">{alert.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">Alert time: {new Date(alert.alertCreatedAt).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Countdown ends: {new Date(alert.countdownEndsAt).toLocaleString()}</p>
              {alert.meetingLocation ? (
                <p className="text-xs text-muted-foreground">Meeting location: {alert.meetingLocation}</p>
              ) : null}
              {alert.meetingDateTime ? (
                <p className="text-xs text-muted-foreground">Meeting date/time: {new Date(alert.meetingDateTime).toLocaleString()}</p>
              ) : null}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
