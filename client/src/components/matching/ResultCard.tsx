'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CalendarDays, MapPin, MessageCircle, Shapes } from 'lucide-react';
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
  ownerDisplayName?: string;
  ownerEmail?: string;
};

type ResultCardProps = {
  item: MatchResult;
  isHighlighted?: boolean;
  claimHref?: string;
  claimLabel?: string;
  onOpen?: () => void;
};

export default function ResultCard({
  item,
  isHighlighted = false,
  claimHref,
  claimLabel = 'Claim',
  onOpen,
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

  const ownerLabel = (item.ownerEmail ?? item.ownerDisplayName)?.trim();
  const ownerInitial = ownerLabel?.charAt(0).toUpperCase() || 'U';

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/15 bg-[#0a1020]/85 shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-blue-300/45 hover:shadow-blue-900/30 ${
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
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />

        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-black/45 px-3 py-2 backdrop-blur-sm">
          <p className="line-clamp-1 pr-2 text-base font-semibold text-white">{item.title}</p>
          <div className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/35 p-1 backdrop-blur-md">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/65 text-[11px] font-bold text-white">
              {ownerInitial}
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05070c]/70 via-transparent to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-1 text-[1.65rem] font-semibold tracking-tight text-white/95 md:text-[1.7rem]">{item.title}</h3>

        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-sm text-white/80">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/35 bg-cyan-500/20 px-2.5 py-1 text-xs font-medium text-cyan-100">
            <Shapes className="h-3.5 w-3.5 text-cyan-100" />
            {item.category}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/35 bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100">
            <MapPin className="h-3.5 w-3.5 text-emerald-100" />
            {item.location}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/35 bg-sky-500/20 px-2.5 py-1 text-xs font-medium text-sky-100">
            <CalendarDays className="h-3.5 w-3.5 text-sky-100" />
            {item.date}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
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
