'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/notifications/notification-provider';
import ItemCard from './ItemCard';

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

type ListingItem = {
  _id: string;
  itemType: 'lost' | 'found';
  createdAt?: string;
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave(item._id, formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-white/20 bg-[#0b1324] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Update Listing</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/60 transition hover:bg-black/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-white/70">Item title</label>
            <input
              type="text"
              value={formData.itemTitle}
              onChange={(event) => setFormData((prev) => ({ ...prev, itemTitle: event.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-white/70">Category</label>
            <select
              value={formData.itemCategory}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, itemCategory: event.target.value }))
              }
              className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
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
            <label className="text-sm text-white/70">Description</label>
            <textarea
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-white/70">Date</label>
            <input
              type="date"
              value={formData.time}
              onChange={(event) => setFormData((prev) => ({ ...prev, time: event.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-white/70">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
              className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-white/70">Contact number</label>
            <input
              type="text"
              value={formData.contactNumber}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  contactNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#0A66C2]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-white/70">Replace image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))
              }
              className="w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-[#0A66C2] file:px-3 file:py-1 file:text-sm file:font-medium file:text-white"
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

type MyListingsSectionProps = {
  compact?: boolean;
};

export default function MyListingsSection({ compact = false }: MyListingsSectionProps) {
  const { addNotification } = useNotifications();
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ListingItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const filteredItems = useMemo(() => {
    const byType =
      filterType === 'all'
        ? items
        : items.filter((item) => item.itemType === filterType);

    const sorted = [...byType].sort((a, b) => {
      const aTime = new Date(a.createdAt ?? a.time).getTime();
      const bTime = new Date(b.createdAt ?? b.time).getTime();
      return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });

    return sorted;
  }, [items, filterType, sortOrder]);

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
      addNotification('Item deleted successfully.', 'info');
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
      addNotification('Item updated successfully.', 'success');
    } catch {
      toast.error('Failed to update item. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className={compact ? '' : 'mx-auto max-w-6xl px-4 pt-24 py-6'}>
      <h2 className="text-2xl font-semibold text-white">My Listings</h2>
      <p className="mt-1 text-sm text-white/65">Manage items you submitted from this browser.</p>

      <div className="mt-4 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Filter</label>
          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value as 'all' | 'lost' | 'found')}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#6C3FF5]"
          >
            <option value="all" className="text-black">All</option>
            <option value="lost" className="text-black">Lost</option>
            <option value="found" className="text-black">Found</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Sort by Date Posted</label>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as 'newest' | 'oldest')}
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#6C3FF5]"
          >
            <option value="newest" className="text-black">Newest First</option>
            <option value="oldest" className="text-black">Oldest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/65">
          Loading your listings...
        </div>
      ) : (
        <section className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              {filterType === 'all'
                ? 'All Items'
                : filterType === 'lost'
                  ? 'Lost Items'
                  : 'Found Items'}
            </h3>
            <span className="text-sm text-white/60">{filteredItems.length} items</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
              {filterType === 'all'
                ? 'No items submitted yet.'
                : filterType === 'lost'
                  ? 'No lost items submitted yet.'
                  : 'No found items submitted yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <ItemCard
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
    </section>
  );
}
