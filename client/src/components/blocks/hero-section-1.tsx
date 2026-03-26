'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles, FileText, Cpu, CheckCircle2, Search, Bell, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { cn } from '@/lib/utils';

// ── Brand palette ────────────────────────────────────────────────────────────
const blue       = '#0A66C2';   // primary
const blueSoft   = '#1d80e0';   // lighter blue hover
const blueGlow   = 'rgba(10,102,194,0.45)';
const blueDim    = 'rgba(10,102,194,0.15)';
const blueBorder = 'rgba(10,102,194,0.35)';
const bg         = '#000000';
const surface    = '#0d0d0d';
const muted      = 'rgba(255,255,255,0.50)';
const subtle     = 'rgba(255,255,255,0.07)';

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
    visible: {
      opacity: 1, filter: 'blur(0px)', y: 0,
      transition: { type: 'spring' as const, bounce: 0.3, duration: 1.5 },
    },
  },
};

// ── Nav ──────────────────────────────────────────────────────────────────────

const menuItems = [
  { name: 'Features',     href: '#features' },
  { name: 'Match Items',  href: '/matching' },
  { name: 'Feedback',     href: '/feedback' },
  { name: 'Universities', href: '#universities' },
  { name: 'Contact',      href: '#contact' },
  
];

const TrueClaimLogo = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center gap-2', className)}>
    <div
      className="size-8 rounded-lg flex items-center justify-center"
      style={{ background: blue }}>
      <Sparkles className="size-4 text-white" />
    </div>
    <span className="font-bold text-lg tracking-tight text-white">TrueClaim</span>
  </div>
);

