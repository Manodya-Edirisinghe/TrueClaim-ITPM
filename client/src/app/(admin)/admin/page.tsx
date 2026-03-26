"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";

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

export default function AdminPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<VerificationClaim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
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

  useEffect(() => {
    void loadClaims();
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6 text-black">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Manage claim verification with 48-hour countdowns.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadClaims()}
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

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
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

        <section className="space-y-6">
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
        </section>
      </div>
    </div>
  );
}
