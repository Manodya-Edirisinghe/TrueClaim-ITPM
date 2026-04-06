'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import MatchingForm, { MatchSearchFilters } from '@/components/matching/MatchingForm';
import ResultCard from '@/components/matching/ResultCard';
import api from '@/lib/axios';

type MatchItem = {
  id: string;
  itemType: 'lost' | 'found';
  title: string;
  category: string;
  location: string;
  date: string;
  image: string;
  matchScore: number;
  claimStatus?: 'open' | 'under_verification' | 'claim_verified' | 'claimed';
  hasOwner?: boolean;
};

type ApiItem = {
  _id: string;
  itemType: 'lost' | 'found';
  itemTitle: string;
  itemCategory: string;
  location: string;
  time: string;
  imageUrl?: string | null;
  claimStatus?: 'open' | 'under_verification' | 'claim_verified' | 'claimed';
  hasOwner?: boolean;
};

const menuItems = [
  { name: 'Features', href: '#features' },
  { name: 'Match Items', href: '/matching' },
  { name: 'Profile Alerts', href: '/profile' },
  { name: 'Universities', href: '#universities' },
  { name: 'Contact', href: '#contact' },
];

const FALLBACK_IMAGE = 'https://picsum.photos/seed/trueclaim/600/400';

function toDateOnly(value: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function calculateMatchScore(
  item: MatchItem,
  filters: MatchSearchFilters,
  withImageAssist: boolean
): number {
  let score = 50;
  const title = filters.title.trim().toLowerCase();
  const category = filters.category.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();

  if (title) {
    if (item.title.toLowerCase() === title) score += 25;
    else if (item.title.toLowerCase().includes(title)) score += 16;
  }

  if (category && category !== 'all') {
    if (item.category.toLowerCase() === category) score += 18;
    else if (item.category.toLowerCase().includes(category)) score += 10;
  }

  if (location) {
    if (item.location.toLowerCase() === location) score += 12;
    else if (item.location.toLowerCase().includes(location)) score += 7;
  }

  if (withImageAssist) {
    score += 8;
  }

  return Math.min(99, score);
}

function filterItems(
  items: MatchItem[],
  filters: MatchSearchFilters,
  withImageAssist: boolean
): MatchItem[] {
  const normalizedTitle = filters.title.trim().toLowerCase();
  const normalizedCategory = filters.category.trim().toLowerCase();
  const normalizedLocation = filters.location.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const titleMatch = normalizedTitle
      ? item.title.toLowerCase().includes(normalizedTitle)
      : true;

    const categoryMatch =
      normalizedCategory && normalizedCategory !== 'all'
        ? item.category.toLowerCase().includes(normalizedCategory)
        : true;

    const locationMatch = normalizedLocation
      ? item.location.toLowerCase().includes(normalizedLocation)
      : true;

    const itemDate = new Date(item.date).getTime();
    const fromDate = filters.fromDate ? new Date(filters.fromDate).getTime() : null;
    const toDate = filters.toDate ? new Date(filters.toDate).getTime() : null;

    const fromMatch = fromDate ? itemDate >= fromDate : true;
    const toMatch = toDate ? itemDate <= toDate : true;

    return titleMatch && categoryMatch && locationMatch && fromMatch && toMatch;
  });

  return filtered
    .map((item) => ({
      ...item,
      matchScore: calculateMatchScore(item, filters, withImageAssist),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

function MatchingPageContent() {
  const searchParams = useSearchParams();

  const sourceItemType = searchParams.get('itemType');
  const targetItemType =
    sourceItemType === 'lost'
      ? 'found'
      : sourceItemType === 'found'
        ? 'lost'
        : null;

  const initialFilters = useMemo<MatchSearchFilters>(
    () => ({
      title: searchParams.get('title') ?? '',
      category: searchParams.get('category') ?? 'All',
      location: searchParams.get('location') ?? '',
      fromDate: toDateOnly(searchParams.get('fromDate') ?? ''),
      toDate: toDateOnly(searchParams.get('toDate') ?? ''),
    }),
    [searchParams]
  );

  const [items, setItems] = useState<MatchItem[]>([]);
  const [filters, setFilters] = useState<MatchSearchFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))),
    [items]
  );

  const results = useMemo(
    () => filterItems(items, filters, Boolean(uploadedImage)),
    [items, filters, uploadedImage]
  );

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const response = await api.get('/items', {
          params: {
            ...(targetItemType ? { itemType: targetItemType } : {}),
            page: 1,
            limit: 100,
          },
        });

        const apiItems: ApiItem[] = response.data?.items ?? [];

        const mapped: MatchItem[] = apiItems
          .filter((entry) => !entry.hasOwner && entry.claimStatus !== 'claimed')
          .map((entry) => ({
          id: entry._id,
          itemType: entry.itemType,
          title: entry.itemTitle,
          category: entry.itemCategory,
          location: entry.location,
          date: toDateOnly(entry.time),
          image: entry.imageUrl || FALLBACK_IMAGE,
          matchScore: 0,
          claimStatus: entry.claimStatus,
          hasOwner: entry.hasOwner,
        }));

        setItems(mapped);
      } catch (error) {
        console.error('[Matching Load Error]', error);
        setLoadError('Failed to load match items. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [targetItemType]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const onImageSelect = (file: File | null) => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    if (!file) {
      setUploadedImage(null);
      setImagePreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setUploadedImage(file);
    setImagePreviewUrl(nextUrl);
  };

  const onSearch = (nextFilters: MatchSearchFilters) => {
    setFilters(nextFilters);
  };

  return (
    <main className="min-h-screen bg-[#05070c] text-white">
      <header className="border-b border-white/10 bg-black/20">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/landing" aria-label="home" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A66C2]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">TrueClaim</span>
          </Link>

          <ul className="hidden items-center gap-7 text-sm md:flex">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link href={item.href} className="text-white/65 transition hover:text-white">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[360px_1fr] lg:px-10">
        <div>
          <h1 className="mb-2 text-2xl font-semibold">Item Matching</h1>
          <p className="mb-5 text-sm text-white/60">
            Search lost and found entries using basic fields or AI-assisted image matching.
          </p>

          {targetItemType ? (
            <p className="mb-5 rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-200">
              Showing best <strong>{targetItemType}</strong> matches based on your submitted{' '}
              <strong>{sourceItemType}</strong> report.
            </p>
          ) : null}

          <MatchingForm
            categories={categories}
            imagePreviewUrl={imagePreviewUrl}
            onImageSelect={onImageSelect}
            initialFilters={initialFilters}
            onSearch={onSearch}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Matching Results</h2>
              <p className="text-sm text-white/60">
                {results.length} item{results.length === 1 ? '' : 's'} found
              </p>
            </div>

            {uploadedImage ? (
              <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
                Powered by AI
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-6 py-12 text-center text-sm text-white/60">
              Loading matches...
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-300/25 bg-red-500/10 px-6 py-12 text-center text-sm text-red-200">
              {loadError}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-6 py-12 text-center text-sm text-white/60">
              No matching items yet. Try changing the title, category, or location.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {results.map((item, index) => (
                <ResultCard key={item.id} item={item} isHighlighted={Boolean(uploadedImage) && index < 3} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function MatchingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#05070c] px-6 py-10 text-sm text-white/70">
          Loading matches...
        </main>
      }
    >
      <MatchingPageContent />
    </Suspense>
  );
}
