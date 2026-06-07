"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Code2, GitFork, Layers3, Star, X } from "lucide-react";

import { PROJECTS } from "@/constants";
import { subscribeProjects, type ManagedProject, slugify } from "@/lib/content-store";
import { cn } from "@/lib/utils";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const GITHUB_REPOS_URL = "https://api.github.com/users/rudresh05/repos?per_page=100&sort=updated";

type GitHubRepo = {
  name: string;
  html_url: string;
  homepage?: string | null;
  description?: string | null;
  fork: boolean;
  language?: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics?: string[];
  size: number;
};

const curatedDescriptions: Record<string, string> = {
  CampusCircle: "A campus community product focused on student collaboration, updates, and peer connections.",
  "fullstack-portfolio": "A modern portfolio codebase built with a typed React stack and production-ready layout patterns.",
  "rudresh05.github.io": "Personal GitHub Pages site for showcasing profile links, project work, and contact details.",
  Tree_Data_Structure: "Java implementations and exercises for core tree traversal, recursion, and data-structure practice.",
  Recursion: "A focused Java practice repository for recursion patterns, problem solving, and fundamentals.",
  Learn_Kotlin_Basics: "Kotlin fundamentals and syntax practice for Android-ready application development.",
  "Atmospheric-Intelligence-App": "A sleek and minimalistic Weather App built using Kotlin and Retrofit for Android.",
  music_app: "A simple Android Music Player app built with Kotlin that lets you play, pause, and navigate songs with a clean UI.",
  PathAI: "Your AI-Powered Learning Path generator, helping students navigate complex subjects with ease.",
  "focus-os": "The strategic execution workstation for professional goal tracking and high-integrity delivery.",
};

const languageTech: Record<string, string[]> = {
  TypeScript: ["TypeScript", "React", "Next.js"],
  JavaScript: ["JavaScript", "HTML", "CSS"],
  Java: ["Java", "DSA", "Algorithms"],
  Kotlin: ["Kotlin", "Android", "Mobile"],
  Python: ["Python", "AI/ML", "Automation"],
  HTML: ["HTML", "CSS", "JavaScript"],
  null: ["Software", "Development", "Open Source"],
};

const fallbackProjects: ManagedProject[] = PROJECTS.map((project, index) => ({
  id: `fallback-${slugify(project.title)}-${index + 1}`,
  title: project.title,
  description: project.description,
  tech: [...project.tech],
  link: project.link,
  imageUrl: project.imageUrl,
  featured: project.featured,
  stars: project.stars,
  forks: project.forks,
  updatedAt: project.updatedAt,
  repoName: project.repoName,
}));

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

function titleFromRepo(name: string) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bGithub\b/g, "GitHub");
}

function formatDate(value?: string) {
  if (!value) return "Recent";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(value));
}

