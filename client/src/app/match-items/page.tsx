import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const menuItems = [
  { name: 'Features', href: '#features' },
  { name: 'Match Items', href: '/match-items' },
  { name: 'Universities', href: '#universities' },
  { name: 'Contact', href: '#contact' },
];

export default function MatchItemsPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <header>
        <nav className="w-full px-2">
          <div className="mx-auto mt-2 max-w-6xl px-6 lg:px-12">
            <div className="relative flex items-center justify-between py-4">
              <Link href="/landing" aria-label="home" className="flex items-center gap-2">
                <div
                  className="size-8 rounded-lg flex items-center justify-center"
                  style={{ background: '#0A66C2' }}
                >
                  <Sparkles className="size-4 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight text-white">TrueClaim</span>
              </Link>

              <ul className="flex gap-8 text-sm">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-white/60 hover:text-white block duration-150 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </header>
    </main>
  );
}