const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState ? 'active' : undefined}
        className="fixed z-20 w-full px-2 group">
        <div
          className={cn(
            'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
            isScrolled && 'max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5',
          )}
          style={isScrolled ? { backgroundColor: 'rgba(0,0,0,0.75)', borderColor: 'rgba(255,255,255,0.08)' } : {}}>
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">

            {/* Logo */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/landing" aria-label="home">
                <TrueClaimLogo />
              </Link>
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden text-white">
                <Menu className="group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X    className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            {/* Desktop links */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, i) => (
                  <li key={i}>
                    <Link href={item.href} className="text-white/60 hover:text-white block duration-150 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div
              className={cn(
                'group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-4 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none',
              )}
              style={{ backgroundColor: bg, borderColor: subtle }}>
              {/* Mobile links */}
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, i) => (
                    <li key={i}>
                      <a href={item.href} className="text-white/60 hover:text-white block duration-150">{item.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button asChild variant="outline" size="sm"
                  className={cn('border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white', isScrolled && 'lg:hidden')}>
                  <Link href="/login"><span>Sign In</span></Link>
                </Button>
                <Button asChild size="sm"
                  className={cn('text-white font-semibold', isScrolled && 'lg:hidden')}
                  style={{ background: blue }}>
                  <Link href="/register"><span>Get Started</span></Link>
                </Button>
                <Button asChild size="sm"
                  className={cn('text-white font-semibold', isScrolled ? 'lg:inline-flex' : 'hidden')}
                  style={{ background: blue }}>
                  <Link href="/register"><span>Get Started →</span></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────

export function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="relative overflow-hidden w-full" style={{ backgroundColor: bg, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>

        {/* Subtle blue side glows */}
        <div aria-hidden className="z-[2] absolute inset-0 pointer-events-none isolate opacity-60 hidden lg:block overflow-hidden">
          <div className="absolute left-0 top-0 w-[28rem] h-[60rem] -rotate-45 rounded-full"
            style={{ background: `radial-gradient(ellipse, ${blueDim} 0%, transparent 70%)`, transform: 'rotate(-45deg) translateY(-280px)' }} />
          <div className="absolute right-0 top-0 w-64 h-[50rem] rounded-full"
            style={{ background: `radial-gradient(ellipse, rgba(10,102,194,0.08) 0%, transparent 70%)`, transform: 'rotate(45deg) translateY(-40%)' }} />
        </div>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section>
          <div className="relative pt-24 md:pt-36">
            <div aria-hidden className="absolute inset-0 -z-10 size-full"
              style={{ background: `radial-gradient(125% 125% at 50% 100%, transparent 0%, ${bg} 75%)` }} />

            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>

                  {/* Headline */}
                  <h1 className="mt-8 max-w-4xl mx-auto text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem] font-extrabold leading-tight tracking-tight">
                    <span className="block text-white">Lost Something?</span>
                    <span className="block" style={{
                      background: `linear-gradient(135deg, ${blue} 0%, #60a5fa 60%, #ffffff 100%)`,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                      We&apos;ll Find It.
                    </span>
                  </h1>

                  {/* Sub-headline */}
                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-relaxed" style={{ color: muted }}>
                    TrueClaim connects university students, staff and security —
                    so that every lost item finds its way home. Simple, fast and 100% verified.
                  </p>
                </AnimatedGroup>

                {/* CTAs */}
                <AnimatedGroup
                  variants={{
                    container: { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.75 } } },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-3 md:flex-row">
                  <div className="rounded-[14px] border p-0.5" style={{ borderColor: blueBorder, background: blueDim }}>
                    <Button asChild size="lg" className="rounded-xl px-6 text-base text-white font-semibold"
                      style={{ background: blue, boxShadow: `0 0 24px ${blueGlow}` }}>
                      <Link href="/lostandfound?tab=lost">
                        <span className="text-nowrap">Report a Lost Item</span>
                      </Link>
                    </Button>
                  </div>

                  <div className="rounded-[14px] border p-0.5" style={{ borderColor: blueBorder, background: blueDim }}>
                    <Button asChild size="lg" className="rounded-xl px-6 text-base text-white font-semibold"
                      style={{ background: blue, boxShadow: `0 0 24px ${blueGlow}` }}>
                      <Link href="/lostandfound?tab=found">
                        <span className="text-nowrap">Report a Found Item</span>
                      </Link>
                    </Button>
                  </div>
                </AnimatedGroup>
              </div>
            </div>

            {/* Dashboard preview */}
            <AnimatedGroup
              variants={{
                container: { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.75 } } },
                ...transitionVariants,
              }}>
              <div className="relative mt-16 overflow-hidden px-4 sm:mt-20 md:mt-24">
                <div aria-hidden className="absolute inset-0 z-10"
                  style={{ background: `linear-gradient(to bottom, transparent 35%, ${bg})` }} />
                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border p-3 shadow-2xl"
                  style={{ background: surface, borderColor: 'rgba(255,255,255,0.08)', boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)` }}>
                  <div className="aspect-[15/8] rounded-xl overflow-hidden relative" style={{ background: '#050508' }}>
                    <div className="p-5 h-full flex flex-col gap-3">

                      {/* ── Top bar ── */}
                      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        {/* Logo */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="size-5 rounded" style={{ background: blue }} />
                          <span className="text-xs font-bold tracking-tight" style={{ color: '#fff' }}>TrueClaim</span>
                        </div>
                        {/* Nav tabs */}
                        <div className="flex items-center gap-1">
                          {['Dashboard', 'Lost Items', 'Found Items', 'Claims'].map((tab, i) => (
                            <div key={tab} className="px-2.5 py-1 rounded-md text-[10px] font-medium"
                              style={{ background: i === 0 ? blue : 'transparent', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                              {tab}
                            </div>
                          ))}
                        </div>
                        {/* Right side */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Search box */}
                          <div className="flex items-center gap-1.5 rounded-md px-2 py-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="size-2.5 rounded-full" style={{ border: '1.5px solid rgba(255,255,255,0.25)' }} />
                            <div className="h-1.5 w-14 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                          </div>
                          {/* Notification bell */}
                          <div className="relative size-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="size-3" style={{ borderRadius: '3px 3px 1px 1px', border: '1.5px solid rgba(255,255,255,0.3)', borderBottom: 'none' }} />
                            <div className="absolute top-0.5 right-0.5 size-1.5 rounded-full" style={{ background: blue }} />
                          </div>
                          {/* Avatar */}
                          <div className="size-6 rounded-full" style={{ background: `linear-gradient(135deg, ${blue}, #60a5fa)` }} />
                        </div>
                      </div>

                      {/* ── Stat cards ── */}
                      <div className="grid grid-cols-4 gap-2.5">
                        {[
                          { label: 'Items Reported', val: '248', color: blue,      bars: [3,5,4,6,5,7,6,8,7,9] },
                          { label: 'Matches Found',  val: '189', color: '#60a5fa', bars: [2,4,3,5,4,6,5,7,6,8] },
                          { label: 'Claimed',        val: '156', color: '#93c5fd', bars: [4,3,5,4,6,5,7,6,8,7] },
                          { label: 'Avg. Time',      val: '< 6h',color: '#e2e8f0', bars: [6,5,7,6,5,4,5,4,3,4] },
                        ].map((card) => (
                          <div key={card.label}
                            className="rounded-lg border p-3 flex flex-col gap-1.5"
                            style={{ background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.07)' }}>
                            <div className="text-[10px] leading-none" style={{ color: 'rgba(255,255,255,0.4)' }}>{card.label}</div>
                            <div className="text-xl font-bold leading-none" style={{ color: card.color }}>{card.val}</div>
                            {/* Mini sparkline bars */}
                            <div className="flex items-end gap-px h-5 mt-1">
                              {card.bars.map((h, i) => (
                                <div key={i} style={{ flex: 1, borderRadius: '2px', height: `${h * 10}%`, background: card.color, opacity: 0.35 + (i / card.bars.length) * 0.5 }} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* ── Table header ── */}
                      <div className="flex items-center justify-between px-3 mt-1">
                        <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Item</div>
                        <div className="flex gap-8">
                          <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Category</div>
                          <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Status</div>
                        </div>
                      </div>

                      {/* ── Item rows ── */}
                      <div className="flex flex-col gap-1.5">
                        {[
                          { item: 'Blue Backpack',    cat: 'Bag',         status: 'Matched', color: blue },
                          { item: 'Student ID Card',  cat: 'Document',    status: 'Claimed', color: '#60a5fa' },
                          { item: 'AirPods Pro',      cat: 'Electronics', status: 'Pending', color: 'rgba(255,255,255,0.35)' },
                          { item: 'Water Bottle',     cat: 'Accessory',   status: 'Matched', color: blue },
                        ].map((row) => (
                          <div key={row.item}
                            className="flex items-center justify-between rounded-lg px-3 py-2"
                            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div className="flex items-center gap-2.5">
                              <div className="size-5 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{row.item}</span>
                            </div>
                            <div className="flex items-center gap-6">
                              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{row.cat}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ color: row.color, background: `${row.color === blue ? 'rgba(10,102,194,0.15)' : 'rgba(255,255,255,0.06)'}`, border: `1px solid ${row.color}33` }}>
                                {row.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────────────────── */}
        <section style={{ padding: '80px 2rem', borderTop: `1px solid ${subtle}`, borderBottom: `1px solid ${subtle}` }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3rem', textAlign: 'center' }}>
            {[
              { value: '12,000+', label: 'Items Recovered' },
              { value: '98%',     label: 'Match Accuracy' },
              { value: '50+',     label: 'Universities' },
              { value: '< 24h',   label: 'Avg. Response Time' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800,
                  background: `linear-gradient(135deg, ${blue}, #60a5fa)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  letterSpacing: '-0.03em' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.875rem', color: muted, marginTop: '6px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section id="how-it-works" style={{ padding: '100px 2rem', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ fontSize: '0.8rem', letterSpacing: '0.15em', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '12px' }}>
              Process
            </p>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
              Three steps to{' '}
              <span style={{ background: `linear-gradient(135deg, ${blue}, #60a5fa)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                get it back
              </span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { step: '01', title: 'Report It',      description: 'Submit a quick report with a photo, description, and last known location of your item.', Icon: FileText },
              { step: '02', title: 'Smart Matching',  description: "Our system scans all found-item reports and alerts you when there's a match.",           Icon: Cpu },
              { step: '03', title: 'Claim & Collect', description: 'Verify ownership through our secure flow and pick up your item from the designated point.', Icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.step}
                style={{ padding: '32px', borderRadius: '20px', border: `1px solid ${subtle}`,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s, transform 0.3s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = blueBorder; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = subtle;     (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: '4rem', fontWeight: 900, color: 'rgba(10,102,194,0.12)', position: 'absolute', top: '16px', right: '24px', lineHeight: 1, userSelect: 'none' }}>
                  {item.step}
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,102,194,0.15)', border: `1px solid ${blueBorder}` }}>
                  <item.Icon size={22} color={blue} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>{item.title}</h3>
                <p  style={{ fontSize: '0.9rem', color: muted, lineHeight: 1.7 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section id="features" style={{ padding: '100px 2rem', background: `linear-gradient(180deg, transparent 0%, rgba(10,102,194,0.06) 50%, transparent 100%)` }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <p style={{ fontSize: '0.8rem', letterSpacing: '0.15em', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '12px' }}>Features</p>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>Built for campus life</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {[
                { Icon: Search,      title: 'Smart Search',      description: 'AI-powered matching finds your item across thousands of listings instantly.' },
                { Icon: Bell,        title: 'Instant Alerts',    description: 'Real-time notifications the moment your lost item is reported found.' },
                { Icon: ShieldCheck, title: 'Verified Claims',   description: 'Secure identity verification ensures items only reach their rightful owners.' },
                { Icon: MapPin,      title: 'Location Tracking', description: 'Pinpoint exactly where your item was found on an interactive campus map.' },
              ].map((f) => (
                <div key={f.title}
                  style={{ padding: '28px', borderRadius: '16px', border: `1px solid ${subtle}`, background: 'rgba(255,255,255,0.03)', transition: 'all 0.3s', cursor: 'default' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background    = 'rgba(10,102,194,0.1)'; (e.currentTarget as HTMLDivElement).style.borderColor = blueBorder; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background    = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = subtle; }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,102,194,0.12)', border: `1px solid ${blueBorder}` }}>
                    <f.Icon size={20} color={blue} strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff',   marginBottom: '8px' }}>{f.title}</h3>
                  <p  style={{ fontSize: '0.875rem', color: muted, lineHeight: 1.65 }}>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ───────────────────────────────────────── */}
        <section style={{ padding: '80px 2rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 48px', borderRadius: '28px',
            background: `linear-gradient(135deg, rgba(10,102,194,0.30) 0%, rgba(10,102,194,0.10) 100%)`,
            border: `1px solid ${blueBorder}`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: '400px', height: '200px', borderRadius: '50%',
              background: `rgba(10,102,194,0.3)`, filter: 'blur(80px)', pointerEvents: 'none' }} />
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff',
              letterSpacing: '-0.03em', marginBottom: '16px', position: 'relative' }}>
              Ready to find what&apos;s yours?
            </h2>
            <p style={{ fontSize: '1rem', color: muted, maxWidth: '500px', margin: '0 auto 36px', lineHeight: 1.7, position: 'relative' }}>
              Join thousands of students who&apos;ve already recovered their items through TrueClaim.
            </p>
            <Link href="/login"
              style={{ display: 'inline-block', padding: '14px 40px', borderRadius: '12px',
                background: '#ffffff', color: '#000000', fontWeight: 700, fontSize: '1rem',
                textDecoration: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', transition: 'all 0.25s', position: 'relative' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 40px ${blueGlow}`)}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)')}>
              Get Started — it&apos;s free
            </Link>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer style={{ borderTop: `1px solid ${subtle}`, padding: '40px 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>
          <TrueClaimLogo />
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            © 2026 TrueClaim — University Lost &amp; Found Platform
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy', 'Terms', 'Contact'].map((item) => (
              <a key={item} href="#"
                style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => ((e.target as HTMLAnchorElement).style.color = '#fff')}
                onMouseLeave={e => ((e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.3)')}>
                {item}
              </a>
            ))}
          </div>
        </footer>
      </main>
    </>
  );
}
