'use client';

import { ImageIcon, ListFilter, MapPin, Search, Sparkles } from 'lucide-react';

type SummaryCardProps = {
  keyword: string;
  category: string;
  location: string;
  imageSearchUsed: boolean;
};

export default function SummaryCard({
  keyword,
  category,
  location,
  imageSearchUsed,
}: SummaryCardProps) {
  return (
    <aside className="rounded-2xl border border-white/20 bg-gradient-to-br from-[#1f3b7a]/30 via-[#0e1a38]/40 to-[#091225]/55 p-4 shadow-[0_18px_60px_rgba(2,8,23,0.65),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-2xl md:p-5">
      <h2 className="mb-3 text-lg font-semibold text-white">Search Summary</h2>

      <div className="space-y-2.5 text-sm text-white/90">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-300" />
          <span className="text-white/65">Keyword:</span>
          <span className="font-medium text-white">{keyword || 'Any'}</span>
        </div>

        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-blue-300" />
          <span className="text-white/65">Category:</span>
          <span className="font-medium text-white">{category || 'All'}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-300" />
          <span className="text-white/65">Location:</span>
          <span className="font-medium text-white">{location || 'Any'}</span>
        </div>

        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-blue-300" />
          <span className="text-white/65">Image search:</span>
          <span className="font-medium text-white">{imageSearchUsed ? 'Yes' : 'No'}</span>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-blue-300/35 bg-blue-500/16 px-3 py-3 text-xs text-blue-100/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
        <p className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5" />
          Showing results based on your search
        </p>
      </div>
    </aside>
  );
}
