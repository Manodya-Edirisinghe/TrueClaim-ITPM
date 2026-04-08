'use client';

import { ShieldCheck, Fingerprint, ClipboardCheck, Lock } from 'lucide-react';

const features = [
  {
    Icon: Fingerprint,
    title: 'Identity Verification',
    description: 'Claimants must verify their identity before collecting items.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Proof of Ownership',
    description: 'Users provide specific details only the real owner would know.',
  },
  {
    Icon: Lock,
    title: 'Admin Approval',
    description: 'Claims go through admin review before items are released.',
  },
];

export default function FeatureHighlight() {
  return (
    <section
      id="features"
      className="relative overflow-hidden border-y border-white/[0.06] py-20"
      style={{
        background:
          'linear-gradient(180deg, transparent 0%, rgba(10,102,194,0.06) 50%, transparent 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300">
            Coming Soon
          </div>
          <h2 className="text-3xl font-bold text-white">
            Secure Claim &amp; Verification System
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/45">
            A dedicated verification flow to prevent false claims and ensure items are returned to their rightful owners. This feature is currently under development.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/25 hover:bg-white/[0.05]"
            >
              {/* Coming soon overlay shimmer */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 hover:opacity-100"
                style={{
                  background: 'linear-gradient(135deg, transparent, rgba(245,158,11,0.05), transparent)',
                }}
              />

              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <f.Icon className="size-5 text-amber-400" strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-white/40">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Central shield icon */}
        <div className="mt-10 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-white/[0.06] bg-white/[0.03] px-5 py-2.5">
            <ShieldCheck className="size-5 text-amber-400" />
            <span className="text-xs text-white/35">
              Claim verification ensures rightful ownership before item release
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
