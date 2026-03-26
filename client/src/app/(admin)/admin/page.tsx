"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { LayoutDashboard, ShieldCheck } from "lucide-react";

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
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Countdown ended";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
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
      await api.post(`/claims/${claim._id}/verify`, {
        meetingLocation,
        meetingDateTime,
      });
      toast.success("Claim moved to claim verified category.");
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
        {saving ? "Saving..." : "Move to Claim Verified + Send Meeting Details"}
      </button>
    </form>
  );
}

type DashboardPageProps = {
  title?: string;
  showLostFoundOverview?: boolean;
};

function formatItemDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function LostFoundItemCard({ item }: { item: LostFoundItem }) {
  return (
    <article className="rounded-md border border-gray-200 bg-white p-3">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.itemTitle}
          className="mb-3 h-36 w-full rounded-md object-cover"
        />
      ) : null}

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
        <p>Owner Claim ID: {item.ownerClaimId ?? "-"}</p>
        <p>Item Date: {formatItemDateTime(item.time)}</p>
        <p>Created At: {item.createdAt ? formatItemDateTime(item.createdAt) : "-"}</p>
        <p>Updated At: {item.updatedAt ? formatItemDateTime(item.updatedAt) : "-"}</p>
      </div>
    </article>
  );
}

export function AdminPage({
  title = "Admin Dashboard",
  showLostFoundOverview = false,
}: DashboardPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "verification">("overview");
  const [claims, setClaims] = useState<VerificationClaim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [lostItems, setLostItems] = useState<LostFoundItem[]>([]);
  const [foundItems, setFoundItems] = useState<LostFoundItem[]>([]);
  const [lostSearch, setLostSearch] = useState("");
  const [foundSearch, setFoundSearch] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
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
    if (!showLostFoundOverview) return;

    try {
      setLoadingItems(true);
      const [lostResponse, foundResponse] = await Promise.all([
        api.get("/items", {
          params: {
            itemType: "lost",
            page: 1,
            limit: 6,
          },
        }),
        api.get("/items", {
          params: {
            itemType: "found",
            page: 1,
            limit: 6,
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

  useEffect(() => {
    void loadClaims();
  }, []);

  useEffect(() => {
    if (!showLostFoundOverview) return;
    void loadLostFoundItems();
  }, [showLostFoundOverview]);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className={`${showLostFoundOverview ? "h-screen overflow-hidden" : "min-h-screen"} bg-white py-6 pr-4 text-black sm:pr-6`}>
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
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-gray-600">Manage claim verification with 48-hour countdowns.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void loadClaims();
                if (showLostFoundOverview) {
                  void loadLostFoundItems();
                }
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

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-100 p-2 lg:hidden">
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
        </div>

        <div className={showLostFoundOverview ? "flex-1 overflow-y-auto pr-1" : ""}>
        {activeTab === "overview" && (
          <section className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-600">Pending Verification</p>
            <p className="mt-1 text-3xl font-bold">{pendingClaims.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-600">Claim Verified</p>
            <p className="mt-1 text-3xl font-bold">{claimVerifiedClaims.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-600">Total Verification Queue</p>
            <p className="mt-1 text-3xl font-bold">{claims.length}</p>
          </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h2 className="text-lg font-semibold">Overview</h2>
              <p className="mt-2 text-sm text-gray-700">
                Use the Verification tab to review pending claims, watch countdown timers, and send meeting details when claims are eligible.
              </p>
            </section>

            {showLostFoundOverview && (
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
                            <LostFoundItemCard key={item._id} item={item} />
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
                            <LostFoundItemCard key={item._id} item={item} />
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
            )}
          </section>
        )}

        {activeTab === "verification" && <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Claims Under Verification</h2>
          </div>

          {loadingClaims ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">Loading verification queue...</div>
          ) : pendingClaims.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No active verification claims.</div>
          ) : (
            <div className="space-y-4">
              {pendingClaims.map((claim) => {
                const remaining = Math.max(new Date(claim.verificationEndsAt).getTime() - Date.now(), 0);
                const canSchedule = remaining === 0;

                return (
                  <article key={claim._id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <h3 className="text-lg font-semibold">{claim.itemId?.itemTitle ?? "Item"}</h3>
                        <p className="text-sm text-gray-700">Verification ID: {claim.verificationId}</p>
                        <p className="text-sm text-gray-700">Claimers Count: {claim.claimerCount}</p>
                        <p className="text-sm text-gray-700">Claimer: {claim.claimantName} ({claim.claimantEmail})</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">Serial Number: {claim.serialNumber}</p>
                        <p className="text-sm text-gray-700">Lost Place: {claim.lostPlace}</p>
                        <p className="text-sm text-gray-700">Countdown: {formatCountdown(remaining)}</p>
                        <p className="text-sm text-gray-700">Ends At: {new Date(claim.verificationEndsAt).toLocaleString()}</p>
                      </div>
                    </div>

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
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>}
        </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminRoute() {
  return <AdminPage />;
}
