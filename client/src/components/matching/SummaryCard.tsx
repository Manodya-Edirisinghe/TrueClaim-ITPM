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
      <aside className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f1832]/80 to-[#0a1022]/85 p-4 shadow-xl shadow-black/30 md:p-5">
        <h2 className="mb-3 text-lg font-semibold text-white">Search Summary</h2>

        <div className="space-y-2.5 text-sm text-white/85">
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

      <div className="mt-5 rounded-xl border border-blue-300/20 bg-blue-500/10 px-3 py-3 text-xs text-blue-100/95">
        <p className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5" />
          Showing results based on your search
        </p>
      </div>
    </aside>
  );
}
