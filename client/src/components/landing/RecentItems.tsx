'use client';

import { useEffect, useMemo, useState } from 'react';
import { ContactRound, MapPin, Shapes } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api, { resolveImageUrl } from '@/lib/axios';
import { getCurrentUserId } from '@/lib/auth';
import Pagination from '@/components/matching/Pagination';
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
const ITEMS_PER_PAGE = 12;

type ClaimFormState = {
  claimantName: string;
  claimantEmail: string;
  claimantContactNumber: string;
  uniqueAnswer: string;
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

function toDateOnly(value: string): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function RecentItems() {
  const router = useRouter();
  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<ApiItem | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimForm, setClaimForm] = useState<ClaimFormState>({
    claimantName: '',
    claimantEmail: '',
    claimantContactNumber: '',
    uniqueAnswer: '',
  });

  const claimQuestion = useMemo(
    () =>
      CATEGORY_CLAIM_QUESTIONS[selectedItem?.itemCategory ?? ''] ??
      DEFAULT_CLAIM_QUESTION,
    [selectedItem]
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/items', {
          params: { page: currentPage, limit: ITEMS_PER_PAGE },
        });
        setItems(data.items ?? []);
        setTotalPages(data?.meta?.pages ?? 1);
      } catch {
        // Silently fail — this is just a preview section
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPage]);

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
      const { data } = await api.get('/auth/me');
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
      itemId: selectedItem._id,
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

  const handleMessageOwner = () => {
    if (!selectedItem?.ownerId) {
      toast.error('Item owner is unavailable for messaging.');
      return;
    }

    const currentUserId = getCurrentUserId();
    if (selectedItem.ownerId === currentUserId) {
      toast.info('This item is submitted by you');
      return;
    }

    router.push(
      `/messages?itemId=${selectedItem._id}&receiverId=${encodeURIComponent(selectedItem.ownerId)}`
    );
  };

  const deriveOwnerEmail = (value?: string) => {
    if (!value) return undefined;
    return value.includes('@') ? value : undefined;
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
            Recent Activity
          </p>
          <h2 className="text-3xl font-bold text-white">Recently Reported Items</h2>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
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
        <>
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
                  ownerEmail: deriveOwnerEmail(item.ownerDisplayName),
                }}
                claimHref={`/matching?claimItemId=${encodeURIComponent(item._id)}`}
                claimLabel="Claim"
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

      {selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white/[0.09] shadow-[0_30px_70px_rgba(2,8,23,0.68)] backdrop-blur-2xl">
            <div className="relative">
              <img
                src={resolveImageUrl(selectedItem.imageUrl) ?? FALLBACK_IMAGE}
                alt={selectedItem.itemTitle}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder.png';
                }}
                className="h-64 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

              <div className="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/25 bg-black/40 px-2.5 py-1.5 backdrop-blur-md">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/70 text-xs font-bold text-white">
                  {(selectedItem.ownerDisplayName?.trim()?.charAt(0) || 'U').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <h3 className="text-xl font-semibold text-white">{selectedItem.itemTitle}</h3>
              <p className="text-sm text-white/75">{selectedItem.description || 'No description available.'}</p>

              <div className="grid grid-cols-1 gap-2 text-sm text-white/75 sm:grid-cols-2">
                <p className="inline-flex items-center gap-2">
                  <Shapes className="h-4 w-4 text-cyan-200" />
                  <span><span className="text-white/45">Category:</span> {selectedItem.itemCategory}</span>
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
                  onClick={handleMessageOwner}
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
                <h3 className="text-lg font-semibold text-white">Claim {selectedItem.itemTitle}</h3>
                <p className="text-xs text-white/60">Category: {selectedItem.itemCategory}</p>
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
    </section>
  );
}
