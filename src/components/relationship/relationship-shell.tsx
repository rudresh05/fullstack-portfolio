"use client";

import Link from "next/link";
import { Heart, LockKeyhole, Sparkles } from "lucide-react";
import { useRelationship } from "@/components/relationship/relationship-provider";
import { usePathname } from "next/navigation";

export function RelationshipShell({ children }: { children: React.ReactNode }) {
  const { data, loading, error } = useRelationship();
  const pathname = usePathname();
  const isMainPage = pathname === "/me";

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="h-5 w-5 animate-pulse text-[var(--me-rose)]" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--me-muted)] font-sans-display">
            Opening your universe…
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <LockKeyhole className="mx-auto h-7 w-7 text-[var(--me-muted)] mb-5" />
          <h1 className="font-serif-display text-3xl text-[var(--me-text)] mb-3">This space is private.</h1>
          <p className="text-[13px] text-[var(--me-muted)] font-sans-display leading-relaxed mb-7">
            {error ?? "Use the private link you received to enter."}
          </p>
          <Link
            href="/me"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--me-line)] bg-[var(--me-panel)] px-5 py-2.5 text-[11px] uppercase tracking-widest text-[var(--me-muted)] hover:text-[var(--me-text)] transition-colors font-sans-display shadow-sm"
          >
            Back to entrance
          </Link>
        </div>
      </main>
    );
  }

  if (isMainPage) {
    return (
      <main className="min-h-screen w-full overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-[var(--me-line)] bg-[#f7f0e6]/90 backdrop-blur-md shadow-sm">
        <Link
          href="/me"
          className="inline-flex items-center gap-2 text-[13px] text-[var(--me-text)] hover:text-[var(--me-rose)] transition-colors font-sans-display font-medium"
        >
          <Heart className="h-3.5 w-3.5 fill-[var(--me-rose)] text-[var(--me-rose)]" />
          Our Universe
        </Link>
        <Link
          href="/me/admin"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[var(--me-gold)] hover:text-[#b3883a] transition-colors font-sans-display font-bold"
        >
          <LockKeyhole className="h-3 w-3" />
          Studio
        </Link>
      </nav>
      <div className="px-5 pb-24 pt-8 sm:px-8 max-w-5xl mx-auto">
        {children}
      </div>
    </main>
  );
}
