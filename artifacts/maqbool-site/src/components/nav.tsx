import { useEffect, useState } from 'react';

import { MaqboolWordmark } from '@/components/logo';
import { DEMO_URL, SIGN_IN_URL } from '@/config';

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#product', label: 'Product' },
  { href: '#fairness', label: 'Why Maqbool' },
  { href: '#faq', label: 'FAQ' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={
        'sticky top-0 z-50 transition-colors duration-300 ' +
        (scrolled
          ? 'border-b border-white/10 bg-[hsl(222_100%_12%/0.72)] backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent')
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" aria-label="Maqbool home">
          <MaqboolWordmark size={24} tone="reversed" />
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={SIGN_IN_URL}
            className="hidden px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline-block"
          >
            Sign in
          </a>
          <a
            href={DEMO_URL}
            className="btn-sheen relative overflow-hidden rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition-transform hover:-translate-y-px"
          >
            Try the live demo
          </a>
        </div>
      </div>
    </header>
  );
}
