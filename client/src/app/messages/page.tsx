'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare, Search } from 'lucide-react';
import api, { resolveImageUrl } from '@/lib/axios';
import { getCurrentUserId } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import ConversationList, {
  type ConversationSummary,
} from '@/components/messaging/ConversationList';
import ChatWindow, { type Message } from '@/components/messaging/ChatWindow';

// ─── Messages Page ───────────────────────────────────────────────────────────

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const currentUserId = getCurrentUserId();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [itemCache, setItemCache] = useState<Record<string, { title: string; image?: string; category?: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Ref to avoid stale closure in enrichItemInfo
  const itemCacheRef = useRef(itemCache);
  itemCacheRef.current = itemCache;

  // ── Fetch all conversations ──────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/conversations');
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
      setConversationLoaded(false);
      try {
        const { data } = await api.get(`/messages/${itemId}`);
        setMessages(data.messages ?? []);
        setConversationLoaded(true);
        return data as ConversationSummary;
      } catch (err) {
        console.error('Failed to fetch messages', err);
        setConversationLoaded(false);
        return null;
      }
    },
    [currentUserId]
  );

  // ── Enrich conversations with item info (title, image, category) ────────
  const enrichItemInfo = useCallback(
    async (itemId: string) => {
      if (itemCacheRef.current[itemId]) return itemCacheRef.current[itemId];
      try {
        const { data } = await api.get(`/items/${itemId}`);
        const item = data.item ?? data;
        const info = {
          title: item.itemTitle ?? item.title ?? 'Untitled Item',
          image: resolveImageUrl(item.imageUrl) ?? undefined,
          category: item.itemCategory ?? item.category,
        };
        setItemCache((prev) => ({ ...prev, [itemId]: info }));
        return info;
      } catch {
        const fallback = { title: 'Deleted Item' };
        setItemCache((prev) => ({ ...prev, [itemId]: fallback }));
        return fallback;
      }
    },
    []
  );

  // ── Initialize ───────────────────────────────────────────────────────────
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
        setActiveConv({
          _id: '',
          itemId,
          participants: [currentUserId, receiverId],
          lastMessageAt: new Date().toISOString(),
          messages: [],
        });
        setMessages([]);
      }
      await enrichItemInfo(itemId);
    })();
  }, [searchParams, currentUserId, fetchItemMessages, enrichItemInfo]);

  // ── Socket.IO ────────────────────────────────────────────────────────────
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
    if (!activeConv || !conversationLoaded) return;

    const receiverId =
      activeConv.participants.find((p) => p !== currentUserId) ?? '';

    try {
      const { data } = await api.post('/messages/send', {
        itemId: activeConv.itemId,
        receiverId,
        text,
      });

      setMessages(data.messages ?? []);
      setActiveConv(data);

      const socket = getSocket();
      const lastMsg = data.messages[data.messages.length - 1];
      socket.emit('send_message', {
        conversationId: data._id,
        message: lastMsg,
      });

      fetchConversations();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // ── Delete a conversation ──────────────────────────────────────────────
  const handleDelete = async (conversationId: string) => {
    try {
      await api.delete(`/conversations/${conversationId}`);

      if (activeConv?._id === conversationId) {
        setActiveConv(null);
        setMessages([]);
      }

      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  // ── Select a conversation ──────────────────────────────────────────────
  const handleSelect = async (conv: ConversationSummary) => {
    setConversationLoaded(false);
    setActiveConv(conv);
    setMessages(conv.messages ?? []);
    const loadedConv = await fetchItemMessages(conv.itemId);
    if (loadedConv) {
      setActiveConv(loadedConv);
    }
    await enrichItemInfo(conv.itemId);
  };

  // ── Derived values ─────────────────────────────────────────────────────
  const otherUser = activeConv
    ? activeConv.participants.find((p) => p !== currentUserId) ?? 'Unknown'
    : '';
  const otherUserLabel = otherUser.startsWith('user_')
    ? `User ${otherUser.slice(5)}`
    : otherUser;
  const activeItemInfo = activeConv ? itemCache[activeConv.itemId] : undefined;

  // Enrich + filter conversations for the sidebar
  const enrichedConversations = conversations.map((c) => ({
    ...c,
    itemTitle: itemCache[c.itemId]?.title,
    itemImage: itemCache[c.itemId]?.image,
    itemCategory: itemCache[c.itemId]?.category,
  }));

  const filteredConversations = searchQuery
    ? enrichedConversations.filter(
        (c) =>
          c.itemTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.participants.some((p) =>
            p.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : enrichedConversations;

  // Trigger title enrichment for visible conversations
  useEffect(() => {
    conversations.forEach((c) => {
      if (!itemCache[c.itemId]) enrichItemInfo(c.itemId);
    });
  }, [conversations, itemCache, enrichItemInfo]);

  return (
    <div className="min-h-screen bg-[#05070c] pt-24 px-4 pb-6">
      <div className="mx-auto max-w-6xl">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <MessageSquare className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            <p className="text-xs text-white/40">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex h-[calc(100vh-180px)] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-2xl shadow-black/40">
          {/* ── Left sidebar ──────────────────────────────────────────── */}
          <div className="flex w-80 shrink-0 flex-col border-r border-white/10 bg-white/[0.02]">
            {/* Sidebar header + search */}
            <div className="border-b border-white/10 p-3 space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                Conversations
              </h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/25 outline-none focus:border-blue-500/50 transition"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-10">
                  <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-blue-500" />
                </div>
              ) : (
                <ConversationList
                  conversations={filteredConversations}
                  activeId={activeConv?._id ?? null}
                  currentUserId={currentUserId}
                  onSelect={handleSelect}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </div>

          {/* ── Right: Chat window ────────────────────────────────────── */}
          <div className="flex-1 bg-[#080b12]">
            {activeConv ? (
              <ChatWindow
                messages={messages}
                currentUserId={currentUserId}
                onSend={handleSend}
                itemTitle={activeItemInfo?.title}
                itemImage={activeItemInfo?.image}
                itemCategory={activeItemInfo?.category}
                otherUserLabel={otherUserLabel}
                canType={conversationLoaded}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <div className="flex size-20 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/10">
                  <MessageSquare className="size-8 text-white/20" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white/40">No chat selected</p>
                  <p className="mt-1 text-xs text-white/20">
                    Pick a conversation or message an item owner
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
