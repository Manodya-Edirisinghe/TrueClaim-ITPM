'use client';

import Link from 'next/link';
import { ArrowUp, ArrowUpRight, Sparkles } from 'lucide-react';

export default function Footer() {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.1] bg-[radial-gradient(circle_at_12%_0%,rgba(10,102,194,0.3),transparent_45%),radial-gradient(circle_at_92%_95%,rgba(56,189,248,0.18),transparent_40%),#04070f]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      <div className="tc-footer-glow tc-footer-glow-left" />
      <div className="tc-footer-glow tc-footer-glow-right" />

      <div className="mx-auto max-w-6xl px-6 py-12 md:py-14">
        <div className="grid gap-10 border-b border-white/[0.08] pb-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0A66C2] via-[#1789FF] to-[#53A2FF] shadow-lg shadow-blue-900/35">
                <Sparkles className="size-4 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight text-white">TrueClaim</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/65">
              A safer, faster way for students to recover lost belongings with smart matching and guided verification.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Navigate</p>
            <div className="mt-4 grid gap-2 text-sm">
              <Link href="/landing" className="text-white/65 transition hover:text-white">Home</Link>
              <Link href="/matching" className="text-white/65 transition hover:text-white">Match Items</Link>
              <Link href="/feedback" className="text-white/65 transition hover:text-white">Feedback</Link>
              <Link href="/landing#contact" className="text-white/65 transition hover:text-white">Contact</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Quick Actions</p>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/lostandfound?tab=lost"
                className="inline-flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:border-cyan-300/60 hover:bg-white/[0.08]"
              >
                Report Lost Item
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/lostandfound?tab=found"
                className="inline-flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:border-cyan-300/60 hover:bg-white/[0.08]"
              >
                Report Found Item
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-white/45">
            &copy; 2026 TrueClaim. University Lost and Found platform.
          </p>
          <div className="flex items-center gap-5 text-xs">
            <button
              type="button"
              onClick={handleBackToTop}
              className="inline-flex items-center gap-1 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 transition hover:border-cyan-200/60 hover:bg-cyan-300/20 hover:text-white"
            >
              Back to Top
              <ArrowUp className="size-3.5" />
            </button>
            <Link href="#" className="text-white/45 transition hover:text-white/80">Privacy</Link>
            <Link href="#" className="text-white/45 transition hover:text-white/80">Terms</Link>
            <Link href="/landing#contact" className="text-white/45 transition hover:text-white/80">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