function getRepoName(project: ManagedProject) {
  if (project.repoName) return project.repoName;
  const match = project.link.match(/github\.com\/rudresh05\/([^/?#]+)/i);
  return match?.[1] ?? project.title;
}

function mapRepoToProject(repo: GitHubRepo, index: number): ManagedProject {
  const repoTech = repo.topics?.length 
    ? repo.topics.map(titleFromRepo).slice(0, 4) 
    : languageTech[repo.language ?? "null"] ?? [repo.language ?? "Repository"];

  return {
    id: `github-${slugify(repo.name)}`,
    title: titleFromRepo(repo.name),
    description:
      repo.description ??
      curatedDescriptions[repo.name] ??
      `${titleFromRepo(repo.name)} is a public GitHub project built around ${repo.language ?? "software"} practice and delivery.`,
    tech: repoTech,
    link: repo.homepage || repo.html_url,
    featured: index < 2 || repo.stargazers_count > 5,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    repoName: repo.name,
  };
}

function mergeProjects(baseProjects: ManagedProject[], githubProjects: ManagedProject[]) {
  const byRepo = new Map<string, ManagedProject>();

  [...baseProjects, ...githubProjects].forEach((project) => {
    const key = getRepoName(project).toLowerCase();
    const existing = byRepo.get(key);
    byRepo.set(key, {
      ...project,
      ...existing,
      description: existing?.description || project.description,
      tech: existing?.tech?.length ? existing.tech : project.tech,
      stars: project.stars ?? existing?.stars,
      forks: project.forks ?? existing?.forks,
      updatedAt: project.updatedAt ?? existing?.updatedAt,
      repoName: project.repoName ?? existing?.repoName,
    });
  });

  return Array.from(byRepo.values()).sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
  });
}

async function fetchGithubProjects() {
  const response = await fetch(GITHUB_REPOS_URL, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!response.ok) throw new Error("GitHub projects could not be loaded.");

  const repos = (await response.json()) as GitHubRepo[];
  
  // Filter out:
  // 1. Forks
  // 2. Repos with 0 size
  // 3. Repos without description that aren't in our curated list
  // 4. The user's profile README repository (rudresh05/rudresh05)
  // 5. Specific projects the user wants removed
  return repos
    .filter((repo) => {
      const isProfileRepo = repo.name.toLowerCase() === "rudresh05";
      const hasDescription = repo.description || curatedDescriptions[repo.name];
      const isSubstantial = repo.size > 0;
      const isExcluded = ["Farmer Merchant Integration", "Solar System", "Solar-System"].some(
        (title) => repo.name.toLowerCase() === title.toLowerCase().replace(/\s+/g, "-") || repo.name === title
      );
      
      return !repo.fork && !isProfileRepo && hasDescription && isSubstantial && !isExcluded;
    })
    .map(mapRepoToProject);
}

function ProjectCard({ project, onOpen, index }: { project: ManagedProject; onOpen: (project: ManagedProject) => void; index: number }) {
  const repoName = getRepoName(project);
  const liveLink = project.link.includes("github.com") ? "" : project.link;

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
      className={cn("panel group flex cursor-pointer flex-col rounded-lg p-5 transition sm:p-6", project.featured ? "md:col-span-7" : "md:col-span-5")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[#07110f]">
            <Code2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="accent-text truncate text-[11px] font-bold uppercase tracking-[0.16em]">{project.featured ? "Featured build" : "Repository"}</p>
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
        {project.tech.slice(0, 5).map((stack) => (
          <span key={stack} className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text)]">
            {stack}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-7">
        <span className="muted-text truncate text-xs">rudresh05/{repoName}</span>
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
    </motion.article>
  );
}

function ProjectModal({ project, onClose }: { project: ManagedProject; onClose: () => void }) {
  const repoName = getRepoName(project);

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
            <p className="accent-text text-xs uppercase tracking-[0.24em]">GitHub Project</p>
            <h3 className="mt-3 text-3xl font-bold text-[var(--text)]">{project.title}</h3>
            <p className="muted-text mt-2 text-sm">rudresh05/{repoName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close project details" className="rounded-md border border-[var(--line)] p-2 text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="muted-text mt-5 text-sm leading-7">{project.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {project.tech.map((stack) => (
            <span key={stack} className="rounded-md border border-[var(--line)] px-2 py-1 text-xs text-[var(--text)]">
              {stack}
            </span>
          ))}
        </div>

        <a href={project.link} target="_blank" rel="noreferrer" className="btn-primary mt-8 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black">
          <Code2 className="h-4 w-4" /> Open Repository
        </a>
      </motion.article>
    </motion.div>
  );
}

export default function ProjectGrid() {
  const [baseProjects, setBaseProjects] = useState<ManagedProject[]>([]);
  const [githubProjects, setGithubProjects] = useState<ManagedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ManagedProject | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeProjects(setBaseProjects);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchGithubProjects()
      .then((projects) => {
        if (mounted) setGithubProjects(projects);
      })
      .catch(() => {
        if (mounted) setGithubProjects([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const projects = useMemo(() => {
    const merged = mergeProjects(baseProjects, githubProjects);
    const finalProjects = merged.length ? merged : fallbackProjects;
    
    // Final exclusion list for titles
    const excludedTitles = ["Farmer Merchant Integration", "Solar System"];
    return finalProjects.filter(p => !excludedTitles.some(title => p.title.toLowerCase() === title.toLowerCase()));
  }, [baseProjects, githubProjects]);
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
                Live GitHub work shaped into a portfolio view with stack, activity, and direct source links.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:grid-cols-2">
              {[
                { label: "Repos", value: projects.length },
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {projects.map((project, index) => (
              <ProjectCard key={`${project.id}-${project.link}`} project={project} index={index} onOpen={setSelectedProject} />
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>{selectedProject ? <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} /> : null}</AnimatePresence>
    </section>
  );
}
