'use client';

import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export type ConversationSummary = {
  _id: string;
  itemId: string;
  participants: string[];
  lastMessageAt: string;
  messages: { senderId: string; text: string; createdAt: string }[];
  // Enriched on the client side
  itemTitle?: string;
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
      <div className="flex h-full items-center justify-center p-6 text-center text-white/40">
        <p>No conversations yet. Message an item owner to start chatting!</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/10 overflow-y-auto">
      {conversations.map((conv) => {
        const lastMsg = conv.messages[conv.messages.length - 1];
        const otherUser = conv.participants.find((p) => p !== currentUserId) ?? 'Unknown';
        const isActive = conv._id === activeId;

        return (
          <li key={conv._id} className="group relative">
            <button
              onClick={() => onSelect(conv)}
              className={`w-full px-4 py-3 text-left transition hover:bg-white/5 ${
                isActive ? 'bg-white/10 border-l-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white truncate pr-6">
                  {conv.itemTitle ?? `Item conversation`}
                </span>
                {lastMsg && (
                  <span className="text-[11px] text-white/40 whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5 truncate">
                with {otherUser.startsWith('user_') ? `User ${otherUser.slice(5)}` : otherUser}
              </p>
              {lastMsg && (
                <p className="text-xs text-white/60 mt-1 truncate">
                  {lastMsg.senderId === currentUserId ? 'You: ' : ''}
                  {lastMsg.text}
                </p>
              )}
            </button>

            {/* Delete button — visible on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this conversation? This cannot be undone.')) {
                  onDelete(conv._id);
                }
              }}
              className="absolute right-2 top-3 rounded-lg p-1.5 text-white/0 transition group-hover:text-red-400 hover:!bg-red-500/20 hover:!text-red-300"
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
