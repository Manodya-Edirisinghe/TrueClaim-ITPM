'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const blue = '#0A66C2';
const bg = '#000000';
const subtle = 'rgba(255,255,255,0.07)';

const menuItems = [
  { name: 'Features',     href: '/landing#features' },
  { name: 'Match Items',  href: '/matching' },
  { name: 'Universities', href: '/landing#universities' },
  { name: 'Contact',      href: '/landing#contact' },
];

const TrueClaimLogo = () => (
  <div className="flex items-center gap-2">
    <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: blue }}>
      <Sparkles className="size-4 text-white" />
    </div>
    <span className="font-bold text-lg tracking-tight text-white">TrueClaim</span>
  </div>
);

export default function Navbar() {
  const pathname = usePathname();
  const hiddenRoutes = ['/login', '/register', '/admin'];
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (hiddenRoutes.includes(pathname)) return null;

  return (
    <header>
      <nav
        data-state={menuState ? 'active' : undefined}
        className="fixed z-50 w-full px-2 group">
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
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
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

            {/* CTA buttons */}
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
                      <Link href={item.href} className="text-white/60 hover:text-white block duration-150">
                        {item.name}
                      </Link>
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
                  <Link href="/login"><span>Get Started</span></Link>
                </Button>
                <Button asChild size="sm"
                  className={cn('text-white font-semibold', isScrolled ? 'lg:inline-flex' : 'hidden')}
                  style={{ background: blue }}>
                  <Link href="/login"><span>Get Started →</span></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
