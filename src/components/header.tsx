
import { Plus, Search, Sparkles, Menu, X, CircleQuestionMark } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Item } from '@/types/items';

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

function Header({ items }: { items: Item[] }) {
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
            <Image className="shadow-lg shadow-orange-900/50" src="/bm-logo.png" alt="Logo" width={24} height={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white">BlackMUD Item DB</h1>
            <p className="text-xs text-zinc-400 font-mono">{items.length} items indexed</p>
          </div>
        </div>

        <div className="hidden md:flex gap-2">
          <NavButtons />
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden text-zinc-100 p-2 rounded hover:bg-zinc-800 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
          <div ref={panelRef} className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
            <NavButtons onDone={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
