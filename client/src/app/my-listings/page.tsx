'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import api, { resolveImageUrl } from '@/lib/axios';
import { Button } from '@/components/ui/button';

const MY_LISTING_IDS_KEY = 'trueclaim_my_listing_ids';

const ITEM_CATEGORIES = [
  'Wallet / Purse',
  'Keys',
  'Phone',
  'Bag / Backpack',
  'Documents',
  'Jewelry',
  'Electronics',
  'Clothing',
  'Other',
];

const LISTING_FALLBACK_IMAGE = '/placeholder.png';

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

type ListingFormData = {
  itemTitle: string;
  itemCategory: string;
  description: string;
  time: string;
  location: string;
  contactNumber: string;
  image: File | null;
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

function toDateOnly(value: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function toFormData(item: ListingItem): ListingFormData {
  return {
    itemTitle: item.itemTitle,
    itemCategory: item.itemCategory,
    description: item.description,
    time: toDateOnly(item.time),
    location: item.location,
    contactNumber: item.contactNumber,
    image: null,
  };
}

function MatchItemButton({ item }: { item: ListingItem }) {
  const params = new URLSearchParams({
    sourceType: item.itemType,
    sourceItemId: item._id,
    keyword: item.itemTitle,
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
  onEdit,
  deleting,
  editing,
}: {
  item: ListingItem;
  onDelete: (id: string) => Promise<void>;
  onEdit: (item: ListingItem) => void;
  deleting: boolean;
  editing: boolean;
}) {
  const listingImageSrc = resolveImageUrl(item.imageUrl) ?? LISTING_FALLBACK_IMAGE;

  return (
    <article className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-black/20">
          <img
            src={listingImageSrc}
            alt={item.itemTitle}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/placeholder.png';
            }}
            className="h-36 w-full object-cover"
          />
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
              variant="outline"
              onClick={() => onEdit(item)}
              disabled={editing}
              className="w-full border-white/15 bg-black/20 text-white hover:bg-black/40 sm:w-auto"
            >
              <Pencil className="mr-2 h-4 w-4" />
              {editing ? 'Updating...' : 'Update'}
            </Button>
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

function EditListingModal({
  item,
  isSaving,
  onClose,
  onSave,
}: {
  item: ListingItem;
  isSaving: boolean;
  onClose: () => void;
  onSave: (id: string, data: ListingFormData) => Promise<void>;
}) {
  const [formData, setFormData] = useState<ListingFormData>(() => toFormData(item));

  useEffect(() => {
    setFormData(toFormData(item));
  }, [item]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSave(item._id, formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Update Listing</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-black/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Item title</label>
            <input
              type="text"
              value={formData.itemTitle}
              onChange={(event) => setFormData((prev) => ({ ...prev, itemTitle: event.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Category</label>
            <select
              value={formData.itemCategory}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, itemCategory: event.target.value }))
              }
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            >
              <option value="" className="text-black">Select category</option>
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="text-black">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-muted-foreground">Description</label>
            <textarea
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Date</label>
            <input
              type="date"
              value={formData.time}
              onChange={(event) => setFormData((prev) => ({ ...prev, time: event.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Contact number</label>
            <input
              type="text"
              value={formData.contactNumber}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  contactNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Replace image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))
              }
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-[#0A66C2] file:px-3 file:py-1 file:text-sm file:font-medium file:text-white"
            />
          </div>

          <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-[#0A66C2] text-white hover:bg-[#0958a8]">
              {isSaving ? 'Updating...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ListingItem | null>(null);
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

  const handleUpdate = async (id: string, data: ListingFormData) => {
    try {
      setUpdatingId(id);

      const payload = new window.FormData();
      payload.append('itemTitle', data.itemTitle);
      payload.append('itemCategory', data.itemCategory);
      payload.append('description', data.description);
      payload.append('time', data.time);
      payload.append('location', data.location);
      payload.append('contactNumber', data.contactNumber);
      if (data.image) payload.append('image', data.image);

      const response = await api.put(`/items/${id}`, payload);
      const updatedItem = response.data?.item as ListingItem | undefined;

      if (!updatedItem) {
        throw new Error('Missing updated item');
      }

      setItems((prev) => prev.map((entry) => (entry._id === id ? updatedItem : entry)));
      setEditingItem(null);
      toast.success('Item updated successfully.');
    } catch {
      toast.error('Failed to update item. Please try again.');
    } finally {
      setUpdatingId(null);
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
                  onEdit={setEditingItem}
                  deleting={deletingId === item._id}
                  editing={updatingId === item._id}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {editingItem ? (
        <EditListingModal
          item={editingItem}
          isSaving={updatingId === editingItem._id}
          onClose={() => setEditingItem(null)}
          onSave={handleUpdate}
        />
      ) : null}
    </main>
  );
}
