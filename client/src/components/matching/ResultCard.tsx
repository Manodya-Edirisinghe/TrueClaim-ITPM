'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/axios';

type MatchResult = {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  image: string;
  matchScore: number;
};

type ResultCardProps = {
  item: MatchResult;
  isHighlighted?: boolean;
};

type ClaimFormData = {
  claimantName: string;
  claimantEmail: string;
  claimantContactNumber: string;
  ownershipPassword: string;
  serialNumber: string;
  lostPlace: string;
};

const initialForm: ClaimFormData = {
  claimantName: '',
  claimantEmail: '',
  claimantContactNumber: '',
  ownershipPassword: '',
  serialNumber: '',
  lostPlace: '',
};

export default function ResultCard({ item, isHighlighted = false }: ResultCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [form, setForm] = useState<ClaimFormData>(initialForm);

  const handleClaimSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.claimantName.trim() ||
      !form.claimantEmail.trim() ||
      !form.claimantContactNumber.trim() ||
      !form.ownershipPassword.trim() ||
      !form.serialNumber.trim() ||
      !form.lostPlace.trim()
    ) {
      toast.error('Please fill all claim verification fields.');
      return;
    }

    try {
      setClaiming(true);
      const response = await api.post('/claims', {
        itemId: item.id,
        ...form,
      });

      const verificationId = response.data?.claim?.verificationId;
      const endsAt = response.data?.claim?.verificationEndsAt;
      toast.success(
        verificationId
          ? `Claim submitted. Verification ID: ${verificationId}`
          : 'Claim submitted. 48-hour verification started.'
      );
      if (endsAt) {
        toast.info(`Countdown ends: ${new Date(endsAt).toLocaleString()}`);
      }
      setForm(initialForm);
      setShowForm(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error ?? 'Failed to submit claim.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-blue-400/60 hover:bg-white/10 ${
        isHighlighted ? 'border-cyan-300/70 ring-1 ring-cyan-400/50' : 'border-white/10'
      }`}
    >
      <div className="relative">
        <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
        <div className="absolute right-3 top-3 rounded-full border border-blue-300/50 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">
          {item.matchScore}% Match
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-lg font-semibold text-white">{item.title}</h3>

        <div className="space-y-1 text-sm text-white/75">
          <p>
            <span className="text-white/55">Category:</span> {item.category}
          </p>
          <p>
            <span className="text-white/55">Location:</span> {item.location}
          </p>
          <p>
            <span className="text-white/55">Date Reported:</span> {item.date}
          </p>
        </div>

        <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
          View Details
        </button>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          {showForm ? 'Close Claim Form' : 'Claim This Item'}
        </button>

        {showForm && (
          <form onSubmit={handleClaimSubmit} className="space-y-2 rounded-lg border border-white/15 bg-black/30 p-3">
            <input
              value={form.claimantName}
              onChange={(event) => setForm((prev) => ({ ...prev, claimantName: event.target.value }))}
              placeholder="Your full name"
              className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
            <input
              value={form.claimantEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, claimantEmail: event.target.value }))}
              type="email"
              placeholder="Your email"
              className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
            <input
              value={form.claimantContactNumber}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  claimantContactNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              placeholder="Contact number"
              className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
            <input
              value={form.ownershipPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, ownershipPassword: event.target.value }))}
              placeholder="Item password / lock code"
              className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
            <input
              value={form.serialNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, serialNumber: event.target.value }))}
              placeholder="Serial number"
              className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
            <input
              value={form.lostPlace}
              onChange={(event) => setForm((prev) => ({ ...prev, lostPlace: event.target.value }))}
              placeholder="Lost place"
              className="w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={claiming}
              className="w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {claiming ? 'Submitting claim...' : 'Submit Claim for Verification'}
            </button>
          </form>
        )}
      </div>
    </article>
  );
}
