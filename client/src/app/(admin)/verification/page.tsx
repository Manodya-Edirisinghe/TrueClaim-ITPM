"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Bell, LayoutDashboard, ShieldCheck, Trash2 } from "lucide-react";

type ClaimItem = {
  _id: string;
  itemTitle: string;
  itemCategory: string;
  location: string;
  claimStatus?: "open" | "under_verification" | "claim_verified" | "claimed";
};

type VerificationClaim = {
  _id: string;
  verificationId: string;
  status: "pending_verification" | "claim_verified" | "approved" | "rejected";
  claimantName: string;
  claimantEmail: string;
  claimantContactNumber: string;
  serialNumber: string;
  lostPlace: string;
  verificationEndsAt: string;
  countdownRemainingMs: number;
  claimerCount: number;
  meetingLocation?: string;
  meetingDateTime?: string;
  itemId: ClaimItem;
};

type LostFoundItem = {
  _id: string;
  itemType: "lost" | "found";
  itemTitle: string;
  itemCategory: string;
  description: string;
  location: string;
  contactNumber: string;
  time: string;
  claimStatus?: "open" | "under_verification" | "claim_verified" | "claimed";
  hasOwner?: boolean;
  ownerClaimId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string | null;
  claimableQueueStartedAt?: string | null;
  claimableQueueEndsAt?: string | null;
  claimableQueuePaused?: boolean;
  claimableQueueRemainingMs?: number | null;
  needsOwnerReclaim?: boolean;
};

type ItemNotification = {
  id: string;
  itemId?: string;
  itemType: "lost" | "found";
  itemTitle: string;
  location: string;
  createdAt?: string;
  detectedAt: string;
  status: "new" | "read";
};

type NotificationApiRecord = {
  _id: string;
  itemId?: string | null;
  itemType: "lost" | "found";
  itemTitle: string;
  location: string;
  itemCreatedAt?: string;
  detectedAt: string;
  isRead: boolean;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Countdown ended";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function getUniqueVerificationQuestions(claim: VerificationClaim): string[] {
  const itemTitle = claim.itemId?.itemTitle ?? "item";

  return [
    `What is one hidden or personal mark on the ${itemTitle}?`,
    `Tell the exact location and date where you lost this ${itemTitle}.`,
    "What accessories or stickers were attached to the item at the time it was lost?",
    "Share one proof of ownership (invoice photo, old photo, or warranty detail).",
    "Confirm the serial number or lock pattern and explain where it appears on the item.",
  ];
}

