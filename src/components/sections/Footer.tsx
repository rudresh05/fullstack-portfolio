"use client";

import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto w-full max-w-6xl px-5 pb-14 pt-8 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/45 px-6 py-5 backdrop-blur-md sm:flex-row sm:items-center">
        <p className="text-sm text-zinc-400">© {year} Rudresh Patel. Built with Next.js & Framer Motion.</p>

        <motion.a
          href="#home"
          whileHover={{ y: -2, scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.35, ease: EXPO_OUT }}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-zinc-900/55 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-blue-500/30 hover:text-white"
        >
          <ArrowUp className="h-4 w-4" /> Back to Top
        </motion.a>
      </div>
    </footer>
  );
}
