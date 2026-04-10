'use client';

import { CalendarDays, MapPin, Sparkles } from 'lucide-react';

export type MatchingCardItem = {
  id: string;
  title: string;
  image: string;
  location: string;
  date?: string;
  itemType: 'lost' | 'found';
  matchLevel: 'High Match' | 'Medium Match' | 'Low Match';
  matchPercentage: number;
  isLowConfidenceMatch: boolean;
  ownerDisplayName?: string;
  ownerAvatarUrl?: string;
};

type ItemCardProps = {
  item: MatchingCardItem;
  showImageMatchDetails: boolean;
  onOpen: () => void;
};

export default function ItemCard({ item, showImageMatchDetails, onOpen }: ItemCardProps) {
  const levelClassName =
    item.matchLevel === 'High Match'
      ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-300'
      : item.matchLevel === 'Medium Match'
        ? 'border-amber-400/35 bg-amber-500/15 text-amber-300'
        : 'border-rose-400/35 bg-rose-500/15 text-rose-300';

  const progressClassName =
    item.matchLevel === 'High Match'
      ? 'bg-emerald-300'
      : item.matchLevel === 'Medium Match'
        ? 'bg-amber-300'
        : 'bg-rose-300';

  const ownerName = item.ownerDisplayName?.trim() || 'Item Owner';
  const ownerInitial = ownerName.charAt(0).toUpperCase() || 'U';
  const listingBadgeText = item.itemType === 'lost' ? 'Lost item' : 'Found item';

  return (
    <article
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl border border-white/15 bg-[#0a1020]/85 shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-blue-300/45 hover:shadow-blue-900/30"
    >
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-black/45 px-3 py-2 backdrop-blur-sm">
        <p className="line-clamp-1 pr-2 text-base font-semibold text-white">{item.title}</p>
        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2 py-1 backdrop-blur-md">
          {item.ownerAvatarUrl ? (
            <img src={item.ownerAvatarUrl} alt={ownerName} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/65 text-[11px] font-bold text-white">
              {ownerInitial}
            </span>
          )}
          <span className="max-w-[92px] truncate text-xs font-semibold text-white/95">{ownerName}</span>
        </div>
      </div>

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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05070c]/70 via-transparent to-transparent" />

        <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
          {listingBadgeText}
        </span>

        {showImageMatchDetails ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-500/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-100 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            AI
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-3.5">
        <h3 className="line-clamp-1 text-[1.65rem] font-semibold tracking-tight text-white/95 md:text-[1.7rem]">
          {item.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-sm text-white/80">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/35 bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-100">
            <MapPin className="h-3.5 w-3.5 text-emerald-100" />
            {item.location}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/35 bg-sky-500/20 px-2.5 py-1 text-xs font-medium text-sky-100">
            <CalendarDays className="h-3.5 w-3.5 text-sky-100" />
            {item.date ?? 'Date not available'}
          </p>
        </div>

        {showImageMatchDetails ? (
          <div className="space-y-2 rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-3">
            {item.isLowConfidenceMatch ? (
              <p className="text-[11px] font-semibold text-amber-200">Low confidence match</p>
            ) : null}

            <div className="flex items-center justify-between text-xs text-white/75">
              <span>Match confidence</span>
              <span className="font-semibold">{item.matchPercentage}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${progressClassName}`}
                style={{ width: `${item.matchPercentage}%` }}
              />
            </div>

            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${levelClassName}`}>
              {item.matchLevel}
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
}
