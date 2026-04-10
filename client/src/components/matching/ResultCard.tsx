'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { getCurrentUserId } from '@/lib/auth';

type MatchResult = {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  image: string;
  matchScore: number;
  // Owner ID for messaging.
  ownerId?: string;
};

type ResultCardProps = {
  item: MatchResult;
  isHighlighted?: boolean;
  claimHref?: string;
  claimLabel?: string;
};

export default function ResultCard({
  item,
  isHighlighted = false,
  claimHref,
  claimLabel = 'Claim',
}: ResultCardProps) {
  const router = useRouter();

  const handleMessageOwner = () => {
    const receiverId = item.ownerId;
    const currentUserId = getCurrentUserId();
    if (!receiverId) return;

    // Don't let a user message themselves
    if (receiverId === currentUserId) return;

    router.push(
      `/messages?itemId=${item.id}&receiverId=${encodeURIComponent(receiverId)}`
    );
  };

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-blue-400/60 hover:bg-white/10 ${
        isHighlighted ? 'border-cyan-300/70 ring-1 ring-cyan-400/50' : 'border-white/10'
      }`}
    >
      <div className="relative">
        <img
          src={item.image}
          alt={item.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder.png';
          }}
          className="h-44 w-full object-cover"
        />
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

        <div className="flex gap-2">
          <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
            View Details
          </button>
          {claimHref ? (
            <Link
              href={claimHref}
              className="group/claim inline-flex items-center gap-1.5 rounded-lg border border-amber-200/35 bg-gradient-to-b from-amber-300/18 to-amber-500/14 px-3 py-2 text-xs font-semibold tracking-wide text-amber-100 shadow-[0_6px_18px_rgba(251,191,36,0.18)] ring-1 ring-inset ring-amber-100/10 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-100/60 hover:from-amber-300/26 hover:to-amber-500/22 hover:text-amber-50"
            >
              {claimLabel}
              <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover/claim:translate-x-0.5 group-hover/claim:-translate-y-0.5" />
            </Link>
          ) : null}
          <button
            onClick={handleMessageOwner}
            className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20"
            title="Message Owner"
          >
            <MessageCircle className="size-4" />
            Message
          </button>
        </div>
      </div>
    </article>
  );
}
