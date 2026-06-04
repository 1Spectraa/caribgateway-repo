"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { navLinks } from "@/data/content";
import { logout } from "@/lib/actions/auth";

type CgUser = { name: string; email: string; role: string } | null;

function readCgUser(): CgUser {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)cg-user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as CgUser;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<CgUser>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setUser(readCgUser());
    setHydrated(true);
  }, []);

  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-brand-teal rounded-xl flex items-center justify-center shadow-sm group-hover:bg-brand-teal-dark transition-colors">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-white"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
              </svg>
            </div>
            <div className="leading-none">
              <span
                className={`font-bold text-lg block transition-colors ${
                  scrolled ? "text-brand-navy" : "text-white"
                }`}
              >
                CaribGateway
              </span>
              <span
                className={`text-[10px] block transition-colors ${
                  scrolled ? "text-brand-slate" : "text-white/70"
                }`}
              >
                Your Gateway to the Caribbean
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-brand-teal ${
                  scrolled ? "text-gray-600" : "text-white/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {hydrated && user ? (
              <>
                <span
                  className={`text-sm transition-colors ${
                    scrolled ? "text-gray-500" : "text-white/70"
                  }`}
                >
                  Hi, {firstName}
                </span>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className={`text-sm font-medium transition-colors hover:text-brand-teal ${
                      scrolled ? "text-gray-600" : "text-white/80"
                    }`}
                  >
                    Admin Panel
                  </Link>
                )}
                <form action={logout}>
                  <button
                    type="submit"
                    className={`text-sm font-medium transition-colors hover:text-brand-teal ${
                      scrolled ? "text-brand-navy" : "text-white/80"
                    }`}
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                {hydrated && (
                  <Link
                    href="/login"
                    className={`text-sm font-medium transition-colors hover:text-brand-teal ${
                      scrolled ? "text-brand-navy" : "text-white/80"
                    }`}
                  >
                    Sign In
                  </Link>
                )}
                <Link
                  href="/destinations"
                  className="bg-brand-coral hover:bg-brand-coral-dark text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-105 shadow-sm"
                >
                  Start Exploring
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled
                ? "text-gray-600 hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-brand-teal hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 pb-1 border-t border-gray-100 mt-2">
              {user ? (
                <>
                  <p className="px-3 py-1.5 text-xs text-gray-400">
                    Signed in as <span className="font-medium text-gray-600">{user.name}</span>
                  </p>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-brand-teal hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <form action={logout}>
                    <button
                      type="submit"
                      className="block w-full text-left px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-brand-teal hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-brand-teal hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-brand-teal hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/destinations"
                    className="block w-full text-center bg-brand-coral hover:bg-brand-coral-dark text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors mt-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    Start Exploring
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
