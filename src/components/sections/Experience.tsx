"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import { EXPERIENCES } from "@/constants";
import { fetchSetting, subscribeSetting } from "@/lib/content-store";
import { cn } from "@/lib/utils";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Experience() {
  const [items, setItems] = useState(EXPERIENCES);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.2"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  useEffect(() => {
    fetchSetting("experiences", EXPERIENCES).then((v) => setItems(v ?? EXPERIENCES));
    const unsub = subscribeSetting("experiences", (v) => setItems(v ?? EXPERIENCES));
    return () => unsub();
  }, []);

  return (
    <section id="experience" className="relative mx-auto w-full max-w-6xl px-5 py-24 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: EXPO_OUT }}
        className="mb-10"
      >
        <p className="text-xs uppercase tracking-[0.24em] text-blue-500">Experience</p>
        <h2 className="heading-modern mt-3 text-3xl font-bold text-zinc-100 sm:text-4xl">Professional Timeline</h2>
      </motion.div>

      <div ref={containerRef} className="relative">
        <div className="absolute bottom-0 left-4 top-0 w-px bg-white/10 md:left-1/2 md:-translate-x-1/2" />
        <motion.div
          aria-hidden="true"
          className="absolute left-4 top-0 w-px origin-top bg-gradient-to-b from-blue-500 to-zinc-600 md:left-1/2 md:-translate-x-1/2"
          style={{ height: lineHeight }}
        />

        <div className="space-y-8">
          {(items || EXPERIENCES).map((item, index) => {
            const isLeft = index % 2 === 0;

            return (
              <motion.article
                key={`${item.company}-${item.title}`}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.65, delay: index * 0.08, ease: EXPO_OUT }}
                className={cn("relative pl-12 md:pl-0", isLeft ? "md:pr-[52%]" : "md:pl-[52%]")}
              >
                <span className="absolute left-4 top-7 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white/30 bg-zinc-100 md:left-1/2" />

                <div className="rounded-2xl border border-white/10 bg-zinc-900/45 p-6 backdrop-blur-md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-100 sm:text-xl">{item.title}</h3>
                      <p className="text-sm text-zinc-400">{item.company}</p>
                    </div>
                    <span className="rounded-md border border-white/10 bg-zinc-900/60 px-2.5 py-1 font-mono text-xs text-zinc-500">
                      {item.dateRange}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {item.achievements.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-zinc-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
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
