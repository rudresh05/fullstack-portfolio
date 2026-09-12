"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Code2,
  Cpu,
  ExternalLink,
  GitFork,
  Layers,
  Sparkles,
  X,
} from "lucide-react";

import { subscribeProjects, type ManagedProject } from "@/lib/content-store";
import { cn } from "@/lib/utils";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, duration: 0.7, ease: EXPO_OUT },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EXPO_OUT } },
};

function getProjectIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("focus") || lower.includes("os")) return Sparkles;
  if (lower.includes("dsa") || lower.includes("track") || lower.includes("syntra"))
    return Cpu;
  return Code2;
}

function getScreenshotUrl(url: string) {
  if (!url || url.includes("github.com")) return "";
  return `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=960&h=600`;
}

function ProjectCard({
  project,
  onOpen,
  index,
}: {
  project: ManagedProject;
  onOpen: (project: ManagedProject) => void;
  index: number;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const liveLink =
    project.link && !project.link.includes("github.com") ? project.link : "";
  const isGithub = project.link && project.link.includes("github.com");
  const Icon = getProjectIcon(project.title);

  const screenshotUrl = liveLink ? getScreenshotUrl(liveLink) : "";
  const displayImage = !imgError && (project.imageUrl || screenshotUrl);

  return (
    <motion.article
      variants={itemVariant}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25, ease: EXPO_OUT }}
      onClick={() => onOpen(project)}
      className="panel group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl transition-all duration-300 hover:border-[var(--accent)] hover:shadow-lg"
    >
      {/* Sleek Minimalist Bento Visual Banner with Live UI Preview */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_85%,transparent)]">
        {/* Shimmer skeleton while loading screenshot */}
        {displayImage && !imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-[color-mix(in_srgb,var(--line)_18%,transparent)]" />
        )}

        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt={project.title}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={cn(
                "h-full w-full object-cover object-top transition-all duration-500 group-hover:scale-105",
                imgLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
            />
            {/* Ambient vignette gradient for sleek contrast */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          </>
        ) : (
          /* Sleek Minimalist Tech Graphic Fallback */
          <div className="relative flex h-full w-full items-center justify-between p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-[color-mix(in_srgb,var(--accent)_10%,transparent)] to-[color-mix(in_srgb,var(--gold)_8%,transparent)]" />
            <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(var(--text)_1px,transparent_1px)] [background-size:14px_14px]" />
            <span className="pointer-events-none absolute right-4 bottom-1 select-none font-mono text-5xl font-black text-[var(--line)] opacity-50 sm:text-6xl">
              0{index + 1}
            </span>
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Icon className="h-6 w-6 text-[var(--accent)]" />
            </div>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {project.featured && (
            <span className="inline-flex items-center gap-1 rounded-md border border-[color-mix(in_srgb,var(--gold)_40%,transparent)] bg-[var(--panel-strong)]/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--gold)] shadow-sm backdrop-blur-md">
              ★ Featured
            </span>
          )}
          {liveLink && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-[var(--panel-strong)]/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-black leading-snug text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">
            {project.title}
          </h3>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--panel-strong)] text-[var(--muted)] transition-colors group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>

        <p className="muted-text mt-2.5 line-clamp-3 text-xs leading-relaxed sm:text-sm">
          {project.description || "Interactive digital product and full-stack web application."}
        </p>

        {/* Tech Stack Pills */}
        {project.tech && project.tech.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tech.map((stack) => (
              <span
                key={stack}
                className="rounded-md border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_65%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text)]"
              >
                {stack}
              </span>
            ))}
          </div>
        )}

        {/* Card Footer: Action Links */}
        <div className="mt-auto flex items-center justify-end gap-2.5 pt-5 border-t border-[var(--line)]">
          {liveLink && (
            <a
              href={liveLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="btn-primary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black transition hover:opacity-90"
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> Live Demo
            </a>
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="btn-secondary inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black transition hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]"
            >
              {isGithub ? (
                <>
                  <GitFork className="h-3.5 w-3.5" /> Source
                </>
              ) : (
                <>
                  <ExternalLink className="h-3.5 w-3.5" /> Visit
                </>
              )}
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: ManagedProject;
  onClose: () => void;
}) {
  const liveLink =
    project.link && !project.link.includes("github.com") ? project.link : "";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.article
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.24, ease: EXPO_OUT }}
        onClick={(event) => event.stopPropagation()}
        className="panel-strong w-full max-w-lg rounded-xl p-6 sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="accent-text text-[11px] font-bold uppercase tracking-wider">
                {project.featured ? "Featured Project" : "Project Showcase"}
              </span>
              {liveLink && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <h3 className="mt-1 text-2xl font-black text-[var(--text)] sm:text-3xl">
              {project.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg border border-[var(--line)] p-1.5 text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="muted-text mt-4 text-sm leading-relaxed">
          {project.description || "No description provided."}
        </p>

        {/* Live UI Screenshot in Modal */}
        {(project.imageUrl || liveLink) && (
          <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)]">
            <img
              src={project.imageUrl || getScreenshotUrl(liveLink)}
              alt={project.title}
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          </div>
        )}

        {project.tech && project.tech.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Technologies
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.tech.map((stack) => (
                <span
                  key={stack}
                  className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1 text-xs font-semibold text-[var(--text)]"
                >
                  {stack}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center gap-3 border-t border-[var(--line)] pt-5">
          {liveLink && (
            <a
              href={liveLink}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-black transition hover:opacity-90"
            >
              <ArrowUpRight className="h-4 w-4" /> View Live
            </a>
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-black transition hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]"
            >
              <GitFork className="h-4 w-4" /> Source Code
            </a>
          )}
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
    <section id="projects" className="relative mx-auto w-full max-w-[calc(100vw-2rem)] px-5 py-20 sm:px-6 sm:py-24">
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
        {/* Section Header: Aligned with Hero & Skills */}
        <motion.div variants={itemVariant} className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="accent-text inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em]">
              <Layers className="h-4 w-4" /> Selected Projects
            </p>
            <h2 className="text-balance mt-3 text-4xl font-black text-[var(--text)] sm:text-5xl">
              Featured builds and practical experiments.
            </h2>
            <p className="muted-text mt-3 max-w-2xl text-sm leading-7 sm:text-base">
              A curated collection of web applications, productivity systems, and developer tools built with modern full-stack architectures.
            </p>
          </div>

          {projects.length > 0 && (
            <div className="shrink-0">
              <span className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 text-xs font-bold text-[var(--muted)]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {projects.length} Active Builds
              </span>
            </div>
          )}
        </motion.div>

        {/* Minimalist Bento Cards Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id || `${project.title}-${index}`}
                project={project}
                index={index}
                onOpen={setSelectedProject}
              />
            ))}
          </div>
        ) : (
          <div className="panel rounded-xl py-14 text-center text-sm text-[var(--muted)]">
            <p>No projects available yet. Add some from your admin dashboard.</p>
          </div>
        )}
      </motion.div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedProject ? (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}