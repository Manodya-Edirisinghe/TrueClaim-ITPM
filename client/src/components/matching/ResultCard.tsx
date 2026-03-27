'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, X, MapPin, Tag, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUserId } from '@/lib/auth';

type MatchResult = {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  image: string;
  description?: string;
  contactNumber?: string;
  matchScore: number;
  ownerId?: string;
};

type ResultCardProps = {
  item: MatchResult;
  isHighlighted?: boolean;
};

export default function ResultCard({ item, isHighlighted = false }: ResultCardProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const handleMessageOwner = () => {
    const receiverId = item.ownerId ?? `owner_${item.id}`;
    const currentUserId = getCurrentUserId();

    if (receiverId === currentUserId) {
      toast.info('This is your own item.');
      return;
    }

    router.push(
      `/messages?itemId=${item.id}&receiverId=${encodeURIComponent(receiverId)}`
    );
  };

  return (
    <>
      <article
        className={`group overflow-hidden rounded-2xl border bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-blue-400/60 hover:bg-white/10 ${
          isHighlighted ? 'border-cyan-300/70 ring-1 ring-cyan-400/50' : 'border-white/10'
        }`}
      >
        <div className="relative">
          <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
        </div>

        <div className="space-y-3 p-4">
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>

          <div className="space-y-1 text-sm text-white/75">
            <p>
              <span className="text-white/55">Category:</span> {item.category}
            </p>
            <p>
              <span className="text-white/55">Location:</span> {item.location}
            </p>
            <p>
              <span className="text-white/55">Date Reported:</span> {item.date}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDetails(true)}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              View Details
            </button>
            <button
              onClick={handleMessageOwner}
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20"
              title="Message Owner"
            >
              <MessageCircle className="size-4" />
              Message
            </button>
          </div>
        </div>
      </article>

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      {showDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowDetails(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white/70 transition hover:bg-black/80 hover:text-white"
            >
              <X className="size-4" />
            </button>

            {/* Image */}
            <img
              src={item.image}
              alt={item.title}
              className="h-56 w-full object-cover"
            />

            {/* Content */}
            <div className="space-y-4 p-5">
              <h2 className="text-xl font-bold text-white">{item.title}</h2>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.06]">
                  <Tag className="size-3.5 text-blue-400" />
                  <div>
                    <p className="text-[10px] text-white/40">Category</p>
                    <p className="text-sm text-white/90">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.06]">
                  <MapPin className="size-3.5 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-white/40">Location</p>
                    <p className="text-sm text-white/90">{item.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.06]">
                  <Calendar className="size-3.5 text-amber-400" />
                  <div>
                    <p className="text-[10px] text-white/40">Date Reported</p>
                    <p className="text-sm text-white/90">{item.date}</p>
                  </div>
                </div>
                {item.contactNumber && (
                  <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.06]">
                    <FileText className="size-3.5 text-purple-400" />
                    <div>
                      <p className="text-[10px] text-white/40">Contact</p>
                      <p className="text-sm text-white/90">{item.contactNumber}</p>
                    </div>
                  </div>
                )}
              </div>

              {item.description && (
                <div>
                  <p className="mb-1 text-xs font-medium text-white/40">Description</p>
                  <p className="text-sm leading-relaxed text-white/75">{item.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    handleMessageOwner();
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  <MessageCircle className="size-4" />
                  Message Owner
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
