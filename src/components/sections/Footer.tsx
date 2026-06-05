"use client";

import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mx-auto w-full max-w-[calc(100vw-2rem)] px-5 pb-14 pt-8 sm:px-6">
      <div className="panel flex flex-col items-center justify-between gap-4 rounded-lg px-6 py-5 text-center sm:flex-row sm:items-center sm:text-left">
        <p className="muted-text text-sm">© {year} Rudresh Patel. Built with Next.js and Framer Motion.</p>

        <motion.a
          href="#home"
          whileHover={{ y: -2, scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.35, ease: EXPO_OUT }}
          className="btn-secondary inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black"
        >
          <ArrowUp className="h-4 w-4" /> Back to Top
        </motion.a>
      </div>
    </footer>
  );
}
