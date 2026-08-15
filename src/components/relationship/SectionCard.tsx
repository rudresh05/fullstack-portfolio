"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface SectionCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export function SectionCard({ href, icon: Icon, title, description }: SectionCardProps) {
  return (
    <Link
      href={href}
      className="group block relative rounded-2xl border border-[var(--me-line)] bg-[var(--me-panel)] p-5 transition-all hover:-translate-y-1 hover:shadow-md hover:border-[var(--me-rose)]/40 overflow-hidden"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[var(--me-rose)]/10 text-[var(--me-rose)] transition-colors group-hover:bg-[var(--me-rose)] group-hover:text-white">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif-display text-lg text-[var(--me-text)] mb-1 font-semibold group-hover:text-[var(--me-rose)] transition-colors">
            {title}
          </h3>
          <p className="font-sans-display text-xs text-[var(--me-muted)] leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
