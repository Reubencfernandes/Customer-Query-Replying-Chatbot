'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { name: 'Admin', href: '/admin' },
    { name: 'Chat', href: '/' },
    { name: 'Docs', href: '#' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-md border-b border-neutral-200/30">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link href="/" className="group flex items-center">
              <span className="font-sans font-semibold text-base sm:text-lg tracking-tight text-neutral-950 transition-colors duration-150">
                Query Bot
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs font-medium tracking-wide transition-colors duration-150 uppercase ${
                    isActive
                      ? 'text-neutral-950 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-950'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <Link href="/">
              <button className="h-8 px-4 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-[11px] font-semibold tracking-wide transition-all duration-150 shadow-3xs cursor-pointer">
                Get Started
              </button>
            </Link>
          </div>

          {/* Mobile hamburger menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-1.5 rounded-md text-neutral-500 hover:text-neutral-950 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="block h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200/30 bg-white/95 backdrop-blur-md" id="mobile-menu">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase ${
                    isActive
                      ? 'bg-neutral-50 text-neutral-950'
                      : 'text-neutral-600 hover:bg-neutral-50/50 hover:text-neutral-950'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-3 px-3">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full h-9 rounded-full bg-neutral-950 text-white text-xs font-semibold tracking-wide">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
