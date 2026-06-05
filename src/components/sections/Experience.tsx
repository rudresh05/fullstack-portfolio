"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Milestone } from "lucide-react";

import { EXPERIENCES } from "@/constants";
import { fetchSetting, subscribeSetting } from "@/lib/content-store";
import { cn } from "@/lib/utils";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type ExperienceItem = {
  title: string;
  company: string;
  dateRange: string;
  achievements: string[];
};

const defaultExperiences: ExperienceItem[] = EXPERIENCES.map((item) => ({
  ...item,
  achievements: [...item.achievements],
}));

export default function Experience() {
  const [items, setItems] = useState<ExperienceItem[]>(defaultExperiences);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.2"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  useEffect(() => {
    fetchSetting("experiences", defaultExperiences).then((v) => setItems(v ?? defaultExperiences));
    const unsub = subscribeSetting<ExperienceItem[]>("experiences", (v) => setItems(v ?? defaultExperiences));
    return () => unsub();
  }, []);

  return (
    <section id="experience" className="relative mx-auto w-full max-w-[calc(100vw-2rem)] px-5 py-24 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: EXPO_OUT }}
        className="mb-10"
      >
        <p className="accent-text inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em]">
          <Milestone className="h-4 w-4" /> Experience
        </p>
        <h2 className="text-balance mt-3 text-4xl font-black text-[var(--text)] sm:text-5xl">Learning path, practice, and applied delivery.</h2>
      </motion.div>

      <div ref={containerRef} className="relative">
        <div className="absolute bottom-0 left-4 top-0 w-px bg-[var(--line)] md:left-1/2 md:-translate-x-1/2" />
        <motion.div aria-hidden="true" className="absolute left-4 top-0 w-px origin-top bg-[var(--accent)] md:left-1/2 md:-translate-x-1/2" style={{ height: lineHeight }} />

        <div className="space-y-8">
          {items.map((item, index) => {
            const isLeft = index % 2 === 0;

            return (
              <motion.article
                key={`${item.company}-${item.title}`}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.65, delay: index * 0.08, ease: EXPO_OUT }}
                className={cn("relative pl-10 sm:pl-12 md:pl-0", isLeft ? "md:pr-[52%]" : "md:pl-[52%]")}
              >
                <span className="absolute left-4 top-7 h-3 w-3 -translate-x-1/2 rounded-full border border-[var(--bg)] bg-[var(--accent)] md:left-1/2" />

                <div className="panel rounded-lg p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-[var(--text)] sm:text-xl">{item.title}</h3>
                      <p className="muted-text truncate text-sm">{item.company}</p>
                    </div>
                    <span className="rounded-md border border-[var(--line)] px-2.5 py-1 font-mono text-[10px] text-[var(--muted)] sm:text-xs">{item.dateRange}</span>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {item.achievements.map((point) => (
                      <li key={point} className="muted-text flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 accent-text" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
