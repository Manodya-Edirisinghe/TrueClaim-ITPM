'use client';

import { FileText, Database, Cpu, MessageCircle } from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Submit a Report',
    description: 'Fill out a quick form with item details, location, and an optional photo.',
    Icon: FileText,
  },
  {
    num: '02',
    title: 'Stored Securely',
    description: 'Your report is saved in our database and immediately available for matching.',
    Icon: Database,
  },
  {
    num: '03',
    title: 'Smart Matching',
    description: 'Our system scores and ranks similar items based on title, category, and location.',
    Icon: Cpu,
  },
  {
    num: '04',
    title: 'Connect & Recover',
    description: 'Message the finder or reporter directly through the built-in chat to arrange pickup.',
    Icon: MessageCircle,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
          Process
        </p>
        <h2 className="text-3xl font-bold text-white">
          How it{' '}
          <span className="bg-gradient-to-r from-[#0A66C2] to-blue-400 bg-clip-text text-transparent">
            works
          </span>
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#0A66C2]/35"
          >
            {/* Step number watermark */}
            <span className="pointer-events-none absolute right-4 top-3 text-5xl font-black text-[#0A66C2]/10 select-none">
              {step.num}
            </span>

            {/* Connector line (hidden on last) */}
            {i < steps.length - 1 && (
              <div className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 bg-gradient-to-r from-white/10 to-transparent lg:block" />
            )}

            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-[#0A66C2]/15 ring-1 ring-[#0A66C2]/25">
              <step.Icon className="size-5 text-[#0A66C2]" strokeWidth={1.75} />
            </div>
            <h3 className="mb-2 text-base font-semibold text-white">{step.title}</h3>
            <p className="text-sm leading-relaxed text-white/45">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
