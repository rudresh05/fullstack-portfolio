"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, AtSign, BadgeCheck, Globe, Mail, Sparkles } from "lucide-react";

import { HERO_SETTINGS, SOCIAL_LINKS } from "@/constants";
import { fetchSetting, subscribeSetting } from "@/lib/content-store";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const STACK = ["Next.js", "React", "TypeScript", "AI/ML", "Android", "Firebase"];
const METRICS = [
  { value: "23+", label: "public repositories" },
  { value: "3", label: "product tracks" },
  { value: "2026", label: "active portfolio" },
];

const iconMap = {
  github: BadgeCheck,
  linkedin: AtSign,
  twitter: Globe,
} as const;

const container = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, ease: EXPO_OUT, duration: 0.75 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { ease: EXPO_OUT, duration: 0.62 } },
};

export default function Hero() {
  const [socials, setSocials] = useState(() => SOCIAL_LINKS);
  const [heroSettings, setHeroSettings] = useState<{ imageUrl?: string }>(() => HERO_SETTINGS);

  useEffect(() => {
    fetchSetting("social_links", SOCIAL_LINKS).then((v) => setSocials(v ?? SOCIAL_LINKS));
    fetchSetting("hero_settings", HERO_SETTINGS).then((v) => setHeroSettings(v ?? HERO_SETTINGS));
    const unsub = subscribeSetting("social_links", (v) => setSocials(v ?? SOCIAL_LINKS));
    const unsubHero = subscribeSetting<{ imageUrl?: string }>("hero_settings", (v) => setHeroSettings(v ?? HERO_SETTINGS));
    return () => {
      unsub();
      unsubHero();
    };
  }, []);

  return (
    <section id="home" className="relative isolate min-h-screen overflow-hidden px-5 pb-16 pt-28 sm:px-6 lg:pt-32">
      <div aria-hidden="true" className="absolute inset-x-0 top-24 -z-10 h-px premium-rule opacity-70" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto grid w-full max-w-[calc(100vw-2rem)] gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch"
      >
        <motion.div variants={item} className="panel-strong rounded-lg p-5 sm:p-7 lg:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_78%,transparent)] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--text)]">
              <Sparkles className="h-4 w-4 accent-text" /> Available for work
            </div>
            <div className="muted-text text-xs font-bold uppercase tracking-[0.22em]">Full stack / AI / Android</div>
          </div>

          <p className="accent-text mt-10 text-sm font-black uppercase tracking-[0.34em]">Rudresh Patel</p>
          <h1 className="text-balance mt-4 max-w-4xl text-5xl font-black leading-[0.98] text-[var(--text)] sm:text-6xl lg:text-7xl">
            I craft polished digital products with clean code and sharp UX.
          </h1>
          <p className="muted-text mt-6 max-w-2xl text-base leading-8 sm:text-lg">
            A full-stack developer focused on premium portfolio experiences, useful web apps, AI experiments, and Android-ready product ideas.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {METRICS.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_70%,transparent)] p-4">
                <p className="text-3xl font-black text-[var(--text)]">{metric.value}</p>
                <p className="muted-text mt-1 text-xs font-bold uppercase tracking-[0.16em]">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#projects" className="btn-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-black transition hover:-translate-y-0.5">
              View Projects <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href="#contact" className="btn-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-black transition hover:-translate-y-0.5">
              Contact Me <Mail className="h-4 w-4" />
            </a>
            <Link href="/blog" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-6 py-3 text-sm font-black text-[#07110f] transition hover:-translate-y-0.5">
              Read Blog <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div variants={item} className="grid gap-5">
          <div className="panel overflow-hidden rounded-lg">
            <div className="grid sm:grid-cols-[0.92fr_1.08fr]">
              <div className="relative min-h-[24rem] bg-[var(--bg-soft)]">
                {heroSettings.imageUrl ? (
                  <Image src={heroSettings.imageUrl} alt="Rudresh Patel" fill sizes="(min-width: 1024px) 36rem, 100vw" className="object-cover" priority />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-md border border-white/20 bg-black/45 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white backdrop-blur">
                  Builder
                </div>
              </div>

              <div className="flex flex-col p-5 sm:p-6">
                <p className="muted-text text-xs font-black uppercase tracking-[0.22em]">Current toolkit</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {STACK.map((stack) => (
                    <span key={stack} className="rounded-md border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_70%,transparent)] px-2.5 py-1.5 text-xs font-bold text-[var(--text)]">
                      {stack}
                    </span>
                  ))}
                </div>

                <div className="mt-7 border-t border-[var(--line)] pt-6">
                  <p className="text-2xl font-black leading-tight text-[var(--text)]">Designing interfaces that feel deliberate, fast, and easy to trust.</p>
                  <p className="muted-text mt-4 text-sm leading-7">
                    I like systems with strong hierarchy, honest motion, clear calls to action, and content that gets to the point.
                  </p>
                </div>

                <div className="mt-auto flex gap-2 pt-7">
                  {socials.map((social) => {
                    const Icon = iconMap[social.icon as keyof typeof iconMap];
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.label}
                        className="rounded-md border border-[var(--line)] p-2 text-[var(--text)] transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]"
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["Web Apps", "AI Labs", "Mobile"].map((label) => (
              <div key={label} className="panel rounded-lg p-4 text-center">
                <p className="text-sm font-black text-[var(--text)]">{label}</p>
                <p className="muted-text mt-1 text-[10px] font-bold uppercase tracking-[0.16em]">focus</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
