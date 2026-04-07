'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { getMatchLevel, matchItems, type MatchResult, type MatchableItem } from '@/lib/matching-utils';
import { resolveImageUrl } from '@/lib/axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { toast } from 'sonner';

type MatchItem = MatchableItem & {
  id: string;
  itemType: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location: string;
  image: string;
  contactNumber?: string;
  ownerId?: string;
};

type DisplayMatchItem = MatchResult<MatchItem>;

type SearchFilters = {
  keyword: string;
  category: string;
  location: string;
};

type ApiItem = {
  _id: string;
  itemType: 'lost' | 'found';
  itemTitle: string;
  description?: string;
  itemCategory: string;
  location: string;
  imageUrl?: string | null;
  contactNumber?: string;
  ownerId?: string;
};

const FALLBACK_IMAGE = 'https://picsum.photos/seed/trueclaim-match/1200/800';

function getCounterpartType(type: 'lost' | 'found'): 'lost' | 'found' {
  return type === 'lost' ? 'found' : 'lost';
}

function parseItemType(value: string | null): 'lost' | 'found' | null {
  if (value === 'lost' || value === 'found') return value;
  return null;
}

function applySecondaryFilters(items: DisplayMatchItem[], filters: SearchFilters): DisplayMatchItem[] {
  const normalizedLocation = filters.location.trim().toLowerCase();

  return items.filter((item) => {
    const matchesCategory = filters.category === 'All' || item.category === filters.category;
    const matchesLocation =
      !normalizedLocation || item.location.toLowerCase().includes(normalizedLocation);

    return matchesCategory && matchesLocation;
  });
}

function toBaselineResults(items: MatchItem[]): DisplayMatchItem[] {
  return items.map((item) => ({
    ...item,
    matchScore: 1,
    matchPercentage: 0,
    matchLevel: getMatchLevel(1),
    matchedKeywords: [],
    isLowConfidenceMatch: false,
  }));
}

function filterItemsByKeyword(items: MatchItem[], keyword: string): MatchItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return items;

  return items.filter((item) => {
    const searchableText = `${item.title} ${item.description} ${item.category} ${item.location}`.toLowerCase();
    return searchableText.includes(normalizedKeyword);
  });
}

