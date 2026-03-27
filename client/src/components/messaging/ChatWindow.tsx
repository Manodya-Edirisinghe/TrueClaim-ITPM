'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
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
  otherUserLabel: string;
};

export default function ChatWindow({
  messages,
  currentUserId,
  onSend,
  itemTitle,
  otherUserLabel,
}: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-3">
        <h2 className="text-sm font-semibold text-white">{itemTitle ?? 'Conversation'}</h2>
        <p className="text-xs text-white/50">Chatting with {otherUserLabel}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-white/30 mt-10">
            No messages yet. Say hello!
          </p>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg._id ?? i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white/10 text-white/90 rounded-bl-md'
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-white/40'}`}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500 transition"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-white transition hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
