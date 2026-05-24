"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRight, GitFork, X } from "lucide-react";

import { subscribeProjects, type ManagedProject } from "@/lib/content-store";
import { cn } from "@/lib/utils";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, duration: 0.8, ease: EXPO_OUT },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EXPO_OUT } },
};

function ProjectCard({ project, onOpen }: { project: ManagedProject; onOpen: (project: ManagedProject) => void }) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 220, damping: 18 });
  const springY = useSpring(rotateY, { stiffness: 220, damping: 18 });
  const transform = useMotionTemplate`perspective(900px) rotateX(${springX}deg) rotateY(${springY}deg)`;

  const isGithubLink = project.link.includes("github.com");

  return (
    <motion.article
      role="button"
      tabIndex={0}
      variants={item}
      onClick={() => onOpen(project)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(project);
        }
      }}
      whileHover={{ y: -5, scale: 1.005 }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        rotateY.set((px - 0.5) * 9);
        rotateX.set((0.5 - py) * 9);
      }}
      onMouseLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
      style={{ transform }}
      className={cn(
        "glass-card group relative cursor-pointer overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:border-white/10 hover:shadow-[0_16px_52px_-28px_rgba(59,130,246,0.55)]",
        project.featured ? "md:col-span-8" : "md:col-span-4",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative z-10 flex h-full flex-col">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {project.featured ? "Featured" : "Project"}
        </p>
        <h3 className="heading-modern mt-2.5 text-lg font-semibold text-zinc-100 md:text-2xl">{project.title}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{project.description}</p>

        {project.imageUrl ? (
          <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/60">
            <img src={project.imageUrl} alt={`${project.title} screenshot`} className="aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {project.tech.map((stack) => (
            <span key={stack} className="rounded-md border border-white/10 bg-zinc-900/50 px-2 py-0.5 text-[10px] text-zinc-300">
              {stack}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-7">
          <div className="flex items-center gap-3 opacity-100 transition-all duration-300 md:opacity-0 md:group-hover:opacity-100">
            <a
              href={isGithubLink ? "#" : project.link}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-400 transition-all hover:border-blue-400/50 hover:shadow-[0_0_16px_0_rgba(59,130,246,0.5)]"
            >
              <ArrowUpRight className="h-4 w-4" /> Live
            </a>
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-100 transition-all hover:border-white/20 hover:shadow-[0_0_14px_0_rgba(255,255,255,0.2)]"
            >
              <GitFork className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ProjectModal({ project, onClose }: { project: ManagedProject; onClose: () => void }) {
  const isGithubLink = project.link.includes("github.com");

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.article
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        transition={{ duration: 0.28, ease: EXPO_OUT }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-blue-500">{project.featured ? "Featured Project" : "Project"}</p>
            <h3 className="heading-modern mt-3 text-3xl font-bold text-zinc-100">{project.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="rounded-md border border-white/10 p-2 text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-5 text-sm leading-7 text-zinc-400">{project.description}</p>

        {project.imageUrl ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
            <img src={project.imageUrl} alt={`${project.title} screenshot`} className="aspect-video w-full object-cover" />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {project.tech.map((stack) => (
            <span key={stack} className="rounded-md border border-white/10 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-300">
              {stack}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={isGithubLink ? "#" : project.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400 transition hover:bg-blue-500/15"
          >
            <ArrowUpRight className="h-4 w-4" /> Live Preview
          </a>
          <a
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 transition hover:border-white/20"
          >
            <GitFork className="h-4 w-4" /> Source Code
          </a>
        </div>
      </motion.article>
    </motion.div>
  );
}

export default function ProjectGrid() {
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ManagedProject | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeProjects(setProjects);
    return () => unsubscribe();
  }, []);

  return (
    <section id="projects" className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
        <motion.div variants={item} className="mb-8 sm:mb-10">
          <p className="text-xs uppercase tracking-[0.24em] text-blue-500">Selected Work</p>
          <h2 className="heading-modern mt-3 text-3xl font-bold text-zinc-100 sm:text-4xl">Bento Project Gallery</h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {projects.map((project) => (
            <ProjectCard key={project.title} project={project} onOpen={setSelectedProject} />
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedProject ? <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} /> : null}
      </AnimatePresence>
    </section>
  );
}
