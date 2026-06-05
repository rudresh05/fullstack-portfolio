"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  addBlog,
  addProject,
  fetchSetting,
  saveSetting,
  removeBlog,
  removeProject,
  seedFirestoreDefaults,
  slugify,
  subscribeBlogs,
  subscribeProjects,
  type ManagedBlog,
  type ManagedProject,
  type ForHerContent,
} from "@/lib/content-store";
import { useAuth } from "@/components/providers/auth-provider";
import { CONTACT_INFO, EXPERIENCES, HERO_SETTINGS, NAV_LINKS, SKILL_GROUPS, SKILL_MARQUEE, SOCIAL_LINKS } from "@/constants";
import { 
  Plus, Trash2, Heart, Image as ImageIcon, History, Quote, Mail, 
  Save, Clock, BookOpen, Camera, Sparkles, LayoutGrid, User, 
  FileText, Briefcase, Settings2, Menu, X, ChevronRight, LogOut, Home, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const FOR_HER_DEFAULT: ForHerContent = {
  herName: "Her Name",
  tagline: "This page exists because of you",
  storyHeading: "Every chapter begins with you",
  storyBody: "Some stories don't have a single beginning. They unfold slowly, in moments you only recognise as important later. These are ours.",
  timeline: [
    { date: "Month DD, YYYY", title: "The day we met", desc: "I didn't know it then, but that was the day everything changed." },
    { date: "Month DD, YYYY", title: "The first time I knew", desc: "One moment — you know the one — where it all became absolutely clear." },
    { date: "Today", title: "Still here", desc: "Still choosing you. Still the best decision I ever made." }
  ],
  moments: [
    { title: "The beginning", text: "Write something beautiful about this moment.", img: "https://picsum.photos/seed/love1/600/840", caption: "The first chapter", date: "Month, YYYY" },
    { title: "That moment", text: "One specific moment where everything clicked.", img: "https://picsum.photos/seed/love2/600/840", caption: "When I knew", date: "Month, YYYY" },
    { title: "Just us", text: "A quiet evening, a laugh that turned into more.", img: "https://picsum.photos/seed/love3/600/840", caption: "Just us", date: "Month, YYYY" },
    { title: "Adventure", text: "Every place feels different with you.", img: "https://picsum.photos/seed/love4/600/840", caption: "Adventure", date: "Month, YYYY" },
    { title: "Always", text: "Here's to everything still ahead.", img: "https://picsum.photos/seed/love5/600/840", caption: "Us, always", date: "Month, YYYY" },
  ],
  letterDate: "June 2025",
  letterBody: [
    "There are people who come into your life and rearrange everything — quietly, without asking permission. You're that person for me.",
    "I don't always have the right words. I probably never will. But I know this: everything feels different with you around. Better. Lighter. More worth it.",
    "So this page is just me saying — in the only way I know how — that I see you. All of you. And I'm grateful, every single day."
  ],
  signature: "Your Name",
  quotes: [
    "In all the world, there is no heart for me like yours.",
    "Every moment with you is a favorite memory."
  ],
  portraitUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop"
};

type ProjectForm = {
  title: string;
  description: string;
  tech: string;
  link: string;
  imageUrl: string;
  featured: boolean;
};

type BlogForm = {
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
};

type StudioErrors = {
  project: Partial<Record<keyof ProjectForm, string>>;
  blog: Partial<Record<keyof BlogForm, string>>;
  settings: string[];
};

type SkillFormGroup = {
  group: string;
  skills: { name: string; level?: string; years?: string }[];
};

type SectionId = "general" | "resume" | "projects" | "blogs" | "sanctuary";

function ImagePicker({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const onPickImage = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text)]">{label}</label>
      {value ? (
        <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--bg-soft)]">
          <img src={value} alt={`${label} preview`} className="max-h-56 w-full object-cover" />
        </div>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={value.startsWith("data:") ? "Selected image from your device" : value}
          onChange={(event) => onChange(event.target.value)}
          disabled={value.startsWith("data:")}
          placeholder="Image URL, e.g. /rudresh.jpg"
          className="field disabled:opacity-60"
        />
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-500/15">
          Pick Image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => onPickImage(event.target.files?.[0])}
          />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-md border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/15"
          >
            Remove
          </button>
        ) : null}
      </div>
      {hint ? <p className="text-xs muted-text">{hint}</p> : null}
    </div>
  );
}

