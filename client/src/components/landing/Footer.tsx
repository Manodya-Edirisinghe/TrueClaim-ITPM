'use client';

import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#0A66C2]">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">TrueClaim</span>
        </div>
        <p className="text-xs text-white/25">
          &copy; 2026 TrueClaim &mdash; University Lost &amp; Found Platform
        </p>
        <div className="flex gap-5">
          {['Privacy', 'Terms', 'Contact'].map((item) => (
            <a
              key={item}
              href={item === 'Contact' ? '#contact' : '#'}
              className="text-xs text-white/25 transition hover:text-white/60"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
