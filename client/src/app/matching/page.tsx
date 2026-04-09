'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { getMatchLevel, matchItems, type MatchResult, type MatchableItem } from '@/lib/matching-utils';
import api, { resolveImageUrl } from '@/lib/axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';
import { toast } from 'sonner';
import MatchingForm, { type MatchingFilters } from '@/components/matching/MatchingForm';
import SummaryCard from '@/components/matching/SummaryCard';
import ItemCard from '@/components/matching/ItemCard';
import Pagination from '@/components/matching/Pagination';

type MatchItem = MatchableItem & {
  id: string;
  itemType: 'lost' | 'found';
  title: string;
  date?: string;
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
  time?: string;
  itemCategory: string;
  location: string;
  imageUrl?: string | null;
  contactNumber?: string;
  ownerId?: string;
};

const FALLBACK_IMAGE = '/placeholder.png';
const ITEMS_PER_PAGE = 12;

function formatReportedDate(value?: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<DisplayMatchItem | null>(null);
  const showImageSearchLoading = isSearching && Boolean(uploadedImage);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(items.map((item) => item.category)))],
    [items]
  );

  const totalPages = Math.max(1, Math.ceil(results.length / ITEMS_PER_PAGE));

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return results.slice(start, end);
  }, [results, currentPage]);

  const hasActiveSearch =
    filters.keyword.trim().length > 0 ||
    filters.location.trim().length > 0 ||
    filters.category !== 'All' ||
    hasSearchedWithImage;

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      try {
        setIsLoadingItems(true);
        setItemsError(null);

        const { data } = await api.get('/items');
        const apiItems: ApiItem[] = Array.isArray(data?.items) ? data.items : [];

        const mappedItems: MatchItem[] = apiItems.map((entry) => ({
          id: entry._id,
          itemType: entry.itemType,
          title: entry.itemTitle,
          description: entry.description ?? '',
          date: formatReportedDate(entry.time),
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
    setCurrentPage(1);
  }, [results]);

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

  const onSubmitSearch = async () => {
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

  const onClearImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setUploadedImage(null);
    setImagePreviewUrl(null);
  };

  const onClearSearch = () => {
    const resetFilters: SearchFilters = {
      keyword: '',
      category: 'All',
      location: '',
    };

    onClearImage();
    setShowAdvanced(false);
    setHasSearchedWithImage(false);
    setIsSearching(false);
    setFilters(resetFilters);
    setDraftFilters(resetFilters);
    setCurrentPage(1);

    setResults(
      applySecondaryFilters(
        toBaselineResults(filterItemsByKeyword(items, '')),
        resetFilters
      )
    );

    router.replace('/matching');
  };

  const onMessageOwner = () => {
    if (!selectedItem) return;

    const receiverId = selectedItem.ownerId;
    const currentUserId = getCurrentUserId();
    if (!receiverId) {
      toast.error('Item owner is unavailable for messaging.');
      return;
    }
    if (receiverId === currentUserId) {
      toast.info('This item is submitted by you');
      return;
    }

    router.push(`/messages?itemId=${selectedItem.id}&receiverId=${encodeURIComponent(receiverId)}`);
  };

  return (
    <main className="min-h-screen bg-[#05070c] pt-24 text-white">
      <section className="mx-auto w-full max-w-7xl px-5 pb-12 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Item Matching</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">
            Find likely matches quickly with structured filters and optional AI image assistance.
          </p>
        </div>

        <div className="relative grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.2fr_auto_0.9fr]">
          <MatchingForm
            filters={draftFilters as MatchingFilters}
            categories={categories}
            isSearching={isSearching}
            showAdvanced={showAdvanced}
            isImageSelected={Boolean(uploadedImage)}
            imagePreviewUrl={imagePreviewUrl}
            onFiltersChange={(next) => setDraftFilters(next)}
            onSearch={onSubmitSearch}
            onClear={onClearSearch}
            onToggleAdvanced={() => setShowAdvanced((prev) => !prev)}
            onImageSelect={onImageSelect}
            onClearImage={onClearImage}
          />

          <div className="hidden items-center justify-center px-2 pt-20 lg:flex">
            <div className="flex items-center gap-1">
              <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-[#6C3FF5]" />
              <ArrowRight className="h-8 w-8 text-[#6C3FF5]" />
              <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-[#6C3FF5]" />
            </div>
          </div>

          <SummaryCard
            keyword={filters.keyword}
            category={filters.category}
            location={filters.location}
            imageSearchUsed={hasSearchedWithImage}
          />
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {hasActiveSearch ? 'Matching Results' : 'All items'}
            </h2>
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
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedResults.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={{
                      id: item.id,
                      title: item.title,
                      image: item.image,
                      location: item.location,
                      date: item.date,
                      matchLevel: item.matchLevel,
                      matchPercentage: item.matchPercentage,
                      isLowConfidenceMatch: item.isLowConfidenceMatch,
                    }}
                    showImageMatchDetails={hasSearchedWithImage}
                    onOpen={() => setSelectedItem(item)}
                  />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </section>
      </section>

      {selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] shadow-2xl">
            <div className="relative">
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder.png';
                }}
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
