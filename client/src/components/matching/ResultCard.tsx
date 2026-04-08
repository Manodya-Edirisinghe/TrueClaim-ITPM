'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { getCurrentUserId } from '@/lib/auth';

type MatchResult = {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
  image: string;
  matchScore: number;
  // Owner ID for messaging — falls back to the item ID as a pseudo-owner
  ownerId?: string;
};

type ResultCardProps = {
  item: MatchResult;
  isHighlighted?: boolean;
};

export default function ResultCard({ item, isHighlighted = false }: ResultCardProps) {
  const router = useRouter();

  const handleMessageOwner = () => {
    // Use the ownerId if available, otherwise use the item's id as a
    // deterministic pseudo-owner so conversations are still scoped per item.
    const receiverId = item.ownerId ?? `owner_${item.id}`;
    const currentUserId = getCurrentUserId();

    // Don't let a user message themselves
    if (receiverId === currentUserId) return;

    router.push(
      `/messages?itemId=${item.id}&receiverId=${encodeURIComponent(receiverId)}`
    );
  };

  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-blue-400/60 hover:bg-white/10 ${
        isHighlighted ? 'border-cyan-300/70 ring-1 ring-cyan-400/50' : 'border-white/10'
      }`}
    >
      <div className="relative">
        <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
        <div className="absolute right-3 top-3 rounded-full border border-blue-300/50 bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100">
          {item.matchScore}% Match
        </div>
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
          <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
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
  );
}
