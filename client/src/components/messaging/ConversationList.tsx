'use client';

import { Trash2, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { resolveImageUrl } from '@/lib/axios';

export type ConversationSummary = {
  _id: string;
  itemId: string;
  participants: string[];
  lastMessageAt: string;
  messages: { senderId: string; text: string; createdAt: string }[];
  itemTitle?: string;
  itemImage?: string;
  itemCategory?: string;
};

type Props = {
  conversations: ConversationSummary[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (conv: ConversationSummary) => void;
  onDelete: (conversationId: string) => void;
};

export default function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  onDelete,
}: Props) {
  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Package className="size-8 text-white/15" />
        <p className="text-sm text-white/30">No conversations yet</p>
        <p className="text-xs text-white/15">Message an item owner to start chatting</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {conversations.map((conv) => {
        const lastMsg = conv.messages[conv.messages.length - 1];
        const otherUser = conv.participants.find((p) => p !== currentUserId) ?? 'Unknown';
        const isActive = conv._id === activeId;
        const imgSrc = resolveImageUrl(conv.itemImage);

        return (
          <li key={conv._id} className="group relative">
            <button
              onClick={() => onSelect(conv)}
              className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-blue-500/10 border-l-2 border-blue-500'
                  : 'hover:bg-white/[0.04] border-l-2 border-transparent'
              }`}
            >
              {/* Item thumbnail */}
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt=""
                  className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/15 to-indigo-500/15 ring-1 ring-white/10">
                  <Package className="size-4 text-blue-400/60" />
                </div>
              )}

              {/* Text content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-white">
                    {conv.itemTitle ?? 'Item conversation'}
                  </span>
                  {lastMsg && (
                    <span className="shrink-0 text-[10px] text-white/30">
                      {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>

                {conv.itemCategory && (
                  <span className="mt-0.5 inline-block rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/35">
                    {conv.itemCategory}
                  </span>
                )}

                <p className="mt-0.5 text-[11px] text-white/40">
                  with{' '}
                  {otherUser.startsWith('user_')
                    ? `User ${otherUser.slice(5)}`
                    : otherUser}
                </p>

                {lastMsg && (
                  <p className="mt-1 truncate text-xs text-white/50">
                    {lastMsg.senderId === currentUserId ? 'You: ' : ''}
                    {lastMsg.text}
                  </p>
                )}
              </div>
            </button>

            {/* Delete button — visible on hover, bottom-right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this conversation? This cannot be undone.')) {
                  onDelete(conv._id);
                }
              }}
              className="absolute bottom-2.5 right-2 rounded-lg p-1.5 text-transparent transition-colors group-hover:text-red-400/70 hover:!bg-red-500/15 hover:!text-red-300"
              title="Delete conversation"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
