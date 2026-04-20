'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ContactRound, MapPin, Shapes, Sparkles } from 'lucide-react';
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
  ownerDisplayName?: string;
  ownerAvatarUrl?: string;
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
  ownerDisplayName?: string;
  ownerAvatarUrl?: string | null;
};

type ClaimFormState = {
  claimantName: string;
  claimantEmail: string;
  claimantContactNumber: string;
  uniqueAnswer: string;
};

type AuthMeResponse = {
  user?: {
    fullName?: string;
    universityEmail?: string;
    phoneNumber?: string;
  };
};

const CATEGORY_CLAIM_QUESTIONS: Record<string, string> = {
  'Wallet / Purse': 'What is the exact color and material inside lining of the wallet/purse?',
  Keys: 'How many keys are on the keychain, and is there any unique keychain tag/charm attached?',
  Phone: 'What is the lock screen wallpaper (main subject/colors)?',
  'Bag / Backpack': 'What brand/logo is on the bag, and what item is in the smallest zip pocket?',
  Documents: 'What is the document type and the last 4 characters of the document number?',
  Jewelry: 'What engraving, symbol, or hallmark is on the piece (inside band/clasp/back)?',
  Electronics: 'What is one accessory detail (case color, sticker, or charger type) that was with it?',
  Clothing: 'What is the size label and one distinctive mark/pattern/stitch detail?',
  Other: 'Name one very specific detail that is not visible in the public listing.',
};

const DEFAULT_CLAIM_QUESTION =
  'Name one very specific detail that is not visible in the public listing.';

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

function getCategoryClaimQuestion(category: string): string {
  return CATEGORY_CLAIM_QUESTIONS[category] ?? DEFAULT_CLAIM_QUESTION;
}

