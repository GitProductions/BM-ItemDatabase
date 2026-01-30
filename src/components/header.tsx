
import { Plus, Search, Sparkles, Menu, X, CircleQuestionMark } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Item } from '@/types/items';
import Button from './ui/Button';

const navLinks = [
  { href: '/', label: 'Items', icon: Search },
  { href: '/gear-planner', label: 'Equipment', icon: Sparkles },
  { href: '/add-item', label: 'Add Items', icon: Plus },
  { href: '/about', label: 'About', icon: CircleQuestionMark },
];

function NavButtons({ onDone }: { onDone?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onDone}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              active ? 'bg-zinc-800 text-orange-400 border border-zinc-700' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Icon size={16} /> {label}
          </Link>
        );
      })}
    </>
  );
}

function Header({ items, loading = false }: { items: Item[]; loading?: boolean }) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleClickAway = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [mobileOpen]);

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded text-white">
            <Image
              priority
              sizes="24px"
              className="shadow-lg shadow-orange-900/50"
              src="/bm-logo.webp"
              alt="Logo"
              width={24}
              height={24}
            />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white">BlackMUD Item DB</h1>
            <p className="text-xs text-zinc-400 font-mono min-w-[12ch]" aria-busy={loading}>
              {loading ? 'Loading…' : `${items.length} items indexed`}
            </p>
          </div>
        </div>


   
        <div className="hidden md:flex gap-2">
          <NavButtons />

          {/* User Login  */}
          {session?.user ? (
            <Link
              href="/account"
              className="px-3 py-2 rounded-md border border-zinc-800 text-sm text-zinc-100 hover:border-orange-500 transition-colors"
            >
              {session.user.name ? `Hi, ${session.user.name}` : 'Account'}
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 rounded-md border border-zinc-800 text-sm text-zinc-100 hover:border-orange-500 transition-colors"
            >
              {status === 'loading' ? 'Checking…' : 'Sign in'}
            </Link>
          )}
        </div>

        <Button
          onClick={() => setMobileOpen((v) => !v)}
          variant="ghost"
          className="md:hidden text-zinc-100 p-2 rounded hover:bg-zinc-800 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </Button>
      </div>

      {/* Should we move the user info outside of the hamburg menu for mobile users? */}
      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
          <div ref={panelRef} className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
            <NavButtons onDone={() => setMobileOpen(false)} />
            {session?.user ? (
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Account
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
