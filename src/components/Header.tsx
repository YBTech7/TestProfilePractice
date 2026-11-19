import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BrandMark } from './BrandMark';

interface HeaderProps {
  customLogoUrl?: string | null;
  onBookConsultation: () => void;
}

const NAV_ITEMS = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Projects', href: '#projects' },
  { label: 'Insights', href: '#insights' },
];

export const Header: React.FC<HeaderProps> = ({
  customLogoUrl,
  onBookConsultation,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const target = document.querySelector(href);
    if (target) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#C8A253]/18 bg-[#06141E]/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-5 sm:px-8 lg:gap-6">
        <a
          href="#top"
          onClick={(e) => handleNavClick(e, '#top')}
          className="inline-flex min-h-[44px] items-center gap-2.5 sm:gap-3 whitespace-nowrap shrink-0 rounded-lg px-1.5 -ml-1.5 py-1 transition-colors hover:text-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06141E]"
        >
          <BrandMark customLogoUrl={customLogoUrl} size={36} decorative />
          <span className="heading-uppercase font-display text-base sm:text-[17px] lg:text-lg font-semibold leading-none text-[#F5F2EB] whitespace-nowrap shrink-0">
            Pio Languisan
          </span>
        </a>

        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-3 lg:gap-7 text-xs lg:text-sm font-medium text-[#C2D0D6]"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="rounded px-1.5 py-1 whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06141E]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onBookConsultation}
            className="hidden sm:inline-flex min-h-[38px] items-center justify-center rounded-lg bg-[#C8A253] px-3.5 lg:px-4 py-2 text-xs font-semibold text-[#06141E] whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F2EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06141E]"
          >
            Book Consultation
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-drawer"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-[#C8A253]/25 bg-[#0B222D] p-2 text-[#F5F2EB] min-h-[40px] min-w-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06141E]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-navigation-drawer"
          className="border-t border-[#C8A253]/18 bg-[#081A24] px-5 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1.5" aria-label="Mobile Navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-left text-sm font-medium text-[#F5F2EB] transition-colors hover:bg-[#0E2C38] hover:text-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A253]"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onBookConsultation();
              }}
              className="mt-2 flex min-h-[44px] items-center justify-center rounded-lg bg-[#C8A253] px-4 py-2.5 text-sm font-semibold text-[#06141E] transition-colors hover:bg-[#DFC585] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5F2EB]"
            >
              Book Consultation
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
