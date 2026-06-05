"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, LockKeyhole, Menu, Moon, Settings, Sun, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "@/components/providers/auth-provider";
import { NAV_LINKS } from "@/constants";
import { useTheme } from "@/contexts/theme-context";
import { fetchSetting, subscribeSetting } from "@/lib/content-store";

type NavLink = {
  label: string;
  href: string;
};

const defaultLinks: NavLink[] = NAV_LINKS.map((link) => ({ ...link }));

export default function Header() {
  const [links, setLinks] = useState<NavLink[]>(defaultLinks);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    fetchSetting("nav_links", defaultLinks).then((value) => setLinks(value ?? defaultLinks));
    const unsub = subscribeSetting<NavLink[]>("nav_links", (value) => setLinks(value ?? defaultLinks));
    return () => unsub();
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (pathname === "/me") return null;

  const getHref = (href: string) => {
    if (!href.startsWith("#")) return href;
    return pathname === "/" ? href : `/${href}`;
  };

  if (!mounted) {
    return (
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
        <nav className="panel-strong mx-auto flex h-[64px] w-full max-w-[calc(100vw-2rem)] items-center justify-between rounded-lg px-3 sm:px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-black btn-primary">RP</span>
          </div>
          <div className="h-8 w-24 animate-pulse rounded bg-[var(--line)]" />
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
      <nav
        className="panel-strong mx-auto flex w-full max-w-[calc(100vw-2rem)] items-center justify-between rounded-lg px-3 py-3 sm:px-4"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--line)] text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)] md:hidden"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/#home" className="flex items-center gap-3" aria-label="Rudresh Patel home">
            <span className="flex h-10 w-10 items-center justify-center rounded-md text-sm font-black btn-primary">RP</span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-black text-[var(--text)]">Rudresh Patel</span>
              <span className="muted-text block text-[11px] font-semibold uppercase tracking-[0.18em]">Full-stack portfolio</span>
            </span>
          </Link>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          {links
            .filter((link) => link.label !== "Blog")
            .map((link) => (
              <Link
                key={link.label}
                href={getHref(link.href)}
                className="muted-text rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)] hover:text-[var(--text)]"
              >
                {link.label}
              </Link>
            ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={isAdmin ? "/studio" : "/login"}
            className="btn-secondary inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition hover:-translate-y-0.5 sm:px-4"
            aria-label={isAdmin ? "Open portfolio settings" : "Login to portfolio settings"}
            title={isAdmin ? "Open settings" : "Login to settings"}
          >
            {isAdmin ? <Settings className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
            <span className="hidden sm:inline">{isAdmin ? "Settings" : "Login"}</span>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--line)] text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            href="/blog"
            className="hidden items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-black text-[#07110f] transition hover:-translate-y-0.5 sm:inline-flex"
          >
            Blog <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-3 top-[calc(100%+0.75rem)] overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] p-3 shadow-2xl md:hidden"
          >
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={getHref(link.href)}
                  className="muted-text flex items-center justify-between rounded-md px-4 py-3 text-sm font-black transition hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)] hover:text-[var(--text)]"
                >
                  {link.label}
                  {link.href.startsWith("/") && <ArrowUpRight className="h-4 w-4 opacity-40" />}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