function MeetingForm({
  claim,
  onScheduled,
}: {
  claim: VerificationClaim;
  onScheduled: () => Promise<void>;
}) {
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingDateTime, setMeetingDateTime] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!meetingLocation || !meetingDateTime) {
      toast.error("Meeting location and date/time are required.");
      return;
    }

    try {
      setSaving(true);
      const response = await api.post(`/claims/${claim._id}/verify`, {
        meetingLocation,
        meetingDateTime,
        broadcastToAllClaimers: true,
      });
      const updatedClaimsCount = Number(response.data?.updatedClaimsCount ?? 1);
      toast.success(
        updatedClaimsCount > 1
          ? `Meeting details sent to ${updatedClaimsCount} claimers.`
          : "Claim moved to claim verified category."
      );
      setMeetingLocation("");
      setMeetingDateTime("");
      await onScheduled();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error ?? "Failed to schedule verification meeting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-2">
      <input
        value={meetingLocation}
        onChange={(event) => setMeetingLocation(event.target.value)}
        placeholder="Meeting location"
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-[#0A66C2]"
      />
      <input
        type="datetime-local"
        value={meetingDateTime}
        onChange={(event) => setMeetingDateTime(event.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-[#0A66C2]"
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-black transition hover:bg-gray-100 disabled:opacity-70 sm:col-span-2"
      >
        {saving ? "Saving..." : "Move to Claim Verified + Send to All Claimers"}
      </button>
    </form>
  );
}

function formatItemDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function LostFoundItemCard({
  item,
  onQueue,
  queueing,
}: {
  item: LostFoundItem;
  onQueue: (item: LostFoundItem) => void;
  queueing: boolean;
}) {
  const isQueued = Boolean(item.claimableQueueEndsAt) && item.claimStatus === "under_verification";
  const isPaused = Boolean(item.claimableQueuePaused);

  return (
    <article className="rounded-md border border-gray-200 bg-white p-3">
      <p className="text-sm font-semibold text-black">{item.itemTitle}</p>
      <p className="mt-1 text-xs text-gray-600">{item.description}</p>

      <div className="mt-2 grid gap-1 text-xs text-gray-700 sm:grid-cols-2">
        <p>Item ID: {item._id}</p>
        <p>Type: {item.itemType}</p>
        <p>Category: {item.itemCategory}</p>
        <p>Location: {item.location}</p>
        <p>Contact: {item.contactNumber}</p>
        <p>Claim Status: {item.claimStatus ?? "open"}</p>
        <p>Has Owner: {item.hasOwner ? "Yes" : "No"}</p>
        <p>Needs Reclaim: {item.needsOwnerReclaim ? "Yes" : "No"}</p>
        <p>Owner Claim ID: {item.ownerClaimId ?? "-"}</p>
        <p>Item Date: {formatItemDateTime(item.time)}</p>
        <p>Created At: {item.createdAt ? formatItemDateTime(item.createdAt) : "-"}</p>
        <p>Updated At: {item.updatedAt ? formatItemDateTime(item.updatedAt) : "-"}</p>
      </div>

      <div className="mt-3">
        <button
          type="button"
          disabled={queueing || isQueued || isPaused || item.claimStatus === "claimed"}
          onClick={() => onQueue(item)}
          className="rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {queueing
            ? "Adding to queue..."
            : isQueued || isPaused
              ? "Already in 48h Queue"
              : "Add to 48h Pending Queue"}
        </button>
      </div>
    </article>
  );
}

export default function VerificationDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "verification" | "notifications">("overview");
  const [claims, setClaims] = useState<VerificationClaim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [lostItems, setLostItems] = useState<LostFoundItem[]>([]);
  const [foundItems, setFoundItems] = useState<LostFoundItem[]>([]);
  const [itemNotifications, setItemNotifications] = useState<ItemNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [lostSearch, setLostSearch] = useState("");
  const [foundSearch, setFoundSearch] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [queueingItemId, setQueueingItemId] = useState<string | null>(null);
  const [stoppingQueueItemId, setStoppingQueueItemId] = useState<string | null>(null);
  const [pausingQueueItemId, setPausingQueueItemId] = useState<string | null>(null);
  const [resumingQueueItemId, setResumingQueueItemId] = useState<string | null>(null);
  const [sendingReclaimItemId, setSendingReclaimItemId] = useState<string | null>(null);
  const [resolvingClaimId, setResolvingClaimId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const loadClaims = async () => {
    try {
      setLoadingClaims(true);
      const response = await api.get("/claims", {
        params: {
          status: "pending_verification",
        },
      });
      const pending = (response.data?.claims ?? []) as VerificationClaim[];

      const verifiedResponse = await api.get("/claims", {
        params: {
          status: "claim_verified",
        },
      });

      const verified = (verifiedResponse.data?.claims ?? []) as VerificationClaim[];
      setClaims([...pending, ...verified]);
    } catch {
      toast.error("Failed to load verification claims.");
    } finally {
      setLoadingClaims(false);
    }
  };

  const loadLostFoundItems = async () => {
    try {
      setLoadingItems(true);
      const [lostResponse, foundResponse] = await Promise.all([
        api.get("/items", {
          params: {
            itemType: "lost",
            page: 1,
            limit: 50,
          },
        }),
        api.get("/items", {
          params: {
            itemType: "found",
            page: 1,
            limit: 50,
          },
        }),
      ]);

      setLostItems((lostResponse.data?.items ?? []) as LostFoundItem[]);
      setFoundItems((foundResponse.data?.items ?? []) as LostFoundItem[]);
    } catch {
      toast.error("Failed to load lost and found items.");
    } finally {
      setLoadingItems(false);
    }
  };

  const loadNotifications = async (showError = true) => {
    try {
      const response = await api.get("/notifications", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      const notifications = (response.data?.notifications ?? []) as NotificationApiRecord[];
      const unreadCount = Number(response.data?.unreadCount ?? 0);

      setItemNotifications(
        notifications.map((notification) => ({
          id: notification._id,
          itemId: notification.itemId ?? undefined,
          itemType: notification.itemType,
          itemTitle: notification.itemTitle,
          location: notification.location,
          createdAt: notification.itemCreatedAt,
          detectedAt: notification.detectedAt,
          status: notification.isRead ? "read" : "new",
        }))
      );
      setUnreadNotificationCount(unreadCount);
    } catch {
      if (showError) {
        toast.error("Failed to load notifications.");
      }
    }
  };

  useEffect(() => {
    if (activeTab !== "notifications" || unreadNotificationCount === 0) return;

    const markRead = async () => {
      try {
        await api.post("/notifications/read-all");
        setItemNotifications((previous) =>
          previous.map((notification) => ({
            ...notification,
            status: "read" as const,
          }))
        );
        setUnreadNotificationCount(0);
      } catch {
        toast.error("Failed to mark notifications as read.");
      }
    };

    void markRead();
  }, [activeTab, unreadNotificationCount]);

  useEffect(() => {
    void loadClaims();
  }, []);

  useEffect(() => {
    void loadLostFoundItems();
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    const pollTimer = setInterval(() => {
      void loadNotifications(false);
    }, 30000);

    return () => clearInterval(pollTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const pendingClaims = useMemo(
    () => claims.filter((claim) => claim.status === "pending_verification"),
    [claims]
  );

  const claimVerifiedClaims = useMemo(
    () => claims.filter((claim) => claim.status === "claim_verified"),
    [claims]
  );

  const multiClaimerClaims = useMemo(
    () => claims.filter((claim) => claim.claimerCount > 1),
    [claims]
  );

  const queuedPendingItems = useMemo(() => {
    const allItems = [...lostItems, ...foundItems];

    return allItems
      .filter(
        (item) =>
          item.claimStatus === "under_verification" && (item.claimableQueueEndsAt || item.claimableQueuePaused)
      )
      .map((item) => {
        const remainingMs = item.claimableQueuePaused
          ? Math.max(item.claimableQueueRemainingMs ?? 0, 0)
          : Math.max(
              (item.claimableQueueEndsAt ? new Date(item.claimableQueueEndsAt).getTime() : 0) - Date.now(),
              0
            );

        return {
          ...item,
          remainingMs,
        };
      })
      .sort((a, b) => a.remainingMs - b.remainingMs);
  }, [lostItems, foundItems]);

  const pendingVerificationCount = useMemo(() => {
    const queuedItemIds = new Set(queuedPendingItems.map((item) => item._id));
    let total = queuedPendingItems.length;

    for (const claim of pendingClaims) {
      const claimItemId = claim.itemId?._id;
      if (claimItemId && !queuedItemIds.has(claimItemId)) {
        total += 1;
      }
    }

    return total;
  }, [queuedPendingItems, pendingClaims]);

  const handleAddToPendingQueue = async (item: LostFoundItem) => {
    try {
      setQueueingItemId(item._id);
      await api.post(`/items/${item._id}/queue-claimable`);
      toast.success("Item added to 48-hour pending queue.");
      await loadLostFoundItems();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error ?? "Failed to add item to pending queue.");
    } finally {
      setQueueingItemId(null);
    }
  };

  const handleStopQueue = async (item: LostFoundItem) => {
    try {
      setStoppingQueueItemId(item._id);
      await api.post(`/items/${item._id}/stop-queue`);
      toast.success("Countdown stopped for this item.");
      await loadLostFoundItems();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error ?? "Failed to stop queue countdown.");
    } finally {
      setStoppingQueueItemId(null);
    }
  };

  const handlePauseQueue = async (item: LostFoundItem) => {
    try {
      setPausingQueueItemId(item._id);
      await api.post(`/items/${item._id}/pause-queue`);
      toast.success("Countdown paused for this item.");
      await loadLostFoundItems();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error ?? "Failed to pause queue countdown.");
    } finally {
      setPausingQueueItemId(null);
    }
  };

  const handleResumeQueue = async (item: LostFoundItem) => {
    try {
      setResumingQueueItemId(item._id);
      await api.post(`/items/${item._id}/resume-queue`);
      toast.success("Countdown resumed for this item.");
      await loadLostFoundItems();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error ?? "Failed to resume queue countdown.");
    } finally {
      setResumingQueueItemId(null);
    }
  };

  const handleSendToReclaim = async (item: LostFoundItem) => {
    try {
      setSendingReclaimItemId(item._id);
      await api.post(`/items/${item._id}/send-reclaim`);
      toast.success("Item moved to reclaim list.");
      await loadLostFoundItems();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error ?? "Failed to move item to reclaim list.");
    } finally {
      setSendingReclaimItemId(null);
    }
  };

  const filteredLostItems = useMemo(() => {
    const query = lostSearch.trim().toLowerCase();
    if (!query) return lostItems;

    return lostItems.filter((item) =>
      [
        item.itemTitle,
        item.itemCategory,
        item.location,
        item.description,
        item.contactNumber,
        item.claimStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [lostItems, lostSearch]);

  const filteredFoundItems = useMemo(() => {
    const query = foundSearch.trim().toLowerCase();
    if (!query) return foundItems;

    return foundItems.filter((item) =>
      [
        item.itemTitle,
        item.itemCategory,
        item.location,
        item.description,
        item.contactNumber,
        item.claimStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [foundItems, foundSearch]);

  const newNotifications = useMemo(
    () => itemNotifications.filter((notification) => notification.status === "new"),
    [itemNotifications]
  );

  const readNotifications = useMemo(
    () => itemNotifications.filter((notification) => notification.status === "read"),
    [itemNotifications]
  );

  const handleDeleteNotification = async (notificationId: string) => {
    const deleted = itemNotifications.find((notification) => notification.id === notificationId);
    if (!deleted) return;

    setItemNotifications((previous) =>
      previous.filter((notification) => notification.id !== notificationId)
    );

    if (deleted.status === "new") {
      setUnreadNotificationCount((count) => Math.max(count - 1, 0));
    }

    try {
      await api.delete(`/notifications/${notificationId}`);

      toast.success("Notification deleted.", {
        action: {
          label: "Undo",
          onClick: () => {
            void (async () => {
              try {
                await api.post(`/notifications/${notificationId}/restore`);
                await loadNotifications(false);
                toast.success("Notification restored.");
              } catch {
                toast.error("Failed to restore notification.");
              }
            })();
          },
        },
      });
    } catch {
      setItemNotifications((previous) => [deleted, ...previous]);
      if (deleted.status === "new") {
        setUnreadNotificationCount((count) => count + 1);
      }
      toast.error("Failed to delete notification.");
    }
  };

  const handleResolveClaim = async (
    claimId: string,
    decision: "approve" | "reject"
  ) => {
    try {
      setResolvingClaimId(claimId);
      const response = await api.patch(`/claims/${claimId}/resolve`, { decision });
      const rejectedOthersCount = Number(response.data?.rejectedOthersCount ?? 0);

      if (decision === "approve" && rejectedOthersCount > 0) {
        toast.success(
          `Claim approved. ${rejectedOthersCount} competing claimer(s) were auto-rejected and notified.`
        );
      } else {
        toast.success(decision === "approve" ? "Claim approved." : "Claim rejected.");
      }

      await loadClaims();
      await loadLostFoundItems();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error ?? "Failed to update claim decision.");
    } finally {
      setResolvingClaimId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="h-screen overflow-hidden bg-white py-6 pr-4 text-black sm:pr-6">
      <div className="flex h-full w-full gap-6">
        <aside className="sticky top-6 hidden h-fit w-72 shrink-0 rounded-r-3xl border border-gray-200 bg-gray-100 p-4 shadow-xl lg:block">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-5 text-left text-lg font-semibold transition ${
                activeTab === "overview"
                  ? "border-blue-100 bg-white text-[#0A66C2] shadow-xl"
                  : "border-transparent bg-white/40 text-gray-700 shadow-md hover:bg-white/80"
              }`}
            >
              <span className="grid h-12 w-12 place-content-center rounded-xl bg-blue-50 text-[#0A66C2] shadow-inner">
                <LayoutDashboard className="h-6 w-6" />
              </span>
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("verification")}
              className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-5 text-left text-lg font-semibold transition ${
                activeTab === "verification"
                  ? "border-emerald-100 bg-white text-[#0A66C2] shadow-xl"
                  : "border-transparent bg-white/40 text-gray-700 shadow-md hover:bg-white/80"
              }`}
            >
              <span className="grid h-12 w-12 place-content-center rounded-xl bg-emerald-50 text-emerald-600 shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <span>Verification</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-5 text-left text-lg font-semibold transition ${
                activeTab === "notifications"
                  ? "border-amber-100 bg-white text-[#0A66C2] shadow-xl"
                  : "border-transparent bg-white/40 text-gray-700 shadow-md hover:bg-white/80"
              }`}
            >
              <span className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-content-center rounded-xl bg-amber-50 text-amber-600 shadow-inner">
                  <Bell className="h-6 w-6" />
                </span>
                <span>Notifications</span>
              </span>
              {unreadNotificationCount > 0 ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadNotificationCount}
                </span>
              ) : null}
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Verification Dashboard</h1>
              <p className="text-sm text-gray-600">Manage claim verification with 48-hour countdowns.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void loadClaims();
                  void loadLostFoundItems();
                  void loadNotifications();
                }}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100"
              >
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
              >
                Log out
              </button>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-gray-100 p-2 lg:hidden">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === "overview" ? "bg-white text-[#0A66C2] shadow" : "text-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("verification")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === "verification" ? "bg-white text-[#0A66C2] shadow" : "text-gray-700"
              }`}
            >
              Verification
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === "notifications" ? "bg-white text-[#0A66C2] shadow" : "text-gray-700"
              }`}
            >
              Notifications {unreadNotificationCount > 0 ? `(${unreadNotificationCount})` : ""}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {activeTab === "overview" && (
              <section className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-600">Pending Verification</p>
                    <p className="mt-1 text-3xl font-bold">{pendingVerificationCount}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-600">Claim Verified</p>
                    <p className="mt-1 text-3xl font-bold">{claimVerifiedClaims.length}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-600">Multi-Claimer Cases</p>
                    <p className="mt-1 text-3xl font-bold">{multiClaimerClaims.length}</p>
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h2 className="text-lg font-semibold">Overview</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    Use the Verification tab to review pending claims, watch countdown timers, and send meeting details when claims are eligible.
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    Every found-item claim enters a mandatory 48-hour verification countdown before collection can be scheduled.
                  </p>
                </section>

                <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Lost and Found Items</h2>
                    <span className="text-xs text-gray-600">Latest from database</span>
                  </div>

                  {loadingItems ? (
                    <p className="text-sm text-gray-600">Loading lost and found items...</p>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Lost Items</h3>
                          <input
                            value={lostSearch}
                            onChange={(event) => setLostSearch(event.target.value)}
                            placeholder="Search lost items"
                            className="w-44 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-black outline-none focus:border-[#0A66C2]"
                          />
                        </div>
                        {lostItems.length === 0 ? (
                          <p className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-600">No lost items found.</p>
                        ) : (
                          <div className="h-[460px] space-y-2 overflow-y-auto pr-1">
                            {filteredLostItems.map((item) => (
                              <LostFoundItemCard
                                key={item._id}
                                item={item}
                                onQueue={handleAddToPendingQueue}
                                queueing={queueingItemId === item._id}
                              />
                            ))}
                            {filteredLostItems.length === 0 ? (
                              <p className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-600">No lost items match your search.</p>
                            ) : null}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Found Items</h3>
                          <input
                            value={foundSearch}
                            onChange={(event) => setFoundSearch(event.target.value)}
                            placeholder="Search found items"
                            className="w-44 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-black outline-none focus:border-[#0A66C2]"
                          />
                        </div>
                        {foundItems.length === 0 ? (
                          <p className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-600">No found items found.</p>
                        ) : (
                          <div className="h-[460px] space-y-2 overflow-y-auto pr-1">
                            {filteredFoundItems.map((item) => (
                              <LostFoundItemCard
                                key={item._id}
                                item={item}
                                onQueue={handleAddToPendingQueue}
                                queueing={queueingItemId === item._id}
                              />
                            ))}
                            {filteredFoundItems.length === 0 ? (
                              <p className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-600">No found items match your search.</p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              </section>
            )}

            {activeTab === "verification" && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Claims Under Verification</h2>
                </div>

                <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-base font-semibold">Items In Manual 48-Hour Pending Queue</h3>
                  {queuedPendingItems.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-600">No items in manual pending queue.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {queuedPendingItems.map((item) => (
                        <article key={item._id} className="rounded-md border border-gray-200 bg-white p-3">
                          <p className="text-sm font-semibold text-black">{item.itemTitle}</p>
                          <p className="text-xs text-gray-700">Item ID: {item._id}</p>
                          <p className="text-xs text-gray-700">Type: {item.itemType}</p>
                          <p className="text-xs text-gray-700">Countdown: {formatCountdown(item.remainingMs)}</p>
                          <p className="text-xs text-gray-700">
                            Status: {item.claimableQueuePaused ? "Paused" : "Running"}
                          </p>
                          <p className="text-xs text-gray-700">
                            Ends At: {item.claimableQueueEndsAt ? new Date(item.claimableQueueEndsAt).toLocaleString() : "-"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void handleStopQueue(item)}
                              disabled={stoppingQueueItemId === item._id}
                              className="rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {stoppingQueueItemId === item._id
                                ? "Stopping..."
                                : "Stop"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handlePauseQueue(item)}
                              disabled={pausingQueueItemId === item._id || Boolean(item.claimableQueuePaused)}
                              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {pausingQueueItemId === item._id ? "Pausing..." : "Pause"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleResumeQueue(item)}
                              disabled={resumingQueueItemId === item._id || !Boolean(item.claimableQueuePaused)}
                              className="rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {resumingQueueItemId === item._id ? "Resuming..." : "Resume"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSendToReclaim(item)}
                              disabled={sendingReclaimItemId === item._id}
                              className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {sendingReclaimItemId === item._id ? "Sending..." : "Send To Reclaim"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                {loadingClaims ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">Loading verification queue...</div>
                ) : pendingClaims.length === 0 ? null : (
                  <div className="space-y-4">
                    {pendingClaims.map((claim) => {
                      const remaining = Math.max(new Date(claim.verificationEndsAt).getTime() - Date.now(), 0);
                      const canSchedule = remaining === 0;
                      const needsExtraQuestions = claim.claimerCount > 1;
                      const uniqueQuestions = getUniqueVerificationQuestions(claim);

                      return (
                        <article key={claim._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <h3 className="text-lg font-semibold">{claim.itemId?.itemTitle ?? "Item"}</h3>
                              <p className="text-sm text-gray-700">Verification ID: {claim.verificationId}</p>
                              <p className="text-sm text-gray-700">Claimers Count: {claim.claimerCount}</p>
                              <p className="text-sm text-gray-700">
                                Claimer: {claim.claimantName} ({claim.claimantEmail})
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-700">Serial Number: {claim.serialNumber}</p>
                              <p className="text-sm text-gray-700">Lost Place: {claim.lostPlace}</p>
                              <p className="text-sm text-gray-700">Countdown: {formatCountdown(remaining)}</p>
                              <p className="text-sm text-gray-700">Ends At: {new Date(claim.verificationEndsAt).toLocaleString()}</p>
                            </div>
                          </div>

                          {needsExtraQuestions ? (
                            <div className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                                Multiple users claimed this item. Ask unique verification questions before approval.
                              </p>
                              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-indigo-900">
                                {uniqueQuestions.map((question) => (
                                  <li key={question}>{question}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {canSchedule ? (
                            <MeetingForm claim={claim} onScheduled={loadClaims} />
                          ) : (
                            <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                              Meeting details can be sent only after the 48-hour countdown ends.
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}

                <div>
                  <h2 className="mb-3 text-xl font-semibold">Claim Verified Category</h2>
                  {claimVerifiedClaims.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No claim verified entries yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {claimVerifiedClaims.map((claim) => (
                        <article key={claim._id} className="rounded-xl border border-green-200 bg-green-50 p-4">
                          <h3 className="text-lg font-semibold text-black">{claim.itemId?.itemTitle ?? "Item"}</h3>
                          <p className="text-sm text-gray-800">Verification ID: {claim.verificationId}</p>
                          <p className="text-sm text-gray-800">
                            Meeting: {claim.meetingLocation ?? "-"} at {claim.meetingDateTime ? new Date(claim.meetingDateTime).toLocaleString() : "-"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={resolvingClaimId === claim._id}
                              onClick={() => void handleResolveClaim(claim._id, "approve")}
                              className="rounded-md border border-green-300 bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800 transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {resolvingClaimId === claim._id ? "Saving..." : "Approve Owner"}
                            </button>
                            <button
                              type="button"
                              disabled={resolvingClaimId === claim._id}
                              onClick={() => void handleResolveClaim(claim._id, "reject")}
                              className="rounded-md border border-red-300 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {resolvingClaimId === claim._id ? "Saving..." : "Reject Claim"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "notifications" && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">New Item Notifications</h2>
                  <span className="text-sm text-gray-600">{itemNotifications.length} total</span>
                </div>

                {itemNotifications.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    No notifications yet. New lost/found items will appear here automatically.
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">New</h3>
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                          {newNotifications.length}
                        </span>
                      </div>

                      {newNotifications.length === 0 ? (
                        <p className="rounded-lg border border-emerald-200 bg-white p-3 text-sm text-emerald-800">
                          No new notifications.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {newNotifications.map((notification) => (
                            <article key={notification.id} className="rounded-lg border border-emerald-300 bg-white p-4 shadow-sm">
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-black">
                                  New {notification.itemType} item added: {notification.itemTitle}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteNotification(notification.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                              <p className="text-xs text-gray-700">Item ID: {notification.itemId ?? "-"}</p>
                              <p className="text-xs text-gray-700">Location: {notification.location}</p>
                              <p className="text-xs text-gray-700">
                                Item Created At: {notification.createdAt ? formatItemDateTime(notification.createdAt) : "-"}
                              </p>
                              <p className="text-xs text-gray-700">Detected At: {formatItemDateTime(notification.detectedAt)}</p>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Already Read</h3>
                        <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs font-semibold text-white">
                          {readNotifications.length}
                        </span>
                      </div>

                      {readNotifications.length === 0 ? (
                        <p className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">
                          No read notifications.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {readNotifications.map((notification) => (
                            <article key={notification.id} className="rounded-lg border border-gray-200 bg-white p-4 opacity-90">
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-gray-800">
                                  {notification.itemType.toUpperCase()} item: {notification.itemTitle}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteNotification(notification.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                              <p className="text-xs text-gray-600">Item ID: {notification.itemId ?? "-"}</p>
                              <p className="text-xs text-gray-600">Location: {notification.location}</p>
                              <p className="text-xs text-gray-600">
                                Item Created At: {notification.createdAt ? formatItemDateTime(notification.createdAt) : "-"}
                              </p>
                              <p className="text-xs text-gray-600">Detected At: {formatItemDateTime(notification.detectedAt)}</p>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
