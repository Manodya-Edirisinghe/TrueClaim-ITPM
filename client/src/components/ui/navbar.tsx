'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Menu, Trash2, UserCircle2, X, Sparkles } from 'lucide-react';
import api from '@/lib/axios';
import { useNotifications } from '@/components/notifications/notification-provider';
import { cn } from '@/lib/utils';

const blue = '#0A66C2';
const subtle = 'rgba(255,255,255,0.07)';

const menuItems = [
  { name: 'Home',         href: '/landing' },
  { name: 'Lost & Found', href: '/lostandfound' },
  { name: 'Match Items',  href: '/matching' },
  { name: 'Message',      href: '/messages' },
  { name: 'Feedback',     href: '/feedback' },
  { name: 'Contact',      href: '/landing#contact' },
];

const TrueClaimLogo = () => (
  <div className="flex items-center gap-2">
    <div
      className="size-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/30"
      style={{ background: `linear-gradient(135deg, ${blue} 0%, #1f7ddf 55%, #53a2ff 100%)` }}
    >
      <Sparkles className="size-4 text-white" />
    </div>
    <span className="font-bold text-lg tracking-tight text-white">TrueClaim</span>
  </div>
);

export default function Navbar() {
  const pathname = usePathname();
  const hiddenRoutes = ['/login', '/register', '/admin', '/verification'];
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [activeLandingSection, setActiveLandingSection] = React.useState('');
  const [username, setUsername] = React.useState('Profile');
  const [showNotifications, setShowNotifications] = React.useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  React.useEffect(() => {
    const syncUser = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setUsername('Profile');
        return;
      }

      try {
        const { data } = await api.get<{ user?: { fullName?: string } }>('/auth/me');
        setUsername(data?.user?.fullName?.trim() || 'Profile');
      } catch {
        setUsername('Profile');
      }
    };

    void syncUser();
  }, []);

  React.useEffect(() => {
    const onDocClick = () => setShowNotifications(false);
    if (!showNotifications) return;

    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [showNotifications]);

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    if (pathname !== '/landing') {
      setActiveLandingSection('');
      return;
    }

    const sectionIds = ['contact'];

    const syncFromHash = () => {
      const hashId = window.location.hash.replace('#', '');
      if (sectionIds.includes(hashId)) {
        setActiveLandingSection(hashId);
      } else if (window.scrollY < 180) {
        setActiveLandingSection('');
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveLandingSection(visible[0].target.id);
          return;
        }

        if (window.scrollY < 180) {
          setActiveLandingSection('');
        }
      },
      {
        root: null,
        rootMargin: '-35% 0px -45% 0px',
        threshold: [0.2, 0.45, 0.75],
      }
    );

    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);

    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      observer.disconnect();
    };
  }, [pathname]);

  const isMenuItemActive = (href: string): boolean => {
    const [itemPath, itemHash] = href.split('#');

    if (itemHash) {
      return pathname === itemPath && activeLandingSection === itemHash;
    }

    if (itemPath === '/landing') {
      return pathname === '/landing' && !activeLandingSection;
    }

    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  };

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (menuState) {
      setMenuState(false);
    }

    if (href !== '/landing' || pathname !== '/landing') {
      return;
    }

    event.preventDefault();
    setActiveLandingSection('');
    window.history.replaceState(null, '', '/landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (hiddenRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return null;

  return (
    <header>
      <nav
        data-state={menuState ? 'active' : undefined}
        className="fixed z-50 w-full px-2 group">
        <div
          className={cn(
            'mx-auto mt-2 max-w-6xl px-3 transition-all duration-300 sm:px-4 lg:px-8',
            isScrolled && 'rounded-2xl border backdrop-blur-xl lg:px-5',
          )}
          style={
            isScrolled
              ? {
                  backgroundColor: 'rgba(4, 10, 24, 0.68)',
                  borderColor: 'rgba(96, 165, 250, 0.24)',
                  boxShadow: '0 14px 36px rgba(2, 6, 23, 0.45)',
                }
              : {}
          }
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:flex-nowrap lg:gap-3 lg:py-4">

            {/* Logo */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/landing" aria-label="home" onClick={(event) => handleNavClick(event, '/landing')}>
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
            <div className="hidden min-w-0 flex-1 justify-center px-2 lg:flex">
              <ul className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-sm shadow-2xl backdrop-blur-xl">
                {menuItems.map((item, i) => (
                  <li key={i}>
                    <Link
                      href={item.href}
                      onClick={(event) => handleNavClick(event, item.href)}
                      className={cn(
                        'relative block rounded-full px-4 py-1.5 duration-200 transition-all',
                        isMenuItemActive(item.href)
                          ? 'bg-gradient-to-r from-[#0A66C2] to-[#1789FF] font-semibold text-white shadow-lg shadow-blue-900/35'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Profile link */}
            <div
              className={cn(
                'group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-4 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none',
              )}
              style={{ backgroundColor: 'rgba(3, 9, 20, 0.92)', borderColor: subtle }}>
              {/* Mobile links */}
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, i) => (
                    <li key={i}>
                      <Link
                        href={item.href}
                        onClick={(event) => handleNavClick(event, item.href)}
                        className={cn(
                          'block rounded-xl px-3 py-2 duration-150',
                          isMenuItemActive(item.href)
                            ? 'bg-white/10 font-semibold text-white ring-1 ring-white/20'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        )}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowNotifications((prev) => !prev);
                  }}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : null}
                </button>

                <div
                  onClick={(event) => event.stopPropagation()}
                  className={cn(
                    'absolute right-0 top-12 z-50 w-80 origin-top-right rounded-xl border border-white/10 bg-[#0c1424] p-2 shadow-2xl shadow-black/40 transition-all duration-200',
                    showNotifications
                      ? 'pointer-events-auto translate-y-0 opacity-100'
                      : 'pointer-events-none -translate-y-2 opacity-0'
                  )}
                >
                  <div className="mb-2 flex items-center justify-between px-2 py-1">
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all as read
                    </button>
                  </div>

                  <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/55">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((note) => (
                        <div
                          key={note.id}
                          className={cn(
                            'rounded-lg border p-2.5 transition',
                            note.isRead
                              ? 'border-white/10 bg-white/[0.03]'
                              : 'border-blue-400/30 bg-blue-500/10'
                          )}
                        >
                          <p className="text-xs text-white">{note.message}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-white/45">
                              {formatDistanceToNow(new Date(note.timestamp), { addSuffix: true })}
                            </span>
                            <div className="flex items-center gap-1">
                              {!note.isRead ? (
                                <button
                                  type="button"
                                  onClick={() => markAsRead(note.id)}
                                  className="rounded px-1.5 py-1 text-[10px] text-cyan-300 transition hover:bg-white/10"
                                >
                                  Mark read
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => deleteNotification(note.id)}
                                className="rounded p-1 text-white/60 transition hover:bg-red-500/20 hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <Link
                href="/profile"
                onClick={() => setMenuState(false)}
                title={username}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition hover:bg-white/10 lg:shrink-0"
              >
                <UserCircle2 className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