const projectInitial: ProjectForm = {
  title: "",
  description: "",
  tech: "",
  link: "",
  imageUrl: "",
  featured: false,
};

const blogInitial: BlogForm = {
  title: "",
  excerpt: "",
  content: "",
  date: "",
  readTime: "5 min read",
};

const emptyErrors: StudioErrors = {
  project: {},
  blog: {},
  settings: [],
};

const defaultSkillGroups = (): SkillFormGroup[] =>
  Object.entries(SKILL_GROUPS).map(([group, skills]) => ({
    group,
    skills: skills.map((skill) => ({ ...skill })),
  }));

const toSkillGroupForm = (value: unknown): SkillFormGroup[] => {
  if (Array.isArray(value)) return value as SkillFormGroup[];
  if (!value || typeof value !== "object") return defaultSkillGroups();

  return Object.entries(value as Record<string, { name: string; level?: string; years?: string }[]>).map(([group, skills]) => ({
    group,
    skills: Array.isArray(skills) ? skills.map((skill) => ({ ...skill })) : [],
  }));
};

const toSkillGroupSetting = (groups: SkillFormGroup[]) =>
  Object.fromEntries(
    groups
      .map((group) => [
        group.group.trim(),
        group.skills
          .map((skill) => ({
            name: skill.name.trim(),
            level: skill.level?.trim(),
            years: skill.years?.trim(),
          }))
          .filter((skill) => skill.name),
      ])
      .filter(([group]) => Boolean(group)),
  );

