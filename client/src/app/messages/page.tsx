'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import api from '@/lib/axios';
import { getCurrentUserId } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import ConversationList, {
  type ConversationSummary,
} from '@/components/messaging/ConversationList';
import ChatWindow, { type Message } from '@/components/messaging/ChatWindow';

// ─── Messages Page ───────────────────────────────────────────────────────────
// Layout: left sidebar (conversation list) + right panel (active chat).
// Opens a specific item chat when navigated with ?itemId=...&receiverId=...

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const currentUserId = getCurrentUserId();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemTitles, setItemTitles] = useState<Record<string, string>>({});

  // ── Fetch all conversations ──────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/conversations', {
        headers: { 'x-user-id': currentUserId },
      });
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // ── Fetch messages for a specific item ───────────────────────────────────
  const fetchItemMessages = useCallback(
    async (itemId: string) => {
      try {
        const { data } = await api.get(`/messages/${itemId}`, {
          headers: { 'x-user-id': currentUserId },
        });
        setMessages(data.messages ?? []);
        return data as ConversationSummary;
      } catch (err) {
        console.error('Failed to fetch messages', err);
        return null;
      }
    },
    [currentUserId]
  );

  // ── Enrich conversations with item titles ────────────────────────────────
  const enrichItemTitle = useCallback(
    async (itemId: string) => {
      if (itemTitles[itemId]) return itemTitles[itemId];
      try {
        const { data } = await api.get(`/items/${itemId}`);
        const title = data.itemTitle ?? data.title ?? 'Unknown Item';
        setItemTitles((prev) => ({ ...prev, [itemId]: title }));
        return title;
      } catch {
        return 'Unknown Item';
      }
    },
    [itemTitles]
  );

  // ── Initialize: load conversations + handle deep link ────────────────────
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle deep link: ?itemId=...&receiverId=...
  useEffect(() => {
    const itemId = searchParams.get('itemId');
    const receiverId = searchParams.get('receiverId');
    if (!itemId || !receiverId || !currentUserId) return;

    (async () => {
      const conv = await fetchItemMessages(itemId);
      if (conv && conv._id) {
        setActiveConv(conv);
      } else {
        // No conversation yet — set up a placeholder so the user can type
        setActiveConv({
          _id: '',
          itemId,
          participants: [currentUserId, receiverId],
          lastMessageAt: new Date().toISOString(),
          messages: [],
        });
        setMessages([]);
      }
      await enrichItemTitle(itemId);
    })();
  }, [searchParams, currentUserId, fetchItemMessages, enrichItemTitle]);

  // ── Socket.IO: real-time message reception ───────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socket.connect();

    if (activeConv?._id) {
      socket.emit('join_conversation', activeConv._id);
    }

    socket.on('receive_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [activeConv?._id]);

  // ── Send a message ───────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    if (!activeConv) return;

    const receiverId =
      activeConv.participants.find((p) => p !== currentUserId) ?? '';

    try {
      const { data } = await api.post(
        '/messages/send',
        { itemId: activeConv.itemId, receiverId, text },
        { headers: { 'x-user-id': currentUserId } }
      );

      // Update local state with the full conversation from the server
      setMessages(data.messages ?? []);
      setActiveConv(data);

      // Emit via socket for real-time delivery to the other user
      const socket = getSocket();
      const lastMsg = data.messages[data.messages.length - 1];
      socket.emit('send_message', {
        conversationId: data._id,
        message: lastMsg,
      });

      // Refresh conversation list
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // ── Delete a conversation ────────────────────────────────────────────────
  const handleDelete = async (conversationId: string) => {
    try {
      await api.delete(`/conversations/${conversationId}`, {
        headers: { 'x-user-id': currentUserId },
      });

      // Clear the active chat if we just deleted it
      if (activeConv?._id === conversationId) {
        setActiveConv(null);
        setMessages([]);
      }

      // Remove from the sidebar list
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  // ── Select a conversation from the sidebar ───────────────────────────────
  const handleSelect = async (conv: ConversationSummary) => {
    setActiveConv(conv);
    setMessages(conv.messages ?? []);
    await enrichItemTitle(conv.itemId);
  };

  // ── Derived values ───────────────────────────────────────────────────────
  const otherUser = activeConv
    ? activeConv.participants.find((p) => p !== currentUserId) ?? 'Unknown'
    : '';
  const otherUserLabel = otherUser.startsWith('user_')
    ? `User ${otherUser.slice(5)}`
    : otherUser;
  const activeItemTitle =
    activeConv && itemTitles[activeConv.itemId]
      ? itemTitles[activeConv.itemId]
      : undefined;

  // Enrich titles for sidebar
  const enrichedConversations = conversations.map((c) => ({
    ...c,
    itemTitle: itemTitles[c.itemId],
  }));

  // Trigger title enrichment for visible conversations
  useEffect(() => {
    conversations.forEach((c) => {
      if (!itemTitles[c.itemId]) enrichItemTitle(c.itemId);
    });
  }, [conversations, itemTitles, enrichItemTitle]);

  return (
    <div className="min-h-screen bg-[#05070c] pt-24 px-4 pb-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
          <MessageSquare className="size-6" />
          Messages
        </h1>

        <div className="flex h-[calc(100vh-180px)] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          {/* Left: Conversation list */}
          <div className="w-80 shrink-0 border-r border-white/10 overflow-y-auto">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-white/70">Conversations</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-10">
                <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-blue-500" />
              </div>
            ) : (
              <ConversationList
                conversations={enrichedConversations}
                activeId={activeConv?._id ?? null}
                currentUserId={currentUserId}
                onSelect={handleSelect}
                onDelete={handleDelete}
              />
            )}
          </div>

          {/* Right: Chat window */}
          <div className="flex-1">
            {activeConv ? (
              <ChatWindow
                messages={messages}
                currentUserId={currentUserId}
                onSend={handleSend}
                itemTitle={activeItemTitle}
                otherUserLabel={otherUserLabel}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-white/30">
                <MessageSquare className="size-12 mb-3" />
                <p className="text-sm">Select a conversation or message an item owner</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