export default function MatchingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('keyword') ?? searchParams.get('title') ?? '';
  const initialCategory = searchParams.get('category') ?? 'All';
  const initialLocation = searchParams.get('location') ?? '';
  const sourceType =
    parseItemType(searchParams.get('sourceType')) ?? parseItemType(searchParams.get('itemType'));
  const targetItemType = sourceType ? getCounterpartType(sourceType) : null;

  const [items, setItems] = useState<MatchItem[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: initialKeyword,
    category: initialCategory,
    location: initialLocation,
  });
  const [draftFilters, setDraftFilters] = useState<SearchFilters>({
    keyword: initialKeyword,
    category: initialCategory,
    location: initialLocation,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchedWithImage, setHasSearchedWithImage] = useState(false);
  const [results, setResults] = useState<DisplayMatchItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DisplayMatchItem | null>(null);
  const isAIUsed = Boolean(uploadedImage);
  const showImageSearchLoading = isSearching && Boolean(uploadedImage);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(items.map((item) => item.category)))],
    [items]
  );

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      try {
        setIsLoadingItems(true);
        setItemsError(null);

        const response = await fetch('http://localhost:5000/api/items');
        if (!response.ok) {
          throw new Error(`Failed to load items (${response.status})`);
        }

        const data = await response.json();
        const apiItems: ApiItem[] = Array.isArray(data?.items) ? data.items : [];

        const mappedItems: MatchItem[] = apiItems.map((entry) => ({
          id: entry._id,
          itemType: entry.itemType,
          title: entry.itemTitle,
          description: entry.description ?? '',
          category: entry.itemCategory,
          location: entry.location,
          image: resolveImageUrl(entry.imageUrl) ?? FALLBACK_IMAGE,
          contactNumber: entry.contactNumber,
          ownerId: entry.ownerId,
        }));

        if (!isMounted) return;

        const typeFilteredItems = targetItemType
          ? mappedItems.filter((item) => item.itemType === targetItemType)
          : mappedItems;

        setItems(typeFilteredItems);
        const baselineResults = applySecondaryFilters(
          toBaselineResults(filterItemsByKeyword(typeFilteredItems, initialKeyword)),
          {
            keyword: initialKeyword,
            category: initialCategory,
            location: initialLocation,
          }
        );
        setResults(baselineResults);
      } catch (error) {
        if (!isMounted) return;
        console.error('[Matching Items Load Error]', error);
        setItemsError('Failed to load items. Please try again.');
      } finally {
        if (isMounted) {
          setIsLoadingItems(false);
        }
      }
    };

    loadItems();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const nextFilters: SearchFilters = {
      keyword: initialKeyword,
      category: initialCategory,
      location: initialLocation,
    };

    setFilters(nextFilters);
    setDraftFilters(nextFilters);

    if (items.length > 0) {
      setResults(
        applySecondaryFilters(
          toBaselineResults(filterItemsByKeyword(items, nextFilters.keyword)),
          nextFilters
        )
      );
    }
  }, [initialKeyword, initialCategory, initialLocation, items]);

  const onSubmitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const searchingWithImage = Boolean(uploadedImage);
    setIsSearching(searchingWithImage);
    setFilters(draftFilters);
    setHasSearchedWithImage(searchingWithImage);

    try {
      if (searchingWithImage) {
        // Keep UX responsive while still indicating image analysis.
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      const filtered = searchingWithImage
        ? applySecondaryFilters(matchItems(items, draftFilters.keyword, uploadedImage), draftFilters)
        : applySecondaryFilters(
            toBaselineResults(filterItemsByKeyword(items, draftFilters.keyword)),
            draftFilters
          );
      setResults(filtered);
    } finally {
      if (searchingWithImage) {
        setIsSearching(false);
      }
    }
  };

  const onImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    if (!file) {
      setUploadedImage(null);
      setImagePreviewUrl(null);
      return;
    }

    setUploadedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const onMessageOwner = () => {
    if (!selectedItem) return;

    const receiverId = selectedItem.ownerId ?? `owner_${selectedItem.id}`;
    const currentUserId = getCurrentUserId();
    if (!receiverId) return;
    if (receiverId === currentUserId) {
      toast.info('This item is submitted by you');
      return;
    }

    router.push(`/messages?itemId=${selectedItem.id}&receiverId=${encodeURIComponent(receiverId)}`);
  };

  return (
    <main className="min-h-screen bg-[#05070c] pt-24 text-white">
      <section className="mx-auto w-full max-w-7xl px-5 pb-12 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Item Matching</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">
            Search with quick filters on the left and review ranked matching cards on the right.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <aside className="lg:col-span-4">
            <form
              onSubmit={onSubmitSearch}
              className="sticky top-28 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/20"
            >
              <h2 className="mb-4 text-lg font-semibold text-white">Search Filters</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Keyword</label>
                  <input
                    type="text"
                    value={draftFilters.keyword}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({ ...prev, keyword: event.target.value }))
                    }
                    placeholder="e.g., Brown wallet"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Category</label>
                  <select
                    value={draftFilters.category}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({ ...prev, category: event.target.value }))
                    }
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-400"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category} className="text-black">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Location</label>
                  <input
                    type="text"
                    value={draftFilters.location}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({ ...prev, location: event.target.value }))
                    }
                    placeholder="e.g., main library"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-blue-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>

                <div className="rounded-xl border border-white/10 bg-white/[0.03]">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-sm font-semibold text-white">Advanced Filters</span>
                    <ChevronDown
                      className={`h-4 w-4 text-white/70 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showAdvanced && (
                    <div className="space-y-3 border-t border-white/10 px-4 py-4">
                      <label className="block text-sm font-medium text-white/80">Upload Image</label>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={onImageSelect}
                        className="block w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-white/80 file:mr-3 file:rounded-md file:border-0 file:bg-blue-500/20 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-200"
                      />

                      {isAIUsed ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                          <Sparkles className="h-3.5 w-3.5" />
                          Powered by AI
                        </div>
                      ) : null}

                      {uploadedImage ? (
                        <p className="text-xs text-cyan-200/90">Analyzing image...</p>
                      ) : null}

                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="Uploaded reference"
                          className="h-36 w-full rounded-lg object-cover"
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </aside>

          <section className="lg:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Matching Results</h2>
              <p className="text-sm text-white/65">
                {results.length} result{results.length === 1 ? '' : 's'}
              </p>
            </div>

            {isLoadingItems ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center text-sm text-white/65">
                Loading items...
              </div>
            ) : itemsError ? (
              <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-6 py-12 text-center text-sm text-red-200">
                {itemsError}
              </div>
            ) : showImageSearchLoading ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-12">
                <div className="mx-auto max-w-sm text-center">
                  <p className="text-sm text-white/75">Analyzing image...</p>
                  <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                  </div>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center text-sm text-white/65">
                No matching items found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {results.map((item) => {
                  const level = item.matchLevel;
                  const confidence = item.matchPercentage;
                  const confidenceClassName =
                    level === 'High Match'
                      ? 'text-emerald-300 bg-emerald-500/15 border-emerald-400/35'
                      : level === 'Medium Match'
                        ? 'text-amber-300 bg-amber-500/15 border-amber-400/35'
                        : 'text-rose-300 bg-rose-500/15 border-rose-400/35';
                  const levelClassName =
                    level === 'High Match'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
                      : level === 'Medium Match'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-400/35'
                        : 'bg-rose-500/15 text-rose-300 border-rose-400/35';
                  const indicatorClassName =
                    level === 'High Match'
                      ? 'bg-emerald-400'
                      : level === 'Medium Match'
                        ? 'bg-amber-400'
                        : 'bg-rose-400';

                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/[0.06]"
                    >
                      <div className="relative">
                        <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                        {hasSearchedWithImage ? (
                          <span className="absolute left-3 top-3 rounded-full border border-cyan-300/40 bg-cyan-500/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-100 backdrop-blur-sm">
                            AI Suggested
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-3 p-4">
                        <h3 className="line-clamp-1 text-lg font-semibold text-white">{item.title}</h3>

                        {hasSearchedWithImage && item.isLowConfidenceMatch ? (
                          <div className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                            Low confidence match
                          </div>
                        ) : null}

                        <p className="text-sm text-white/70">Location: {item.location}</p>

                        {hasSearchedWithImage ? (
                          <div className={`rounded-xl border px-3 py-2 ${confidenceClassName}`}>
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                              <span>Match Confidence</span>
                              <span>{confidence}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-black/20">
                              <div
                                className={`h-full rounded-full ${
                                  level === 'High Match'
                                    ? 'bg-emerald-300'
                                    : level === 'Medium Match'
                                      ? 'bg-amber-300'
                                      : 'bg-rose-300'
                                }`}
                                style={{ width: `${confidence}%` }}
                              />
                            </div>
                          </div>
                        ) : null}

                        {hasSearchedWithImage ? (
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`h-2.5 w-2.5 rounded-full ${indicatorClassName}`} />
                            <span className="font-medium text-white/75">Match Level:</span>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${levelClassName}`}>
                              {level}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>

      {selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] shadow-2xl">
            <div className="relative">
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                className="h-64 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute right-3 top-3 rounded-md bg-black/60 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black/80"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 p-5">
              <h3 className="text-xl font-semibold text-white">{selectedItem.title}</h3>
              <p className="text-sm text-white/75">{selectedItem.description || 'No description available.'}</p>

              <div className="grid grid-cols-1 gap-2 text-sm text-white/75 sm:grid-cols-2">
                <p>
                  <span className="text-white/45">Category:</span> {selectedItem.category}
                </p>
                <p>
                  <span className="text-white/45">Location:</span> {selectedItem.location}
                </p>
                {selectedItem.contactNumber ? (
                  <p className="sm:col-span-2">
                    <span className="text-white/45">Contact:</span> {selectedItem.contactNumber}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={onMessageOwner}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Message Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
