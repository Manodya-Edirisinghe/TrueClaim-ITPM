'use client';

import { CalendarDays, MapPin, Sparkles } from 'lucide-react';

export type MatchingCardItem = {
  id: string;
  title: string;
  image: string;
  location: string;
  date?: string;
  matchLevel: 'High Match' | 'Medium Match' | 'Low Match';
  matchPercentage: number;
  isLowConfidenceMatch: boolean;
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

  return (
    <article
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.03] shadow-lg shadow-black/25 transition duration-300 hover:-translate-y-1.5 hover:border-cyan-300/50 hover:shadow-cyan-500/20"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400/70 via-blue-400/80 to-emerald-300/70" />

      <div className="relative">
        <img
          src={item.image}
          alt={item.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder.png';
          }}
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05070c]/65 via-transparent to-transparent" />

        {showImageMatchDetails ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-500/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-100 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            AI
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-1 text-lg font-semibold tracking-tight text-white group-hover:text-cyan-100">
          {item.title}
        </h3>

        <div className="space-y-3 pt-1 text-sm text-white/80">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
            <MapPin className="h-4 w-4 text-blue-300" />
            {item.location}
          </p>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
            <CalendarDays className="h-4 w-4 text-blue-300" />
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