export default function MatchingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('keyword') ?? searchParams.get('title') ?? '';
  const initialCategory = searchParams.get('category') ?? 'All';
  const initialLocation = searchParams.get('location') ?? '';
  const sourceType =
    parseItemType(searchParams.get('sourceType')) ?? parseItemType(searchParams.get('itemType'));
  const claimItemId = searchParams.get('claimItemId');
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
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [handledAutoClaimItemId, setHandledAutoClaimItemId] = useState<string | null>(null);
  const [pendingAutoClaimItemId, setPendingAutoClaimItemId] = useState<string | null>(null);
  const [claimForm, setClaimForm] = useState<ClaimFormState>({
    claimantName: '',
    claimantEmail: '',
    claimantContactNumber: '',
    uniqueAnswer: '',
  });
  const showImageSearchLoading = isSearching && Boolean(uploadedImage);

  const claimQuestion = useMemo(
    () => (selectedItem ? getCategoryClaimQuestion(selectedItem.category) : DEFAULT_CLAIM_QUESTION),
    [selectedItem]
  );

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
          ownerDisplayName: entry.ownerDisplayName ?? 'Item Owner',
          ownerAvatarUrl: resolveImageUrl(entry.ownerAvatarUrl) ?? undefined,
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

  useEffect(() => {
    if (!claimItemId || isLoadingItems) return;
    if (handledAutoClaimItemId === claimItemId) return;

    const candidate = results.find((entry) => entry.id === claimItemId);
    if (!candidate) return;

    setSelectedItem(candidate);
    setPendingAutoClaimItemId(claimItemId);
    setHandledAutoClaimItemId(claimItemId);
  }, [claimItemId, isLoadingItems, results, handledAutoClaimItemId]);

  useEffect(() => {
    if (!pendingAutoClaimItemId || !selectedItem) return;
    if (selectedItem.id !== pendingAutoClaimItemId) return;

    void openClaimModal();
    setPendingAutoClaimItemId(null);
  }, [pendingAutoClaimItemId, selectedItem]);

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

  const openClaimModal = async () => {
    if (!selectedItem) return;

    const currentUserId = getCurrentUserId();
    if (selectedItem.ownerId && selectedItem.ownerId === currentUserId) {
      toast.info('You cannot claim your own listing.');
      return;
    }

    setClaimForm((prev) => ({
      ...prev,
      uniqueAnswer: '',
    }));
    setIsClaimModalOpen(true);

    try {
      const { data } = await api.get<AuthMeResponse>('/auth/me');
      const user = data?.user;
      setClaimForm((prev) => ({
        ...prev,
        claimantName: user?.fullName?.trim() || prev.claimantName,
        claimantEmail: user?.universityEmail?.trim() || prev.claimantEmail,
        claimantContactNumber: user?.phoneNumber?.trim() || prev.claimantContactNumber,
      }));
    } catch {
      // Keep manual entry when user profile is unavailable.
    }
  };

  const submitClaim = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedItem) return;

    const payload = {
      itemId: selectedItem.id,
      claimantName: claimForm.claimantName.trim(),
      claimantEmail: claimForm.claimantEmail.trim().toLowerCase(),
      claimantContactNumber: claimForm.claimantContactNumber.trim(),
      uniqueQuestion: claimQuestion,
      uniqueAnswer: claimForm.uniqueAnswer.trim(),
    };

    if (
      !payload.claimantName ||
      !payload.claimantEmail ||
      !payload.claimantContactNumber ||
      !payload.uniqueAnswer
    ) {
      toast.error('Please fill in your name, email, contact number, and answer.');
      return;
    }

    try {
      setIsSubmittingClaim(true);
      await api.post('/claims', payload);
      toast.success('Claim submitted. Your answer is sent to the verification dashboard.');
      setIsClaimModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('[Claim Submit Error]', error);
      toast.error('Failed to submit claim. Please try again.');
    } finally {
      setIsSubmittingClaim(false);
    }
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
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-[#6C3FF5]" />
                <ArrowRight className="h-8 w-8 text-[#6C3FF5]" />
                <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-[#6C3FF5]" />
              </div>
              {showAdvanced ? (
                <div
                  data-testid="powered-by-ai"
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-500/12 px-2.5 py-1 text-[11px] font-semibold text-cyan-100 backdrop-blur-md animate-[pulse_4s_ease-in-out_infinite]"
                >
                  <Sparkles className="h-3 w-3" />
                  Powered by AI
                </div>
              ) : null}
            </div>
          </div>

          <SummaryCard
            keyword={filters.keyword}
            category={filters.category}
            location={filters.location}
            imageSearchUsed={hasSearchedWithImage}
          />
        </div>

        <section data-testid="results-section" className="mt-8">
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
                      category: item.category,
                      image: item.image,
                      location: item.location,
                      date: item.date,
                      itemType: item.itemType,
                      matchLevel: item.matchLevel,
                      matchPercentage: item.matchPercentage,
                      isLowConfidenceMatch: item.isLowConfidenceMatch,
                      ownerDisplayName: item.ownerDisplayName,
                      ownerAvatarUrl: item.ownerAvatarUrl,
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
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white/[0.09] shadow-[0_30px_70px_rgba(2,8,23,0.68)] backdrop-blur-2xl">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/70 text-xs font-bold text-white">
                  {(selectedItem.ownerDisplayName?.trim()?.charAt(0) || 'U').toUpperCase()}
                </span>
                <span className="max-w-[160px] truncate text-xs font-semibold text-white/95">
                  {selectedItem.ownerDisplayName?.trim() || 'Item Owner'}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <h3 className="text-xl font-semibold text-white">{selectedItem.title}</h3>
              <p className="text-sm text-white/75">{selectedItem.description || 'No description available.'}</p>

              <div className="grid grid-cols-1 gap-2 text-sm text-white/75 sm:grid-cols-2">
                <p className="inline-flex items-center gap-2">
                  <Shapes className="h-4 w-4 text-cyan-200" />
                  <span><span className="text-white/45">Category:</span> {selectedItem.category}</span>
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-200" />
                  <span><span className="text-white/45">Location:</span> {selectedItem.location}</span>
                </p>
                {selectedItem.contactNumber ? (
                  <p className="inline-flex items-center gap-2 sm:col-span-2">
                    <ContactRound className="h-4 w-4 text-cyan-200" />
                    <span><span className="text-white/45">Contact:</span> {selectedItem.contactNumber}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/85 backdrop-blur-md transition duration-200 hover:scale-[1.02] hover:bg-white/20 hover:shadow-[0_0_18px_rgba(255,255,255,0.18)]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => void openClaimModal()}
                  className="rounded-lg border border-amber-200/30 bg-amber-400/22 px-4 py-2 text-sm font-semibold text-amber-50 backdrop-blur-md transition duration-200 hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_0_18px_rgba(251,191,36,0.45)]"
                >
                  Claim Item
                </button>
                <button
                  type="button"
                  onClick={onMessageOwner}
                  className="rounded-lg border border-blue-200/30 bg-blue-500/28 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur-md transition duration-200 hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_0_18px_rgba(59,130,246,0.45)]"
                >
                  Message Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isClaimModalOpen && selectedItem ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#101625] p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Claim {selectedItem.title}</h3>
                <p className="text-xs text-white/60">Category: {selectedItem.category}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="rounded-md border border-white/20 px-2.5 py-1 text-xs font-medium text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitClaim} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={claimForm.claimantName}
                  onChange={(event) =>
                    setClaimForm((prev) => ({ ...prev, claimantName: event.target.value }))
                  }
                  placeholder="Your full name"
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                />
                <input
                  type="email"
                  value={claimForm.claimantEmail}
                  onChange={(event) =>
                    setClaimForm((prev) => ({ ...prev, claimantEmail: event.target.value }))
                  }
                  placeholder="University email"
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                />
              </div>

              <input
                value={claimForm.claimantContactNumber}
                onChange={(event) =>
                  setClaimForm((prev) => ({
                    ...prev,
                    claimantContactNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
                  }))
                }
                placeholder="Contact number"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
              />

              <div className="rounded-lg border border-indigo-300/30 bg-indigo-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">
                  Unique verification question
                </p>
                <p className="mt-1 text-sm text-indigo-50">{claimQuestion}</p>
              </div>

              <textarea
                value={claimForm.uniqueAnswer}
                onChange={(event) =>
                  setClaimForm((prev) => ({ ...prev, uniqueAnswer: event.target.value }))
                }
                rows={4}
                placeholder="Your answer"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70"
                >
                  {isSubmittingClaim ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
