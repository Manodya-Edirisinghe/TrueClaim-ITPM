'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import api, { resolveImageUrl } from '@/lib/axios';
import ResultCard from '@/components/matching/ResultCard';

type ApiItem = {
  _id: string;
  itemType: 'lost' | 'found';
  itemTitle: string;
  itemCategory: string;
  description: string;
  location: string;
  time: string;
  contactNumber?: string;
  imageUrl?: string | null;
  ownerId?: string;
  ownerDisplayName?: string;
};

const FALLBACK_IMAGE = '/placeholder.png';

function toDateOnly(value: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function RecentItems() {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/items', { params: { page: 1, limit: 6 } });
        setItems(data.items ?? []);
      } catch {
        // Silently fail — this is just a preview section
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
            Recent Activity
          </p>
          <h2 className="text-3xl font-bold text-white">Recently reported items</h2>
        </div>
        <Link
          href="/matching"
          className="flex items-center gap-1.5 text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          View all items <ArrowRight className="size-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="mb-3 h-36 rounded-xl bg-white/[0.06]" />
              <div className="mb-2 h-4 w-2/3 rounded bg-white/[0.06]" />
              <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
          <p className="text-sm text-white/40">No items reported yet. Be the first to submit one!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ResultCard
              key={item._id}
              item={{
                id: item._id,
                title: item.itemTitle,
                category: item.itemCategory,
                location: item.location,
                date: toDateOnly(item.time),
                image: resolveImageUrl(item.imageUrl) ?? FALLBACK_IMAGE,
                matchScore: 0,
                ownerId: item.ownerId,
                ownerDisplayName: item.ownerDisplayName,
              }}
              claimHref={`/matching?claimItemId=${encodeURIComponent(item._id)}`}
              claimLabel="Claim"
            />
          ))}
        </div>
      )}
    </section>
  );
}
