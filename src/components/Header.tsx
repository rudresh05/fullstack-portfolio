"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSetting, subscribeSetting } from "@/lib/content-store";
import { NAV_LINKS } from "@/constants";

type NavLink = {
  label: string;
  href: string;
};

const defaultLinks: NavLink[] = NAV_LINKS.map((link) => ({ ...link }));

export default function Header() {
  const [links, setLinks] = useState<NavLink[]>(defaultLinks);

  useEffect(() => {
    fetchSetting("nav_links", defaultLinks).then((value) => setLinks(value ?? defaultLinks));
    const unsub = subscribeSetting<NavLink[]>("nav_links", (value) => setLinks(value ?? defaultLinks));
    return () => unsub();
  }, []);

  return (
    <header className="mx-auto w-full max-w-6xl px-5 py-4 sm:px-6">
      <nav className="flex items-center justify-between">
        <div className="text-sm font-semibold">RUDRESH</div>
        <div className="hidden gap-4 sm:flex">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm text-zinc-300 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
