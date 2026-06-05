"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Layers, Sparkles } from "lucide-react";

import { SKILL_GROUPS, SKILL_MARQUEE } from "@/constants";
import { fetchSetting, subscribeSetting } from "@/lib/content-store";
import { cn } from "@/lib/utils";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Skill = {
  name: string;
  level: string;
  years: string;
};

type SkillGroups = Record<string, Skill[]>;

const toMutableSkillGroups = (source: Record<string, readonly Skill[]>): SkillGroups =>
  Object.fromEntries(Object.entries(source).map(([group, skills]) => [group, skills.map((skill) => ({ ...skill }))]));

const defaultSkillGroups = toMutableSkillGroups(SKILL_GROUPS);
const defaultMarquee = SKILL_MARQUEE.map((skill) => ({ ...skill }));

const container = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, duration: 0.7, ease: EXPO_OUT },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EXPO_OUT } },
};

function SkillChip({ name, level, years }: Skill) {
  const info = [level, years].filter(Boolean).join(" | ");

  return (
    <div className="group relative">
      <div className="rounded-md border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_62%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition group-hover:-translate-y-0.5">
        {name}
      </div>
      {info && (
        <div className="pointer-events-none absolute -top-10 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-2 py-1 text-[10px] text-[var(--text)] opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
          {info}
        </div>
      )}
    </div>
  );
}

export default function Skills() {
  const [skillGroups, setSkillGroups] = useState<SkillGroups>(defaultSkillGroups);
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(defaultSkillGroups)[0] || "");
  const [marquee, setMarquee] = useState<Skill[]>(defaultMarquee);

  useEffect(() => {
    fetchSetting("skill_groups", defaultSkillGroups).then((v) => setSkillGroups(v ?? defaultSkillGroups));
    fetchSetting("skill_marquee", defaultMarquee).then((v) => setMarquee(v ?? defaultMarquee));

    const unsubGroups = subscribeSetting<SkillGroups>("skill_groups", (v) => setSkillGroups(v ?? defaultSkillGroups));
    const unsubMarquee = subscribeSetting<Skill[]>("skill_marquee", (v) => setMarquee(v ?? defaultMarquee));

    return () => {
      unsubGroups();
      unsubMarquee();
    };
  }, []);

  useEffect(() => {
    const keys = Object.keys(skillGroups);
    if (keys.length > 0 && (!activeCategory || !keys.includes(activeCategory))) {
      setActiveCategory(keys[0]);
    }
  }, [skillGroups, activeCategory]);

  const categories = Object.keys(skillGroups);
  // Repeat marquee items enough to ensure seamless loop on large screens
  const marqueeItems = useMemo(() => {
    if (marquee.length === 0) return [];
    const repeats = Math.max(2, Math.ceil(40 / marquee.length)); // Ensure at least 40 items or 2 repeats
    return Array(repeats).fill(marquee).flat();
  }, [marquee]);

  return (
    <section id="skills" className="relative mx-auto w-full max-w-7xl overflow-hidden px-5 py-24 sm:px-6">
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
        <motion.div variants={item} className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
          <div>
            <p className="accent-text inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em]">
              <Cpu className="h-4 w-4" /> Technical Skills
            </p>
            <h2 className="text-balance mt-3 text-4xl font-black text-[var(--text)] sm:text-5xl">A practical stack for shipping real products.</h2>
          </div>
          <p className="muted-text max-w-2xl text-sm leading-7 sm:text-base">
            Frontend polish, backend fundamentals, AI prototyping, and mobile learning all sit in one build-minded toolkit.
          </p>
        </motion.div>

        <motion.div variants={item} className="panel relative mt-8 overflow-hidden rounded-lg pb-5 pt-12">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--bg)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--bg)] to-transparent" />
          <motion.div
            className="flex w-max gap-4 px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, repeatType: "loop", duration: 40, ease: "linear" }}
          >
            {marqueeItems.map((skill, index) => (
              <SkillChip key={`${skill.name}-${index}`} {...skill} />
            ))}
          </motion.div>
        </motion.div>

        <motion.div variants={item} className="mt-8 grid gap-5 lg:grid-cols-[16rem_1fr]">
          <div className="panel flex h-fit flex-row gap-1 overflow-x-auto rounded-lg p-2 no-scrollbar lg:flex-col">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "flex min-w-max items-center gap-2 rounded-md px-4 py-2.5 text-left text-sm font-bold transition lg:w-full lg:px-3",
                  activeCategory === category ? "bg-[var(--text)] text-[var(--bg)] shadow-md" : "text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]",
                )}
              >
                <Layers className="h-4 w-4" /> {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {(skillGroups[activeCategory] || []).map((skill, idx) => (
              <motion.div key={`${skill.name}-${idx}`} variants={item} whileHover={{ y: -5 }} className="panel rounded-lg p-4">
                <Sparkles className="h-4 w-4 text-[var(--gold)]" />
                <p className="mt-4 text-sm font-black text-[var(--text)]">{skill.name}</p>
                <p className="muted-text mt-1 text-xs">
                  {[skill.level, skill.years].filter(Boolean).join(" | ") || "Experienced"}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
