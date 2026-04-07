'use client';

import Link from 'next/link';
import { FileSearch, FileUp, Search } from 'lucide-react';

const actions = [
  {
    title: 'Report Lost Item',
    description: 'Quickly submit a report for your lost belongings with details and a photo.',
    Icon: FileUp,
    href: '/lostandfound?tab=lost',
    color: 'from-red-500/20 to-orange-500/20',
    border: 'hover:border-red-500/40',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
  },
  {
    title: 'Report Found Item',
    description: 'Help someone by reporting an item you found on campus.',
    Icon: FileSearch,
    href: '/lostandfound?tab=found',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
  },
  {
    title: 'Find Matching Items',
    description: 'Search through reported items and find yours using smart filters.',
    Icon: Search,
    href: '/matching',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'hover:border-blue-500/40',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
  },
];

export default function QuickActions() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
          Quick Actions
        </p>
        <h2 className="text-3xl font-bold text-white">What would you like to do?</h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06] ${action.border}`}
          >
            {/* Gradient background on hover */}
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity group-hover:opacity-100`} />

            <div className="relative">
              <div className={`mb-4 inline-flex size-12 items-center justify-center rounded-xl ${action.iconBg}`}>
                <action.Icon className={`size-5 ${action.iconColor}`} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{action.title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{action.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-blue-400 transition group-hover:translate-x-1">
                Get started &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
