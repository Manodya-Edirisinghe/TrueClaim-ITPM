'use client';

import Link from 'next/link';

export default function CallToAction() {
  return (
    <section className="px-6 py-20">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#0A66C2]/35 p-12 text-center md:p-16"
        style={{
          background: 'linear-gradient(135deg, rgba(10,102,194,0.35) 0%, rgba(10,102,194,0.12) 100%)',
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
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/55">
            Every report counts. Join the platform that keeps your campus community connected.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/register"
              className="rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-lg shadow-black/20 transition duration-200 hover:scale-105 hover:shadow-[#0A66C2]/35"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
