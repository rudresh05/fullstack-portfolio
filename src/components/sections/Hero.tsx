"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { AtSign, BadgeCheck, Globe } from "lucide-react";

import { HERO_SETTINGS, SOCIAL_LINKS } from "@/constants";
import { fetchSetting, subscribeSetting } from "@/lib/content-store";
import { cn } from "@/lib/utils";

const NAME = "RUDRESH PATEL";
const ROLES = ["Full Stack Developer", "AI Researcher", "Problem Solver"];
const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.12, ease: EXPO_OUT, duration: 0.8 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { ease: EXPO_OUT, duration: 0.7 } },
};

const iconMap = {
  github: BadgeCheck,
  linkedin: AtSign,
  twitter: Globe,
} as const;

export default function Hero() {
  const [activeRole, setActiveRole] = useState(0);
  const letters = useMemo(() => NAME.split(""), []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 24, mass: 0.5 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 24, mass: 0.5 });

  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${smoothX}px ${smoothY}px, rgba(59, 130, 246, 0.15), transparent 42%)`;

  useEffect(() => {
    const updateCenter = () => {
      mouseX.set(window.innerWidth / 2);
      mouseY.set(window.innerHeight / 2);
    };

    updateCenter();
    window.addEventListener("resize", updateCenter);

    return () => window.removeEventListener("resize", updateCenter);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveRole((prev) => (prev + 1) % ROLES.length);
    }, 2200);

    return () => window.clearInterval(id);
  }, []);

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
    <section
      id="home"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-5 py-20 sm:px-6 sm:py-24"
      onMouseMove={(event) => {
        mouseX.set(event.clientX);
        mouseY.set(event.clientY);
      }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: spotlight }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 top-[14%] h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute bottom-[10%] right-[12%] h-44 w-44 rounded-full bg-zinc-400/5 blur-3xl" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-7 text-center sm:gap-9"
      >
        <motion.p variants={item} className="rounded-full border border-white/10 bg-zinc-900/35 px-4 py-1 text-[10px] uppercase tracking-[0.25em] text-zinc-400 backdrop-blur-sm sm:text-xs">
          Premium Interfaces. Built for Results.
        </motion.p>

        {heroSettings.imageUrl ? (
          <motion.div
            variants={item}
            className="relative h-32 w-32 overflow-hidden rounded-full border border-blue-500/30 bg-zinc-900/60 shadow-[0_0_60px_-24px_rgba(59,130,246,0.9)] sm:h-40 sm:w-40"
          >
            <img
              src={heroSettings.imageUrl}
              alt="Rudresh Patel"
              className="h-full w-full object-cover"
            />
          </motion.div>
        ) : null}

        <h1 className={cn("heading-modern max-w-4xl bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text font-sans text-4xl font-black text-transparent sm:text-6xl md:text-7xl")}> 
          {letters.map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.62, delay: index * 0.03, ease: EXPO_OUT }}
              className={cn("inline-block", letter === " " ? "w-[0.34em]" : "")}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </h1>

        <motion.div variants={item} className="h-9 overflow-hidden sm:h-12">
          <AnimatePresence mode="wait">
            <motion.p
              key={ROLES[activeRole]}
              initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -22, filter: "blur(8px)" }}
              transition={{ duration: 0.75, ease: EXPO_OUT }}
              className="text-sm font-medium text-blue-500 sm:text-xl"
            >
              {ROLES[activeRole]}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <motion.div variants={item} className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <motion.a
            href="#projects"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.35, ease: EXPO_OUT }}
            className="inline-flex min-w-[168px] items-center justify-center rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-400 hover:shadow-[0_14px_36px_-16px_rgba(59,130,246,0.9)]"
          >
            View My Work
          </motion.a>

          <motion.a
            href="/blog"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.35, ease: EXPO_OUT }}
            className="inline-flex min-w-[168px] items-center justify-center rounded-lg border border-white/10 bg-zinc-900/40 px-6 py-3 text-sm font-semibold text-zinc-100 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-zinc-800/40 hover:shadow-[0_14px_36px_-18px_rgba(255,255,255,0.25)]"
          >
            Read Blog
          </motion.a>
        </motion.div>

        <motion.div variants={item} className="pt-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/30 px-3 py-2 backdrop-blur-sm sm:gap-3 sm:px-4">
            {socials.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];

              return (
                <motion.a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  whileHover={{ y: -3, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.3, ease: EXPO_OUT }}
                  className="rounded-full p-2 text-zinc-300 transition-colors hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
