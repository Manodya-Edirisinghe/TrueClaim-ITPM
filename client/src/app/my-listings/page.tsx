'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { resolveImageUrl } from '@/lib/axios';
import { Button } from '@/components/ui/button';

const MY_LISTING_IDS_KEY = 'trueclaim_my_listing_ids';

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

function readRememberedIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(MY_LISTING_IDS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function forgetListingId(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const next = readRememberedIds().filter((entry) => entry !== id);
    window.localStorage.setItem(MY_LISTING_IDS_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage failures.
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function MatchItemButton({ item }: { item: ListingItem }) {
  const params = new URLSearchParams({
    itemType: item.itemType,
    title: item.itemTitle,
    category: item.itemCategory,
    location: item.location,
  });

  return (
    <Link href={`/matching?${params.toString()}`}>
      <Button
        type="button"
        className="w-full bg-[#0A66C2] text-white hover:bg-[#0958a8] sm:w-auto"
      >
        <Search className="mr-2 h-4 w-4" />
        Match item
      </Button>
    </Link>
  );
}

function ListingCard({
  item,
  onDelete,
  deleting,
}: {
  item: ListingItem;
  onDelete: (id: string) => Promise<void>;
  deleting: boolean;
}) {
  return (
    <article className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-black/20">
          {item.imageUrl ? (
            <img src={resolveImageUrl(item.imageUrl) ?? ''} alt={item.itemTitle} className="h-36 w-full object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{item.itemTitle}</h3>
          <p className="text-sm text-muted-foreground">{item.description}</p>

          <div className="grid grid-cols-1 gap-1 text-sm text-[hsl(var(--foreground))] sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Category:</span> {item.itemCategory}
            </p>
            <p>
              <span className="text-muted-foreground">Location:</span> {item.location}
            </p>
            <p>
              <span className="text-muted-foreground">Date:</span> {formatDateTime(item.time)}
            </p>
            <p>
              <span className="text-muted-foreground">Contact:</span> {item.contactNumber}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <MatchItemButton item={item} />
            <Button
              type="button"
              variant="destructive"
              onClick={() => void onDelete(item._id)}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MyListingsPage() {
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'lost' | 'found'>('lost');

  const filteredItems = useMemo(
    () => items.filter((item) => item.itemType === filterType),
    [items, filterType]
  );

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const rememberedIds = readRememberedIds();

        if (rememberedIds.length === 0) {
          setItems([]);
          return;
        }

        const response = await api.get('/items', {
          params: {
            page: 1,
            limit: 100,
          },
        });

        const apiItems = (response.data?.items ?? []) as ListingItem[];
        const rememberedSet = new Set(rememberedIds);
        const filtered = apiItems.filter((item) => rememberedSet.has(item._id));

        filtered.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );

        setItems(filtered);
      } catch {
        toast.error('Failed to load listings. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    void loadListings();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await api.delete(`/items/${id}`);

      setItems((prev) => prev.filter((entry) => entry._id !== id));
      forgetListingId(id);
      toast.success('Item deleted successfully.');
    } catch {
      toast.error('Failed to delete item. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pt-24 py-6">
      <Link
        href="/lostandfound"
        className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:text-[#0A66C2]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lost and found form
      </Link>

      <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">My Listings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage items you submitted from this browser.
      </p>

      <div className="mt-4 max-w-sm space-y-2">
        <label className="block text-sm font-medium text-[hsl(var(--foreground))]">
          Filter listings
        </label>
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value as 'lost' | 'found')}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#6C3FF5]"
        >
          <option value="lost" className="text-black">
            Lost items - Filter lost items
          </option>
          <option value="found" className="text-black">
            Found items - Filter found items
          </option>
        </select>
      </div>

      {loading ? (
        <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-sm text-muted-foreground">
          Loading your listings...
        </div>
      ) : (
        <section className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
              {filterType === 'lost' ? 'Lost Items' : 'Found Items'}
            </h2>
            <span className="text-sm text-muted-foreground">{filteredItems.length} items</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-sm text-muted-foreground">
              {filterType === 'lost'
                ? 'No lost items submitted yet.'
                : 'No found items submitted yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <ListingCard
                  key={item._id}
                  item={item}
                  deleting={deletingId === item._id}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
