'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

export default function CallToAction() {
  return (
    <section className="px-6 py-20">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#0A66C2]/30 p-12 text-center md:p-16"
        style={{
          background: 'linear-gradient(135deg, rgba(10,102,194,0.25) 0%, rgba(10,102,194,0.08) 100%)',
        }}
      >
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'rgba(10,102,194,0.3)', filter: 'blur(80px)' }}
        />

        <div className="relative">
          <h2 className="mx-auto max-w-lg text-3xl font-bold leading-tight text-white md:text-4xl">
            Start now and help reunite lost items with their owners
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50">
            Every report counts. Whether you lost something or found it, your action helps keep the campus community connected.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/lostandfound?tab=lost"
              className="rounded-xl bg-white px-7 py-3 text-sm font-semibold text-black shadow-lg shadow-black/20 transition hover:shadow-[#0A66C2]/30"
            >
              Report Lost Item
            </Link>
            <Link
              href="/lostandfound?tab=found"
              className="rounded-xl border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
            >
              Report Found Item
            </Link>
            <Link
              href="/matching"
              className="flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-500/10 px-7 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
            >
              <Search className="size-4" />
              Search Items
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
