'use client';

import { CalendarDays, MapPin, Pencil, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { resolveImageUrl } from '@/lib/axios';

type ListingItem = {
  _id: string;
  itemType: 'lost' | 'found';
  itemTitle: string;
  itemCategory: string;
  description: string;
  time: string;
  location: string;
  contactNumber: string;
  imageUrl?: string | null;
};

type ItemCardProps = {
  item: ListingItem;
  deleting: boolean;
  editing: boolean;
  onEdit: (item: ListingItem) => void;
  onDelete: (id: string) => Promise<void>;
};

const LISTING_FALLBACK_IMAGE = '/placeholder.png';

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function MatchItemButton({ item }: { item: ListingItem }) {
  const params = new URLSearchParams({ keyword: item.itemTitle });

  return (
    <Link href={`/matching?${params.toString()}`}>
      <Button type="button" className="w-full bg-[#0A66C2] text-white hover:bg-[#0958a8] sm:w-auto">
        <Search className="mr-2 h-4 w-4" />
        Match
      </Button>
    </Link>
  );
}

export default function ItemCard({ item, deleting, editing, onEdit, onDelete }: ItemCardProps) {
  const listingImageSrc = resolveImageUrl(item.imageUrl) ?? LISTING_FALLBACK_IMAGE;

  return (
    <article
      data-testid="listing-card"
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:border-blue-400/45 hover:bg-white/[0.06]"
    >
      <div className="relative overflow-hidden border-b border-white/10 bg-black/20">
        <img
          src={listingImageSrc}
          alt={item.itemTitle}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = LISTING_FALLBACK_IMAGE;
          }}
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold text-white">{item.itemTitle}</h3>
          <p className="line-clamp-1 text-sm text-white/60">{item.itemCategory}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
            <MapPin className="h-3.5 w-3.5 text-cyan-300" />
            {item.location}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
            <CalendarDays className="h-3.5 w-3.5 text-cyan-300" />
            {formatDateTime(item.time)}
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <MatchItemButton item={item} />
          <Button
            type="button"
            variant="outline"
            onClick={() => onEdit(item)}
            disabled={editing}
            data-testid="update-button"
            className="w-full border-white/20 bg-black/20 text-white hover:bg-black/35 sm:w-auto"
          >
            <Pencil className="mr-2 h-4 w-4" />
            {editing ? 'Updating...' : 'Update'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onDelete(item._id)}
            disabled={deleting}
            data-testid="delete-button"
            className="w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </article>
  );
}
