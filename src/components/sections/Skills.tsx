"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
  Object.fromEntries(
    Object.entries(source).map(([group, skills]) => [
      group,
      skills.map((skill) => ({ ...skill })),
    ]),
  );

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

function SkillChip({ name, level, years }: { name: string; level: string; years: string }) {
  return (
    <div className="group relative">
      <div className="rounded-full border border-white/10 bg-zinc-900/45 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur-sm transition-colors group-hover:text-white">
        {name}
      </div>
      <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-zinc-950/90 px-2 py-1 text-[10px] text-zinc-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {level} | {years}
      </div>
    </div>
  );
}

export default function Skills() {
  const [activeCategory, setActiveCategory] = useState<string>("Frontend");
  const [skillGroups, setSkillGroups] = useState<SkillGroups>(defaultSkillGroups);
  const [marquee, setMarquee] = useState<Skill[]>(defaultMarquee);

  useEffect(() => {
    fetchSetting("skill_groups", defaultSkillGroups).then((value) => setSkillGroups(value ?? defaultSkillGroups));
    fetchSetting("skill_marquee", defaultMarquee).then((value) => setMarquee(value ?? defaultMarquee));

    const unsubGroups = subscribeSetting<SkillGroups>("skill_groups", (value) => setSkillGroups(value ?? defaultSkillGroups));
    const unsubMarquee = subscribeSetting<Skill[]>("skill_marquee", (value) => setMarquee(value ?? defaultMarquee));

    return () => {
      unsubGroups();
      unsubMarquee();
    };
  }, []);

  const categories = Object.keys(skillGroups);
  const marqueeItems = useMemo(() => [...marquee, ...marquee], [marquee]);

  return (
    <section id="skills" className="relative mx-auto w-full max-w-6xl overflow-hidden px-5 pb-24 pt-10 sm:px-6 sm:pt-12">
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
        <motion.div variants={item} className="mb-8">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-500">Technical Skills</p>
          <h2 className="heading-modern mt-3 text-3xl font-bold text-zinc-100 sm:text-4xl">Animated Stack Marquee</h2>
        </motion.div>

        <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/35 py-5 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#030303] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#030303] to-transparent" />
          <motion.div
            className="flex w-max gap-2 px-3"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, repeatType: "loop", duration: 22, ease: "linear" }}
          >
            {marqueeItems.map((skill, index) => (
              <SkillChip key={`${skill.name}-${index}`} name={skill.name} level={skill.level} years={skill.years} />
            ))}
          </motion.div>
        </motion.div>

        <motion.div variants={item} className="mt-10">
          <div className="mb-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs tracking-wide transition",
                  activeCategory === category
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                    : "border-white/10 bg-zinc-900/35 text-zinc-300 hover:text-zinc-100",
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(skillGroups[activeCategory] || []).map((skill) => (
              <motion.div key={skill.name} variants={item} whileHover={{ y: -5 }} className="group relative">
                <div className="rounded-xl border border-white/10 bg-zinc-900/45 px-4 py-3 text-center text-sm font-medium text-zinc-200 backdrop-blur-sm transition-colors group-hover:text-white">
                  {skill.name}
                </div>
                <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-zinc-950/90 px-2 py-1 text-[10px] text-zinc-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {skill.level} | {skill.years}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