export default function StudioPage() {
  const router = useRouter();
  const { user, loading, isAdmin, configured, logout } = useAuth();
  
  // Dashboard State
  const [activeSection, setActiveSection] = useState<SectionId>("general");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Content State
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [blogs, setBlogs] = useState<ManagedBlog[]>([]);
  const [projectForm, setProjectForm] = useState<ProjectForm>(projectInitial);
  const [blogForm, setBlogForm] = useState<BlogForm>(blogInitial);
  const [formErrors, setFormErrors] = useState<StudioErrors>(emptyErrors);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  
  // Settings State
  const [navLinks, setNavLinks] = useState<{ label: string; href: string }[]>(() => NAV_LINKS.map((link) => ({ ...link })));
  const [socialLinks, setSocialLinks] = useState<{ label: string; href: string; icon?: string }[]>(() => SOCIAL_LINKS.map((link) => ({ ...link })));
  const [skillMarquee, setSkillMarquee] = useState<{ name: string; level?: string; years?: string }[]>(() => SKILL_MARQUEE.map((skill) => ({ ...skill })));
  const [skillGroups, setSkillGroups] = useState<SkillFormGroup[]>(defaultSkillGroups);
  const [experiences, setExperiences] = useState<{ title: string; company: string; dateRange: string; achievements: string[] }[]>(() =>
    EXPERIENCES.map((experience) => ({ ...experience, achievements: [...experience.achievements] })),
  );
  const [contactInfo, setContactInfo] = useState<{ email?: string; message?: string }>({ ...CONTACT_INFO });
  const [heroSettings, setHeroSettings] = useState<{ imageUrl?: string }>({ ...HERO_SETTINGS });
  const [forHerContent, setForHerContent] = useState<ForHerContent>(FOR_HER_DEFAULT);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/login");
    }
  }, [isAdmin, loading, router, user]);

  useEffect(() => {
    const unsubProjects = subscribeProjects(setProjects);
    const unsubBlogs = subscribeBlogs(setBlogs);
    
    // load site settings
    fetchSetting("nav_links", NAV_LINKS.map((link) => ({ ...link }))).then((v) => setNavLinks(v ?? []));
    fetchSetting("social_links", SOCIAL_LINKS.map((link) => ({ ...link }))).then((v) => setSocialLinks(v ?? []));
    fetchSetting("skill_marquee", SKILL_MARQUEE.map((skill) => ({ ...skill }))).then((v) => setSkillMarquee(v ?? []));
    fetchSetting("skill_groups", SKILL_GROUPS).then((v) => setSkillGroups(toSkillGroupForm(v)));
    fetchSetting("experiences", EXPERIENCES.map((experience) => ({ ...experience, achievements: [...experience.achievements] }))).then((v) => setExperiences(v ?? []));
    fetchSetting("contact_info", { ...CONTACT_INFO }).then((v) => setContactInfo(v ?? {}));
    fetchSetting("hero_settings", { ...HERO_SETTINGS }).then((v) => setHeroSettings(v ?? {}));
    fetchSetting<ForHerContent>("for_her_content", FOR_HER_DEFAULT).then((v) => setForHerContent(v ?? FOR_HER_DEFAULT));
    
    return () => {
      unsubProjects();
      unsubBlogs();
    };
  }, []);

  useEffect(() => {
    if (!configured || !isAdmin) return;
    seedFirestoreDefaults().catch(() => {});
  }, [configured, isAdmin]);

  const onAddProject = async (event: FormEvent) => {
    event.preventDefault();
    const projectErrors: StudioErrors["project"] = {};
    const payload = {
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      tech: projectForm.tech.split(",").map((v) => v.trim()).filter(Boolean),
      link: projectForm.link.trim() || "#",
      imageUrl: projectForm.imageUrl.trim(),
      featured: projectForm.featured,
    };

    if (!payload.title) projectErrors.title = "Project title is required.";
    if (!payload.description) projectErrors.description = "Project description is required.";

    setFormErrors((current) => ({ ...current, project: projectErrors }));
    if (Object.keys(projectErrors).length > 0) return;

    try {
      setBusy(true);
      setError("");
      setNotice("");
      await addProject(payload);
      setProjectForm(projectInitial);
      setNotice("Project added successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to add project right now.");
    } finally {
      setBusy(false);
    }
  };

  const onAddBlog = async (event: FormEvent) => {
    event.preventDefault();
    const blogErrors: StudioErrors["blog"] = {};
    const payload = {
      slug: slugify(blogForm.title),
      title: blogForm.title.trim(),
      excerpt: blogForm.excerpt.trim(),
      content: blogForm.content.trim() || blogForm.excerpt.trim(),
      date: blogForm.date || new Date().toISOString().slice(0, 10),
      readTime: blogForm.readTime.trim() || "5 min read",
    };

    if (!payload.title) blogErrors.title = "Blog title is required.";
    if (!payload.excerpt) blogErrors.excerpt = "Blog excerpt is required.";
    if (blogForm.date && Number.isNaN(new Date(blogForm.date).getTime())) {
      blogErrors.date = "Choose a valid date.";
    }

    setFormErrors((current) => ({ ...current, blog: blogErrors }));
    if (Object.keys(blogErrors).length > 0) return;

    try {
      setBusy(true);
      setError("");
      setNotice("");
      await addBlog(payload);
      setBlogForm(blogInitial);
      setNotice("Blog added successfully.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to add blog right now.");
    } finally {
      setBusy(false);
    }
  };

  const onRemoveProject = async (id: string) => {
    try {
      setBusy(true);
      setError("");
      setNotice("");
      await removeProject(id);
      setNotice("Project deleted.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete project right now.");
    } finally {
      setBusy(false);
    }
  };

  const onRemoveBlog = async (id: string) => {
    try {
      setBusy(true);
      setError("");
      setNotice("");
      await removeBlog(id);
      setNotice("Blog deleted.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete blog right now.");
    } finally {
      setBusy(false);
    }
  };

  const validateSettings = () => {
    const settingsErrors: string[] = [];
    navLinks.forEach((link, index) => {
      if (!link.label.trim()) settingsErrors.push(`Navigation link ${index + 1} needs a label.`);
    });
    setFormErrors((current) => ({ ...current, settings: settingsErrors }));
    return settingsErrors.length === 0;
  };

  if (loading || !user || !isAdmin) {
    return (
      <main className="mx-auto flex min-h-[65vh] w-full max-w-[calc(100vw-2rem)] items-center justify-center px-6">
        <p className="text-sm muted-text">Checking access...</p>
      </main>
    );
  }

  const navItems = [
    { id: "general", label: "General Settings", icon: Settings2 },
    { id: "resume", label: "Resume & Skills", icon: Briefcase },
    { id: "projects", label: "Projects", icon: LayoutGrid },
    { id: "blogs", label: "Blogs", icon: FileText },
    { id: "sanctuary", label: "Private Sanctuary", icon: Heart },
  ] as const;

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] w-64 transform border-r border-[var(--line)] bg-[var(--panel-strong)] transition-transform duration-300 ease-in-out md:static md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-[var(--line)] px-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-black btn-primary mr-3">RP</span>
            <span className="text-sm font-black tracking-tight text-[var(--text)]">STUDIO PANEL</span>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-bold transition-all",
                    activeSection === item.id 
                      ? "bg-[var(--accent)] text-[#07110f] shadow-lg shadow-emerald-500/10" 
                      : "text-[var(--text)] opacity-60 hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)] hover:opacity-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-[var(--line)] p-4 space-y-2">
            <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-black opacity-60 hover:opacity-100">
              <Home className="h-4 w-4" /> Go to Website
            </Link>
            <button onClick={() => logout()} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-black text-red-400 opacity-60 hover:opacity-100">
              <LogOut className="h-4 w-4" /> Logout Session
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[var(--bg)/80] px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text)]">
              {navItems.find(i => i.id === activeSection)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {notice && <span className="hidden text-xs font-bold text-emerald-400 sm:inline">{notice}</span>}
            <button 
              disabled={busy}
              onClick={async () => {
                if (!validateSettings()) return;
                try {
                  setBusy(true); setError(""); setNotice("");
                  if (activeSection === "sanctuary") {
                    await saveSetting("for_her_content", forHerContent);
                  } else {
                    await saveSetting("nav_links", navLinks);
                    await saveSetting("social_links", socialLinks);
                    await saveSetting("skill_marquee", skillMarquee);
                    await saveSetting("skill_groups", toSkillGroupSetting(skillGroups));
                    await saveSetting("experiences", experiences);
                    await saveSetting("contact_info", contactInfo);
                    await saveSetting("hero_settings", heroSettings);
                  }
                  setNotice("Saved successfully.");
                  setTimeout(() => setNotice(""), 3000);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Unable to save.");
                } finally { setBusy(false); }
              }}
              className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-black text-[#07110f] hover:translate-y-[-1px] transition-transform"
            >
              {busy ? <Clock className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {busy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        <div className="p-6 md:p-10">
          {error && <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

          {/* Section: General Settings */}
          {activeSection === "general" && (
            <div className="max-w-4xl space-y-10">
              <section className="space-y-6">
                 <div>
                    <h3 className="text-lg font-black text-[var(--text)]">Navigation & Brand</h3>
                    <p className="text-sm muted-text">Manage the global navigation and hero image.</p>
                 </div>
                 
                 <div className="panel rounded-lg p-5 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-tighter opacity-40">Main Navigation</label>
                      {navLinks.map((n, i) => (
                        <div key={i} className="flex gap-2">
                          <input value={n.label} onChange={(e) => setNavLinks((s) => s.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Label" className="w-1/3 field text-xs" />
                          <input value={n.href} onChange={(e) => setNavLinks((s) => s.map((x, idx) => idx === i ? { ...x, href: e.target.value } : x))} placeholder="Href" className="flex-1 field text-xs" />
                          <button onClick={() => setNavLinks((s) => s.filter((_, idx) => idx !== i))} className="text-red-400 p-2"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                      <button onClick={() => setNavLinks((s) => [...s, { label: "New", href: "#" }])} className="text-xs font-black accent-text">+ Add Link</button>
                    </div>
                 </div>

                 <div className="panel rounded-lg p-5">
                    <ImagePicker label="Hero Profile Image" value={heroSettings.imageUrl || ""} onChange={(imageUrl) => setHeroSettings((s) => ({ ...s, imageUrl }))} />
                 </div>
              </section>

              <section className="space-y-6">
                <div>
                   <h3 className="text-lg font-black text-[var(--text)]">Socials & Contact</h3>
                   <p className="text-sm muted-text">Public contact info and social media presence.</p>
                </div>
                <div className="panel rounded-lg p-5 space-y-4">
                   <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-tighter opacity-40">Social Presence</label>
                    {socialLinks.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={s.label} onChange={(e) => setSocialLinks((a) => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Label" className="w-1/4 field text-xs" />
                        <input value={s.href} onChange={(e) => setSocialLinks((a) => a.map((x, idx) => idx === i ? { ...x, href: e.target.value } : x))} placeholder="Link" className="flex-1 field text-xs" />
                        <input value={s.icon || ""} onChange={(e) => setSocialLinks((a) => a.map((x, idx) => idx === i ? { ...x, icon: e.target.value } : x))} placeholder="Icon" className="w-1/5 field text-xs" />
                        <button onClick={() => setSocialLinks((a) => a.filter((_, idx) => idx !== i))} className="text-red-400 p-2"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => setSocialLinks((s) => [...s, { label: "Github", href: "#", icon: "github" }])} className="text-xs font-black accent-text">+ Add Social</button>
                  </div>
                </div>
                <div className="panel rounded-lg p-5 grid gap-4">
                   <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-tighter opacity-40">Contact Email</label>
                    <input value={contactInfo.email || ""} onChange={(e) => setContactInfo((s) => ({ ...s, email: e.target.value }))} className="field text-xs" />
                   </div>
                   <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-tighter opacity-40">Contact Description</label>
                    <textarea value={contactInfo.message || ""} onChange={(e) => setContactInfo((s) => ({ ...s, message: e.target.value }))} rows={3} className="field text-xs" />
                   </div>
                </div>
              </section>
            </div>
          )}

          {/* Section: Resume & Skills */}
          {activeSection === "resume" && (
            <div className="max-w-4xl space-y-10">
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[var(--text)]">Professional Skills</h3>
                    <p className="text-sm muted-text">Manage your technical stack and marquee skills.</p>
                  </div>
                </div>
                
                <div className="panel rounded-lg p-5">
                   <label className="text-xs font-black uppercase tracking-tighter opacity-40 mb-3 block">Skill Marquee (Rotating list)</label>
                   <div className="space-y-2">
                    {skillMarquee.map((sk, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={sk.name} onChange={(e) => setSkillMarquee((a) => a.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Name" className="flex-1 field text-xs" />
                        <button onClick={() => setSkillMarquee((a) => a.filter((_, idx) => idx !== i))} className="text-red-400 p-2"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => setSkillMarquee((s) => [...s, { name: "New Skill" }])} className="text-xs font-black accent-text">+ Add Item</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-tighter opacity-40 block">Skill Categories</label>
                  {skillGroups.map((group, gi) => (
                    <div key={gi} className="panel rounded-lg p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <input value={group.group} onChange={(e) => setSkillGroups((s) => s.map((g, idx) => idx === gi ? { ...g, group: e.target.value } : g))} className="flex-1 field font-black" />
                        <button onClick={() => setSkillGroups((s) => s.filter((_, idx) => idx !== gi))} className="text-xs font-black text-red-400">Delete Category</button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.skills.map((sk, si) => (
                          <div key={si} className="flex gap-2 bg-[var(--bg-soft)] p-2 rounded-md border border-[var(--line)]">
                            <input value={sk.name} onChange={(e) => setSkillGroups((s) => s.map((g, gi2) => gi2 === gi ? { ...g, skills: g.skills.map((x, idx) => idx === si ? { ...x, name: e.target.value } : x) } : g))} placeholder="Skill" className="flex-1 bg-transparent outline-none text-xs text-[var(--text)]" />
                            <button onClick={() => setSkillGroups((s) => s.map((g, gi2) => gi2 === gi ? { ...g, skills: g.skills.filter((_, idx) => idx !== si) } : g))} className="text-red-400"><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                        <button onClick={() => setSkillGroups((s) => s.map((g, gi2) => gi2 === gi ? { ...g, skills: [...g.skills, { name: "New Skill" }] } : g))} className="text-[10px] font-black uppercase accent-text border border-dashed border-[var(--accent)]/30 rounded-md p-2">+ Add Skill</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setSkillGroups((s) => [...s, { group: "New Category", skills: [] }])} className="w-full rounded-md border border-dashed border-[var(--line)] p-4 text-xs font-black opacity-60 hover:opacity-100 transition-opacity">
                    + Add New Category
                  </button>
                </div>
              </section>

              <section className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-[var(--text)]">Work Experience</h3>
                  <p className="text-sm muted-text">Detailed career timeline.</p>
                </div>
                <div className="space-y-4">
                   {experiences.map((ex, ei) => (
                    <div key={ei} className="panel rounded-lg p-5 space-y-4">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input value={ex.title} onChange={(e) => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, title: e.target.value } : x))} placeholder="Job Title" className="field text-xs font-bold sm:col-span-1" />
                        <input value={ex.company} onChange={(e) => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, company: e.target.value } : x))} placeholder="Company" className="field text-xs sm:col-span-1" />
                        <input value={ex.dateRange} onChange={(e) => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, dateRange: e.target.value } : x))} placeholder="Dates" className="field text-xs sm:col-span-1" />
                      </div>
                      <div className="space-y-2">
                        {ex.achievements.map((ach, ai) => (
                          <div key={ai} className="flex gap-2">
                            <input value={ach} onChange={(e) => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, achievements: x.achievements.map((a, j) => j === ai ? e.target.value : a) } : x))} className="flex-1 field text-xs" />
                            <button onClick={() => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, achievements: x.achievements.filter((_, j) => j !== ai) } : x))} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        ))}
                        <button onClick={() => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, achievements: [...x.achievements, "New achievement"] } : x))} className="text-[10px] font-black uppercase accent-text">+ Add Point</button>
                      </div>
                      <button onClick={() => setExperiences((s) => s.filter((_, idx) => idx !== ei))} className="text-xs font-black text-red-400 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Remove Role</button>
                    </div>
                  ))}
                  <button onClick={() => setExperiences((s) => [...s, { title: "New Role", company: "Company", dateRange: "", achievements: [] }])} className="w-full rounded-md border border-dashed border-[var(--line)] p-4 text-xs font-black opacity-60 hover:opacity-100 transition-opacity">
                    + Add New Role
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* Section: Projects */}
          {activeSection === "projects" && (
            <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
               <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-[var(--text)]">Add New Project</h3>
                    <p className="text-sm muted-text">Enter details to add a project to your portfolio.</p>
                  </div>
                  <form onSubmit={onAddProject} className="panel rounded-lg p-6 space-y-4">
                    <input className="field text-sm" placeholder="Project Title" value={projectForm.title} onChange={(e) => setProjectForm((s) => ({ ...s, title: e.target.value }))} />
                    <textarea className="field text-sm" placeholder="Description" rows={3} value={projectForm.description} onChange={(e) => setProjectForm((s) => ({ ...s, description: e.target.value }))} />
                    <input className="field text-sm" placeholder="Tech (comma separated)" value={projectForm.tech} onChange={(e) => setProjectForm((s) => ({ ...s, tech: e.target.value }))} />
                    <input className="field text-sm" placeholder="Direct Link" value={projectForm.link} onChange={(e) => setProjectForm((s) => ({ ...s, link: e.target.value }))} />
                    <ImagePicker label="Screenshot" value={projectForm.imageUrl} onChange={(imageUrl) => setProjectForm((s) => ({ ...s, imageUrl }))} />
                    <label className="flex items-center gap-3 text-xs font-black uppercase text-[var(--text)]">
                      <input type="checkbox" checked={projectForm.featured} onChange={(e) => setProjectForm((s) => ({ ...s, featured: e.target.checked }))} className="h-4 w-4 rounded border-[var(--line)] bg-[var(--bg-soft)] text-[var(--accent)]" />
                      Featured Project
                    </label>
                    <button disabled={busy} className="btn-primary w-full py-3 text-sm font-black disabled:opacity-60">Add to Portfolio</button>
                  </form>
               </div>
               <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-40">Existing Projects</h3>
                  <div className="space-y-2">
                    {projects.map((item) => (
                      <div key={item.id} className="group flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] p-3 transition-colors hover:border-[var(--accent)]/30">
                        <span className="text-xs font-bold text-[var(--text)] truncate mr-2">{item.title}</span>
                        <button onClick={() => onRemoveProject(item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {/* Section: Blogs */}
          {activeSection === "blogs" && (
            <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
               <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-[var(--text)]">Draft New Article</h3>
                    <p className="text-sm muted-text">Write and publish a new blog post.</p>
                  </div>
                  <form onSubmit={onAddBlog} className="panel rounded-lg p-6 space-y-4">
                    <input className="field text-sm font-bold" placeholder="Article Title" value={blogForm.title} onChange={(e) => setBlogForm((s) => ({ ...s, title: e.target.value }))} />
                    <textarea className="field text-sm" placeholder="Excerpt (Short summary)" rows={2} value={blogForm.excerpt} onChange={(e) => setBlogForm((s) => ({ ...s, excerpt: e.target.value }))} />
                    <textarea className="field text-sm font-mono" placeholder="Full Markdown Content" rows={12} value={blogForm.content} onChange={(e) => setBlogForm((s) => ({ ...s, content: e.target.value }))} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input type="date" className="field text-xs" value={blogForm.date} onChange={(e) => setBlogForm((s) => ({ ...s, date: e.target.value }))} />
                      <input className="field text-xs" placeholder="Read time (e.g. 8 min read)" value={blogForm.readTime} onChange={(e) => setBlogForm((s) => ({ ...s, readTime: e.target.value }))} />
                    </div>
                    <button disabled={busy} className="btn-primary w-full py-3 text-sm font-black disabled:opacity-60">Publish Article</button>
                  </form>
               </div>
               <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-40">Published Logs</h3>
                  <div className="space-y-2">
                    {blogs.map((item) => (
                      <div key={item.id} className="group flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] p-3 transition-colors hover:border-[var(--accent)]/30">
                        <span className="text-xs font-bold text-[var(--text)] truncate mr-2">{item.title}</span>
                        <button onClick={() => onRemoveBlog(item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {/* Section: Private Sanctuary */}
          {activeSection === "sanctuary" && (
            <div className="max-w-5xl space-y-8">
               <div className="flex items-center gap-4 border-b border-pink-500/20 pb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-400 shadow-inner">
                    <Heart className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-[var(--text)]">Sanctuary Editor</h2>
                    <p className="text-sm muted-text">Curate your private memories and messages.</p>
                  </div>
               </div>

               <div className="grid gap-8">
                  <div className="panel rounded-xl p-6 space-y-6 bg-gradient-to-br from-pink-500/[0.03] to-transparent">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-pink-400">Her Name</label>
                        <input value={forHerContent.herName} onChange={e => setForHerContent(s => ({ ...s, herName: e.target.value }))} className="field text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-pink-400">Hero Tagline</label>
                        <input value={forHerContent.tagline} onChange={e => setForHerContent(s => ({ ...s, tagline: e.target.value }))} className="field text-sm" />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-pink-400">Story Header</label>
                        <input value={forHerContent.storyHeading} onChange={e => setForHerContent(s => ({ ...s, storyHeading: e.target.value }))} className="field text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-pink-400">Story Narrative</label>
                        <textarea value={forHerContent.storyBody} onChange={e => setForHerContent(s => ({ ...s, storyBody: e.target.value }))} rows={2} className="field text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><History className="h-4 w-4" /> Timeline Events</h3>
                      <button onClick={() => setForHerContent(s => ({ ...s, timeline: [...s.timeline, { date: "New Date", title: "New Memory", desc: "Short description" }] }))} className="text-xs font-black text-pink-400">+ Add Moment</button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {forHerContent.timeline.map((item, i) => (
                        <div key={i} className="panel rounded-lg p-5 space-y-3 relative">
                           <div className="flex gap-2">
                              <input value={item.date} onChange={e => setForHerContent(s => ({ ...s, timeline: s.timeline.map((x, idx) => idx === i ? { ...x, date: e.target.value } : x) }))} className="w-1/3 field text-xs" />
                              <input value={item.title} onChange={e => setForHerContent(s => ({ ...s, timeline: s.timeline.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x) }))} className="flex-1 field text-xs font-bold" />
                           </div>
                           <textarea value={item.desc} onChange={e => setForHerContent(s => ({ ...s, timeline: s.timeline.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x) }))} rows={2} className="field text-xs opacity-70" />
                           <button onClick={() => setForHerContent(s => ({ ...s, timeline: s.timeline.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><Camera className="h-4 w-4" /> Visual Gallery</h3>
                      <button onClick={() => setForHerContent(s => ({ ...s, moments: [...s.moments, { title: "Title", text: "Story", img: "", caption: "Caption", date: "Date" }] }))} className="text-xs font-black text-pink-400">+ Add Photo</button>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {forHerContent.moments.map((item, i) => (
                        <div key={i} className="panel rounded-lg p-5 space-y-4">
                           <ImagePicker label={`Frame ${i+1}`} value={item.img} onChange={img => setForHerContent(s => ({ ...s, moments: s.moments.map((x, idx) => idx === i ? { ...x, img } : x) }))} />
                           <input value={item.caption} onChange={e => setForHerContent(s => ({ ...s, moments: s.moments.map((x, idx) => idx === i ? { ...x, caption: e.target.value } : x) }))} placeholder="Front Caption" className="field text-xs" />
                           <textarea value={item.text} onChange={e => setForHerContent(s => ({ ...s, moments: s.moments.map((x, idx) => idx === i ? { ...x, text: e.target.value } : x) }))} rows={2} placeholder="Backside Story" className="field text-xs opacity-70" />
                           <button onClick={() => setForHerContent(s => ({ ...s, moments: s.moments.filter((_, idx) => idx !== i) }))} className="w-full text-xs font-black text-red-400 bg-red-400/10 rounded-md py-2 transition-colors hover:bg-red-400/20">Delete Frame</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><FileText className="h-4 w-4" /> Personal Letter</h3>
                      <div className="panel rounded-lg p-5 space-y-4">
                        <input value={forHerContent.letterDate} onChange={e => setForHerContent(s => ({ ...s, letterDate: e.target.value }))} className="field text-xs opacity-50" />
                        <textarea value={forHerContent.letterBody.join("\n\n")} onChange={e => setForHerContent(s => ({ ...s, letterBody: e.target.value.split("\n\n").filter(Boolean) }))} rows={10} className="field text-sm italic" />
                        <input value={forHerContent.signature} onChange={e => setForHerContent(s => ({ ...s, signature: e.target.value }))} className="field text-sm font-black text-right" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><Quote className="h-4 w-4" /> Closing Archive</h3>
                      <div className="panel rounded-lg p-5 space-y-4">
                        {forHerContent.quotes.map((q, i) => (
                          <div key={i} className="flex gap-2">
                            <textarea value={q} onChange={e => setForHerContent(s => ({ ...s, quotes: s.quotes.map((x, idx) => idx === i ? e.target.value : x) }))} rows={2} className="field text-xs italic" />
                            <button onClick={() => setForHerContent(s => ({ ...s, quotes: s.quotes.filter((_, idx) => idx !== i) }))} className="text-red-400 p-2"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        ))}
                        <button onClick={() => setForHerContent(s => ({ ...s, quotes: [...s.quotes, "New Quote"] }))} className="text-xs font-black accent-text">+ Add Quote</button>
                      </div>
                      <div className="mt-8">
                         <h3 className="text-sm font-black uppercase tracking-widest opacity-40 mb-4">Atmosphere</h3>
                         <div className="panel rounded-lg p-5">
                            <ImagePicker label="Ghost Background Portrait" value={forHerContent.portraitUrl} onChange={portraitUrl => setForHerContent(s => ({ ...s, portraitUrl }))} />
                         </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
