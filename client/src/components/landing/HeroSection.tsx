'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { AnimatedGroup } from '@/components/ui/animated-group';

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: { type: 'spring' as const, bounce: 0.3, duration: 1.5 },
    },
  },
};

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-40 md:pb-28">
      {/* Background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(10,102,194,0.4) 0%, transparent 70%)' }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 text-center">
        <AnimatedGroup variants={transitionVariants}>
          {/* Badge */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-300">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-blue-400" />
            </span>
            University Lost &amp; Found Platform
          </div>

          {/* Heading */}
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            <span className="text-white">Lost Something?</span>
            <br />
            <span className="bg-gradient-to-r from-[#0A66C2] via-blue-400 to-white bg-clip-text text-transparent">
              Found Something?
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50">
            Report, search, and recover items easily within your university.
            Connect with finders through our smart matching and messaging system.
          </p>
        </AnimatedGroup>

        {/* CTA Buttons */}
        <AnimatedGroup
          variants={{
            container: { visible: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } } },
            ...transitionVariants,
          }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/lostandfound?tab=lost"
            className="rounded-xl bg-[#0A66C2] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#0958a8] hover:shadow-blue-500/40"
          >
            Report Lost Item
          </Link>
          <Link
            href="/lostandfound?tab=found"
            className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Report Found Item
          </Link>
          <Link
            href="/matching"
            className="flex items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-7 py-3.5 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
          >
            <Search className="size-4" />
            Search Items
          </Link>
        </AnimatedGroup>
      </div>
    </section>
  );
}
