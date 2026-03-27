'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export type Message = {
  _id?: string;
  senderId: string;
  text: string;
  createdAt: string;
};

type Props = {
  messages: Message[];
  currentUserId: string;
  onSend: (text: string) => void;
  itemTitle?: string;
  itemImage?: string;
  itemCategory?: string;
  otherUserLabel: string;
};

const SERVER_ORIGIN =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function resolveImg(src?: string) {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${SERVER_ORIGIN}${src}`;
}

export default function ChatWindow({
  messages,
  currentUserId,
  onSend,
  itemTitle,
  itemImage,
  itemCategory,
  otherUserLabel,
}: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const imgSrc = resolveImg(itemImage);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header with item info ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3">
        {/* Item thumbnail */}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt=""
            className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 ring-1 ring-white/10">
            <Package className="size-4 text-blue-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-white">
            {itemTitle ?? 'Conversation'}
          </h2>
          <div className="flex items-center gap-2 text-xs text-white/45">
            {itemCategory && (
              <>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                  {itemCategory}
                </span>
                <span className="text-white/20">|</span>
              </>
            )}
            <span>with {otherUserLabel}</span>
          </div>
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/10 mb-3">
              <Send className="size-5 text-white/20" />
            </div>
            <p className="text-sm text-white/30">No messages yet</p>
            <p className="text-xs text-white/15 mt-1">Send a message to start the conversation</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUserId;
          // Show timestamp if first message or 5+ min gap from previous
          const showTime =
            i === 0 ||
            new Date(msg.createdAt).getTime() -
              new Date(messages[i - 1].createdAt).getTime() >
              300_000;

          return (
            <div key={msg._id ?? i}>
              {showTime && (
                <p className="my-3 text-center text-[10px] text-white/25">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </p>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {/* Avatar for other user */}
                {!isMe && (
                  <div className="mr-2 mt-auto flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 text-[10px] font-bold text-emerald-300 ring-1 ring-white/10">
                    {otherUserLabel.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className={`max-w-[70%] px-3.5 py-2 text-sm leading-relaxed ${
                    isMe
                      ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/10'
                      : 'rounded-2xl rounded-bl-md bg-white/[0.08] text-white/90 ring-1 ring-white/[0.06]'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-white/10 bg-white/[0.02] px-4 py-3"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-blue-500/60 focus:bg-white/[0.06] focus:ring-1 focus:ring-blue-500/20"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-400 hover:to-blue-500 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
