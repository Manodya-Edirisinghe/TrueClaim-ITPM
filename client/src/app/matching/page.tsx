'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import MatchingForm, { MatchSearchFilters } from '@/components/matching/MatchingForm';
import ResultCard from '@/components/matching/ResultCard';
import api, { resolveImageUrl } from '@/lib/axios';

type MatchItem = {
  id: string;
  itemType: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  image: string;
  matchScore: number;
  ownerId?: string;
};

type ApiItem = {
  _id: string;
  itemType: 'lost' | 'found';
  itemTitle: string;
  itemCategory: string;
  description: string;
  location: string;
  time: string;
  imageUrl?: string | null;
  ownerId?: string;
};

const FALLBACK_IMAGE = 'https://picsum.photos/seed/trueclaim/600/400';

function toDateOnly(value: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

/** Build a searchable blob from all item fields */
function itemSearchText(item: MatchItem): string {
  return [item.title, item.description, item.category, item.location].join(' ').toLowerCase();
}

function calculateMatchScore(
  item: MatchItem,
  filters: MatchSearchFilters,
  withImageAssist: boolean
): number {
  let score = 40;
  const searchText = itemSearchText(item);
  const title = filters.title.trim().toLowerCase();
  const category = filters.category.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();

  // Title match (strongest signal)
  if (title) {
    if (item.title.toLowerCase() === title) score += 30;
    else if (item.title.toLowerCase().includes(title)) score += 20;
  }

  // Category match
  if (category && category !== 'all') {
    if (item.category.toLowerCase() === category) score += 15;
    else if (item.category.toLowerCase().includes(category)) score += 8;
  }

  // Location match
  if (location) {
    if (item.location.toLowerCase() === location) score += 10;
    else if (item.location.toLowerCase().includes(location)) score += 5;
  }

  // Keyword match — each keyword that hits any field boosts the score
  const keywords = filters.keywords
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean);

  if (keywords.length > 0) {
    let hits = 0;
    for (const kw of keywords) {
      if (searchText.includes(kw)) hits++;
    }
    const hitRate = hits / keywords.length;
    score += Math.round(hitRate * 20);
  }

  if (withImageAssist) score += 8;

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
  const keywords = filters.keywords
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean);

  const filtered = items.filter((item) => {
    // Title is required — must match
    if (normalizedTitle && !item.title.toLowerCase().includes(normalizedTitle)) {
      return false;
    }

    // Category filter
    if (
      normalizedCategory &&
      normalizedCategory !== 'all' &&
      !item.category.toLowerCase().includes(normalizedCategory)
    ) {
      return false;
    }

    // Location filter
    if (normalizedLocation && !item.location.toLowerCase().includes(normalizedLocation)) {
      return false;
    }

    // Keywords — item must match at least one keyword (if any provided)
    if (keywords.length > 0) {
      const searchText = itemSearchText(item);
      const hasAny = keywords.some((kw) => searchText.includes(kw));
      if (!hasAny) return false;
    }

    return true;
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
      keywords: '',
      category: searchParams.get('category') ?? 'All',
      location: searchParams.get('location') ?? '',
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

        const mapped: MatchItem[] = apiItems.map((entry) => ({
          id: entry._id,
          itemType: entry.itemType,
          title: entry.itemTitle,
          description: entry.description ?? '',
          category: entry.itemCategory,
          location: entry.location,
          date: toDateOnly(entry.time),
          image: resolveImageUrl(entry.imageUrl) || FALLBACK_IMAGE,
          matchScore: 0,
          ownerId: entry.ownerId,
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
    <main className="min-h-screen bg-[#05070c] text-white pt-24">
      <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Item Matching</h1>
            <p className="mt-1 text-sm text-white/60">
              Search lost and found entries using basic fields or AI-assisted image matching.
            </p>
          </div>

          {uploadedImage && (
            <div className="flex items-center gap-2 rounded-full border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 shadow-lg shadow-cyan-500/10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
              </span>
              <span className="text-sm font-semibold text-cyan-200">Powered by AI</span>
            </div>
          )}
        </div>

        {targetItemType && (
          <p className="mb-6 rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-200">
            Showing best <strong>{targetItemType}</strong> matches based on your submitted{' '}
            <strong>{sourceItemType}</strong> report.
          </p>
        )}

        {/* Search form */}
        <div className="mb-8">
          <MatchingForm
            categories={categories}
            imagePreviewUrl={imagePreviewUrl}
            onImageSelect={onImageSelect}
            initialFilters={initialFilters}
            onSearch={onSearch}
          />
        </div>

        {/* Results */}
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Matching Results</h2>
              <p className="text-sm text-white/60">
                {results.length} item{results.length === 1 ? '' : 's'} found
              </p>
            </div>
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
              No matching items yet. Try adjusting the title, keywords, or category.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
