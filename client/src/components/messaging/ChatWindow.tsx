'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Send, Smile, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export type Message = {
  _id?: string;
  senderId: string;
  text: string;
  isDeleted?: boolean;
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
  canType: boolean;
  isOtherUserTyping: boolean;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onDeleteMessage: (messageId: string) => void;
};

const QUICK_EMOJIS = ['😀', '😂', '😍', '😎', '🤝', '🙏', '🔥', '🎉', '👍', '❤️', '✅', '🚀'];

export default function ChatWindow({
  messages,
  currentUserId,
  onSend,
  itemTitle,
  itemImage,
  itemCategory,
  otherUserLabel,
  canType,
  isOtherUserTyping,
  onTypingStart,
  onTypingStop,
  onDeleteMessage,
}: Props) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    setShowEmojiPicker(false);
    onTypingStop();
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => `${prev}${emoji}`);
    onTypingStart();
    inputRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    setText(value);
    if (!canType) return;

    onTypingStart();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const imgSrc = itemImage;

  return (
    <div className="flex h-full flex-col">
      {/* ── Header with item info ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3">
        {/* Item thumbnail */}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt=""
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/placeholder.png';
            }}
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
                  className={`max-w-[70%] px-3.5 py-2 text-sm leading-relaxed transition-all duration-200 ${
                    isMe
                      ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/10'
                      : 'rounded-2xl rounded-bl-md bg-white/[0.08] text-white/90 ring-1 ring-white/[0.06]'
                  }`}
                >
                  <p className={msg.isDeleted ? 'italic text-white/55' : ''}>{msg.text}</p>
                </div>

                {isMe && msg._id && !msg.isDeleted ? (
                  <div className="relative ml-1.5 mt-auto">
                    <button
                      type="button"
                      onClick={() => setMenuOpenFor((prev) => (prev === msg._id ? null : msg._id ?? null))}
                      className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-white/80"
                      title="Message options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuOpenFor === msg._id ? (
                      <div className="absolute bottom-8 right-0 z-10 min-w-28 rounded-md border border-white/10 bg-[#0d1422] p-1 shadow-lg shadow-black/30">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteMessage(msg._id as string);
                            setMenuOpenFor(null);
                          }}
                          className="w-full rounded px-2 py-1.5 text-left text-xs text-red-300 transition hover:bg-red-500/15"
                        >
                          Unsend
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {isOtherUserTyping ? (
          <div className="flex items-center gap-2 pl-1 text-xs text-white/55">
            <span>{otherUserLabel} is typing</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" style={{ animationDelay: '0.2s' }} />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" style={{ animationDelay: '0.4s' }} />
            </span>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 border-t border-white/10 bg-white/[0.02] px-4 py-3"
      >
        <button
          type="button"
          disabled={!canType}
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/75 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
          title="Emoji"
        >
          <Smile className="size-4" />
        </button>
        {showEmojiPicker ? (
          <div className="absolute bottom-16 left-4 z-20 w-64 rounded-xl border border-white/10 bg-[#0d1422] p-3 shadow-2xl shadow-black/40">
            <div className="grid grid-cols-6 gap-2">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="rounded-md bg-white/[0.04] py-1.5 text-lg transition hover:bg-white/[0.12]"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={canType ? 'Type a message…' : 'Load a conversation to start typing'}
          disabled={!canType}
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-blue-500/60 focus:bg-white/[0.06] focus:ring-1 focus:ring-blue-500/20"
        />
        <button
          type="submit"
          disabled={!canType || !text.trim()}
          className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-400 hover:to-blue-500 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
