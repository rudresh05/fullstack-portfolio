"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Code2, GitFork, Layers3, Star, X } from "lucide-react";

import { subscribeProjects, type ManagedProject } from "@/lib/content-store";
import { cn } from "@/lib/utils";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, duration: 0.8, ease: EXPO_OUT },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EXPO_OUT } },
};

function formatDate(value?: string) {
  if (!value) return "Recent";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(value));
}

function ProjectCard({ project, onOpen, index }: { project: ManagedProject; onOpen: (project: ManagedProject) => void; index: number }) {
  const liveLink = project.link.includes("github.com") ? "" : project.link;
  
  // Use manual imageUrl if present, otherwise use a screenshot API for live links
  const displayImage = project.imageUrl || (liveLink ? `https://api.microlink.io?url=${encodeURIComponent(liveLink)}&screenshot=true&embed=screenshot.url` : "");

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
      whileHover={{ y: -6 }}
      className={cn("panel group flex cursor-pointer flex-col rounded-lg overflow-hidden transition sm:p-0", project.featured ? "md:col-span-7" : "md:col-span-5")}
    >
      {displayImage && (
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[var(--line)] bg-[var(--panel-strong)]">
          <img 
            src={displayImage} 
            alt={project.title}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <div className="flex flex-col p-5 sm:p-6 h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[#07110f]">
              <Code2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="accent-text truncate text-[11px] font-bold uppercase tracking-[0.16em]">{project.featured ? "Featured build" : "Project"}</p>
              <h3 className="mt-1 text-2xl font-black leading-tight text-[var(--text)] sm:text-3xl">{project.title}</h3>
            </div>
          </div>
          <span className="rounded-md border border-[var(--line)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
            {project.featured ? "Featured" : `0${index + 1}`}
          </span>
        </div>

        <p className="muted-text mt-5 line-clamp-3 text-sm leading-7">{project.description}</p>

        <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
          {[
            { label: "Stars", value: project.stars ?? 0, icon: Star },
            { label: "Forks", value: project.forks ?? 0, icon: GitFork },
            { label: "Updated", value: formatDate(project.updatedAt), icon: CalendarDays },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-md border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_62%,transparent)] px-3 py-3">
                <span className="muted-text flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {stat.label}
                </span>
                <strong className="mt-1 block truncate text-sm text-[var(--text)]">{stat.value}</strong>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {project.tech && project.tech.slice(0, 5).map((stack) => (
            <span key={stack} className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text)]">
              {stack}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-3 pt-7">
          <div className="flex gap-2">
            {liveLink ? (
              <a href={liveLink} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="btn-primary inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-black">
                <ArrowUpRight className="h-4 w-4" /> Live
              </a>
            ) : null}
            <a href={project.link} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="btn-secondary inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-black">
              <Code2 className="h-4 w-4" /> Source
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ProjectModal({ project, onClose }: { project: ManagedProject; onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-8 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.article
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.96 }}
        transition={{ duration: 0.28, ease: EXPO_OUT }}
        onClick={(event) => event.stopPropagation()}
        className="panel-strong w-full max-w-2xl rounded-lg p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="accent-text text-xs uppercase tracking-[0.24em]">Project Details</p>
            <h3 className="mt-3 text-3xl font-bold text-[var(--text)]">{project.title}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close project details" className="rounded-md border border-[var(--line)] p-2 text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="muted-text mt-5 text-sm leading-7">{project.description}</p>
        
        {project.tech && project.tech.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {project.tech.map((stack) => (
              <span key={stack} className="rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--text)]">
                {stack}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {project.link && !project.link.includes("github.com") && (
            <a href={project.link} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black">
              <ArrowUpRight className="h-4 w-4" /> View Live
            </a>
          )}
          <a href={project.link} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black">
            <Code2 className="h-4 w-4" /> Open Source
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

  const featuredCount = projects.filter((project) => project.featured).length;
  const totalStars = projects.reduce((total, project) => total + (project.stars ?? 0), 0);
  const totalForks = projects.reduce((total, project) => total + (project.forks ?? 0), 0);

  return (
    <section id="projects" className="relative overflow-hidden px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto w-full max-w-[calc(100vw-2rem)]">
        <motion.div variants={container} initial="show" animate="show">
          <motion.div variants={item} className="mb-5 grid gap-6 lg:grid-cols-[1fr_0.82fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#07110f]">
                <Layers3 className="h-4 w-4" /> Selected work
              </p>
              <h2 className="text-balance mt-4 max-w-2xl text-4xl font-black leading-tight text-[var(--text)] sm:text-5xl">Projects with useful ideas behind the polish.</h2>
              <p className="muted-text mt-4 max-w-2xl text-sm leading-7 sm:text-base">
                Curated portfolio projects with stack, activity, and direct links.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:grid-cols-2">
              {[
                { label: "Projects", value: projects.length },
                { label: "Featured", value: featuredCount },
                { label: "Stars", value: totalStars },
                { label: "Forks", value: totalForks },
              ].map((stat) => (
                <div key={stat.label} className="panel rounded-lg px-2 py-4 sm:px-3">
                  <strong className="block text-lg text-[var(--text)] sm:text-xl">{stat.value}</strong>
                  <span className="muted-text text-[10px] uppercase tracking-[0.14em] sm:text-[11px]">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
              {projects.map((project, index) => (
                <ProjectCard key={`${project.id}-${index}`} project={project} index={index} onOpen={setSelectedProject} />
              ))}
            </div>
          ) : (
            <div className="mt-12 text-center text-[var(--muted)]">
              <p>No projects available yet. Add some from your admin dashboard.</p>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>{selectedProject ? <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} /> : null}</AnimatePresence>
    </section>
  );
}