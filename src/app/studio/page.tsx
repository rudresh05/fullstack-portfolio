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
} from "@/lib/content-store";
import { useAuth } from "@/components/providers/auth-provider";
import { CONTACT_INFO, EXPERIENCES, HERO_SETTINGS, NAV_LINKS, SKILL_GROUPS, SKILL_MARQUEE, SOCIAL_LINKS } from "@/constants";

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
      <label className="block text-sm font-medium text-zinc-200">{label}</label>
      {value ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
          <img src={value} alt={`${label} preview`} className="max-h-56 w-full object-cover" />
        </div>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={value.startsWith("data:") ? "Selected image from your device" : value}
          onChange={(event) => onChange(event.target.value)}
          disabled={value.startsWith("data:")}
          placeholder="Image URL, e.g. /rudresh.jpg"
          className="w-full rounded-md border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 disabled:text-zinc-500"
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
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
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
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [blogs, setBlogs] = useState<ManagedBlog[]>([]);
  const [projectForm, setProjectForm] = useState<ProjectForm>(projectInitial);
  const [blogForm, setBlogForm] = useState<BlogForm>(blogInitial);
  const [formErrors, setFormErrors] = useState<StudioErrors>(emptyErrors);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [navLinks, setNavLinks] = useState<{ label: string; href: string }[]>(() => NAV_LINKS.map((link) => ({ ...link })));
  const [socialLinks, setSocialLinks] = useState<{ label: string; href: string; icon?: string }[]>(() => SOCIAL_LINKS.map((link) => ({ ...link })));
  const [skillMarquee, setSkillMarquee] = useState<{ name: string; level?: string; years?: string }[]>(() => SKILL_MARQUEE.map((skill) => ({ ...skill })));
  const [skillGroups, setSkillGroups] = useState<SkillFormGroup[]>(defaultSkillGroups);
  const [experiences, setExperiences] = useState<{ title: string; company: string; dateRange: string; achievements: string[] }[]>(() =>
    EXPERIENCES.map((experience) => ({ ...experience, achievements: [...experience.achievements] })),
  );
  const [contactInfo, setContactInfo] = useState<{ email?: string; message?: string }>({ ...CONTACT_INFO });
  const [heroSettings, setHeroSettings] = useState<{ imageUrl?: string }>({ ...HERO_SETTINGS });

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
      if (!link.href.trim()) settingsErrors.push(`Navigation link ${index + 1} needs a href.`);
    });

    socialLinks.forEach((link, index) => {
      if (!link.label.trim()) settingsErrors.push(`Social link ${index + 1} needs a label.`);
      if (!link.href.trim()) settingsErrors.push(`Social link ${index + 1} needs a href.`);
    });

    skillMarquee.forEach((skill, index) => {
      if (!skill.name.trim()) settingsErrors.push(`Skill marquee item ${index + 1} needs a name.`);
    });

    skillGroups.forEach((group, groupIndex) => {
      if (!group.group.trim()) settingsErrors.push(`Skill group ${groupIndex + 1} needs a group name.`);
      group.skills.forEach((skill, skillIndex) => {
        if (!skill.name.trim()) settingsErrors.push(`Skill ${skillIndex + 1} in group ${groupIndex + 1} needs a name.`);
      });
    });

    experiences.forEach((experience, index) => {
      if (!experience.title.trim()) settingsErrors.push(`Experience ${index + 1} needs a title.`);
      if (!experience.company.trim()) settingsErrors.push(`Experience ${index + 1} needs a company.`);
    });

    if (contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      settingsErrors.push("Contact email must be a valid email address.");
    }

    if (heroSettings.imageUrl && !/^(\/|https?:\/\/|data:image\/)/.test(heroSettings.imageUrl)) {
      settingsErrors.push("Hero image must be picked from your device or start with / or http(s)://.");
    }

    setFormErrors((current) => ({ ...current, settings: settingsErrors }));
    return settingsErrors.length === 0;
  };

  if (loading || !user || !isAdmin) {
    return (
      <main className="mx-auto flex min-h-[65vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-zinc-400">Checking access...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-blue-500">No-Code Content Studio</p>
          <h1 className="heading-modern mt-2 text-3xl font-bold text-zinc-100 sm:text-4xl">Manage Blog & Projects</h1>
          <p className="mt-2 text-sm text-zinc-400">Yahin se add/delete karo. Home aur Blog pages auto update ho jayenge.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => logout()}
            className="rounded-md border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/15"
          >
            Logout
          </button>
          <Link href="/" className="rounded-md border border-white/10 bg-zinc-900/45 px-4 py-2 text-sm text-zinc-100 hover:border-blue-500/30">
            Home
          </Link>
          <Link href="/blog" className="rounded-md border border-white/10 bg-zinc-900/45 px-4 py-2 text-sm text-zinc-100 hover:border-blue-500/30">
            Blog
          </Link>
        </div>
      </div>

      {!configured && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Firebase env vars missing hain. Abhi local browser fallback use ho raha hai. Production ke liye `.env.local` me Firebase keys add karo.
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/45 p-6">
        <h2 className="text-xl font-semibold text-zinc-100">Site Settings</h2>
        <p className="mt-2 text-sm text-zinc-400">Manage navigation, socials, skills, experiences and contact via forms.</p>

        <div className="mt-4 grid gap-6">
          <div>
            <h3 className="text-sm font-medium text-zinc-200">Navigation Links</h3>
            <div className="mt-2 space-y-2">
              {navLinks.map((n, i) => (
                <div key={i} className="flex gap-2">
                  <input value={n.label} onChange={(e) => setNavLinks((s) => s.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Label" className="w-1/3 rounded-md bg-zinc-900/60 p-2 text-sm" />
                  <input value={n.href} onChange={(e) => setNavLinks((s) => s.map((x, idx) => idx === i ? { ...x, href: e.target.value } : x))} placeholder="Href" className="flex-1 rounded-md bg-zinc-900/60 p-2 text-sm" />
                  <button type="button" onClick={() => setNavLinks((s) => s.filter((_, idx) => idx !== i))} className="text-red-400">Delete</button>
                </div>
              ))}
              <button type="button" onClick={() => setNavLinks((s) => [...s, { label: "New", href: "#" }])} className="mt-2 text-sm text-blue-400">+ Add Nav Link</button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-200">Social Links</h3>
            <div className="mt-2 space-y-2">
              {socialLinks.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input value={s.label} onChange={(e) => setSocialLinks((a) => a.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Label" className="w-1/4 rounded-md bg-zinc-900/60 p-2 text-sm" />
                  <input value={s.href} onChange={(e) => setSocialLinks((a) => a.map((x, idx) => idx === i ? { ...x, href: e.target.value } : x))} placeholder="Href" className="flex-1 rounded-md bg-zinc-900/60 p-2 text-sm" />
                  <input value={s.icon || ""} onChange={(e) => setSocialLinks((a) => a.map((x, idx) => idx === i ? { ...x, icon: e.target.value } : x))} placeholder="Icon" className="w-1/5 rounded-md bg-zinc-900/60 p-2 text-sm" />
                  <button type="button" onClick={() => setSocialLinks((a) => a.filter((_, idx) => idx !== i))} className="text-red-400">Delete</button>
                </div>
              ))}
              <button type="button" onClick={() => setSocialLinks((s) => [...s, { label: "Github", href: "#", icon: "github" }])} className="mt-2 text-sm text-blue-400">+ Add Social</button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-200">Skill Marquee</h3>
            <div className="mt-2 space-y-2">
              {skillMarquee.map((sk, i) => (
                <div key={i} className="flex gap-2">
                  <input value={sk.name} onChange={(e) => setSkillMarquee((a) => a.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Name" className="w-1/3 rounded-md bg-zinc-900/60 p-2 text-sm" />
                  <input value={sk.level || ""} onChange={(e) => setSkillMarquee((a) => a.map((x, idx) => idx === i ? { ...x, level: e.target.value } : x))} placeholder="Level" className="w-1/3 rounded-md bg-zinc-900/60 p-2 text-sm" />
                  <input value={sk.years || ""} onChange={(e) => setSkillMarquee((a) => a.map((x, idx) => idx === i ? { ...x, years: e.target.value } : x))} placeholder="Years" className="w-1/3 rounded-md bg-zinc-900/60 p-2 text-sm" />
                  <button type="button" onClick={() => setSkillMarquee((a) => a.filter((_, idx) => idx !== i))} className="text-red-400">Delete</button>
                </div>
              ))}
              <button type="button" onClick={() => setSkillMarquee((s) => [...s, { name: "New Skill" }])} className="mt-2 text-sm text-blue-400">+ Add Skill</button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-200">Skill Groups</h3>
            <div className="mt-2 space-y-4">
              {skillGroups.map((group, gi) => (
                <div key={gi} className="rounded-md border border-white/5 p-3">
                  <div className="flex items-center gap-2">
                    <input value={group.group} onChange={(e) => setSkillGroups((s) => s.map((g, idx) => idx === gi ? { ...g, group: e.target.value } : g))} className="flex-1 rounded-md bg-zinc-900/60 p-2 text-sm" />
                    <button onClick={() => setSkillGroups((s) => s.filter((_, idx) => idx !== gi))} className="text-red-400">Delete Group</button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {group.skills.map((sk, si) => (
                      <div key={si} className="flex gap-2">
                        <input value={sk.name} onChange={(e) => setSkillGroups((s) => s.map((g, gi2) => gi2 === gi ? { ...g, skills: g.skills.map((x, idx) => idx === si ? { ...x, name: e.target.value } : x) } : g))} placeholder="Skill" className="flex-1 rounded-md bg-zinc-900/60 p-2 text-sm" />
                        <input value={sk.level || ""} onChange={(e) => setSkillGroups((s) => s.map((g, gi2) => gi2 === gi ? { ...g, skills: g.skills.map((x, idx) => idx === si ? { ...x, level: e.target.value } : x) } : g))} placeholder="Level" className="w-40 rounded-md bg-zinc-900/60 p-2 text-sm" />
                        <button onClick={() => setSkillGroups((s) => s.map((g, gi2) => gi2 === gi ? { ...g, skills: g.skills.filter((_, idx) => idx !== si) } : g))} className="text-red-400">Remove</button>
                      </div>
                    ))}
                    <button onClick={() => setSkillGroups((s) => s.map((g, gi2) => gi2 === gi ? { ...g, skills: [...g.skills, { name: "New Skill" }] } : g))} className="text-sm text-blue-400">+ Add Skill</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setSkillGroups((s) => [...s, { group: "New Group", skills: [] }])} className="mt-2 text-sm text-blue-400">+ Add Group</button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-200">Experiences</h3>
            <div className="mt-2 space-y-4">
              {experiences.map((ex, ei) => (
                <div key={ei} className="rounded-md border border-white/5 p-3">
                  <div className="flex gap-2">
                    <input value={ex.title} onChange={(e) => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, title: e.target.value } : x))} placeholder="Title" className="flex-1 rounded-md bg-zinc-900/60 p-2 text-sm" />
                    <input value={ex.company} onChange={(e) => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, company: e.target.value } : x))} placeholder="Company" className="w-48 rounded-md bg-zinc-900/60 p-2 text-sm" />
                    <input value={ex.dateRange} onChange={(e) => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, dateRange: e.target.value } : x))} placeholder="Date Range" className="w-40 rounded-md bg-zinc-900/60 p-2 text-sm" />
                  </div>
                  <div className="mt-2 space-y-2">
                    {ex.achievements.map((ach, ai) => (
                      <div key={ai} className="flex gap-2">
                        <input value={ach} onChange={(e) => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, achievements: x.achievements.map((a, j) => j === ai ? e.target.value : a) } : x))} placeholder="Achievement" className="flex-1 rounded-md bg-zinc-900/60 p-2 text-sm" />
                        <button onClick={() => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, achievements: x.achievements.filter((_, j) => j !== ai) } : x))} className="text-red-400">Remove</button>
                      </div>
                    ))}
                    <button onClick={() => setExperiences((s) => s.map((x, idx) => idx === ei ? { ...x, achievements: [...x.achievements, "New achievement"] } : x))} className="text-sm text-blue-400">+ Add Achievement</button>
                  </div>
                  <div className="mt-2">
                    <button onClick={() => setExperiences((s) => s.filter((_, idx) => idx !== ei))} className="text-red-400">Delete Experience</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setExperiences((s) => [...s, { title: "New Role", company: "Company", dateRange: "", achievements: [] }])} className="mt-2 text-sm text-blue-400">+ Add Experience</button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-200">Contact Info</h3>
            <div className="mt-2 space-y-2">
              <input value={contactInfo.email || ""} onChange={(e) => setContactInfo((s) => ({ ...s, email: e.target.value }))} placeholder="Email" className="w-full rounded-md bg-zinc-900/60 p-2 text-sm" />
              <textarea value={contactInfo.message || ""} onChange={(e) => setContactInfo((s) => ({ ...s, message: e.target.value }))} rows={3} className="w-full rounded-md bg-zinc-900/60 p-2 text-sm" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-200">Homepage Image</h3>
            <div className="mt-2">
              <ImagePicker
                label="Profile image"
                value={heroSettings.imageUrl || ""}
                onChange={(imageUrl) => setHeroSettings((s) => ({ ...s, imageUrl }))}
                hint="Pick from your device, or use a URL like /rudresh.jpg."
              />
            </div>
          </div>

          <div className="flex gap-2">
            {formErrors.settings.length > 0 && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                <p className="font-medium">Fix these before saving:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {formErrors.settings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={async () => {
                if (!validateSettings()) return;

                try {
                  setBusy(true);
                  setError("");
                  setNotice("");
                  await saveSetting("nav_links", navLinks);
                  await saveSetting("social_links", socialLinks);
                  await saveSetting("skill_marquee", skillMarquee);
                  await saveSetting("skill_groups", toSkillGroupSetting(skillGroups));
                  await saveSetting("experiences", experiences);
                  await saveSetting("contact_info", contactInfo);
                  await saveSetting("hero_settings", heroSettings);
                  setNotice("Settings saved successfully.");
                } catch (error) {
                  setError(error instanceof Error ? error.message : "Unable to save settings.");
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded-md bg-green-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Save Settings
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}

      {notice && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="text-xs text-emerald-100/80 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-zinc-900/45 p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-zinc-100">Add Project</h2>
          <form onSubmit={onAddProject} noValidate className="mt-4 space-y-3">
            <input
              className={`w-full rounded-md border bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 ${formErrors.project.title ? "border-red-400/70" : "border-white/10"}`}
              placeholder="Title"
              value={projectForm.title}
              onChange={(e) => setProjectForm((s) => ({ ...s, title: e.target.value }))}
            />
            {formErrors.project.title && <p className="text-xs text-red-300">{formErrors.project.title}</p>}
            <textarea
              className={`w-full rounded-md border bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 ${formErrors.project.description ? "border-red-400/70" : "border-white/10"}`}
              placeholder="Description"
              rows={3}
              value={projectForm.description}
              onChange={(e) => setProjectForm((s) => ({ ...s, description: e.target.value }))}
            />
            {formErrors.project.description && <p className="text-xs text-red-300">{formErrors.project.description}</p>}
            <input
              className="w-full rounded-md border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
              placeholder="Tech (comma separated)"
              value={projectForm.tech}
              onChange={(e) => setProjectForm((s) => ({ ...s, tech: e.target.value }))}
            />
            <input
              className="w-full rounded-md border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
              placeholder="Link"
              value={projectForm.link}
              onChange={(e) => setProjectForm((s) => ({ ...s, link: e.target.value }))}
            />
            <ImagePicker
              label="Project screenshot"
              value={projectForm.imageUrl}
              onChange={(imageUrl) => setProjectForm((s) => ({ ...s, imageUrl }))}
              hint="Pick a screenshot from your device, or use a URL like /projects/my-app.png."
            />
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={projectForm.featured}
                onChange={(e) => setProjectForm((s) => ({ ...s, featured: e.target.checked }))}
              />
              Featured project
            </label>
            <button disabled={busy} className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              Add Project
            </button>
          </form>

          <div className="mt-6 space-y-2">
            {projects.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-white/10 bg-zinc-900/55 px-3 py-2">
                <span className="text-sm text-zinc-200">{item.title}</span>
                <button type="button" onClick={() => onRemoveProject(item.id)} className="text-xs text-red-400 hover:text-red-300">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900/45 p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-zinc-100">Add Blog</h2>
          <form onSubmit={onAddBlog} noValidate className="mt-4 space-y-3">
            <input
              className={`w-full rounded-md border bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 ${formErrors.blog.title ? "border-red-400/70" : "border-white/10"}`}
              placeholder="Title"
              value={blogForm.title}
              onChange={(e) => setBlogForm((s) => ({ ...s, title: e.target.value }))}
            />
            {formErrors.blog.title && <p className="text-xs text-red-300">{formErrors.blog.title}</p>}
            <textarea
              className={`w-full rounded-md border bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 ${formErrors.blog.excerpt ? "border-red-400/70" : "border-white/10"}`}
              placeholder="Excerpt"
              rows={3}
              value={blogForm.excerpt}
              onChange={(e) => setBlogForm((s) => ({ ...s, excerpt: e.target.value }))}
            />
            {formErrors.blog.excerpt && <p className="text-xs text-red-300">{formErrors.blog.excerpt}</p>}
            <textarea
              className="w-full rounded-md border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
              placeholder="Full content (shown on blog detail page)"
              rows={6}
              value={blogForm.content}
              onChange={(e) => setBlogForm((s) => ({ ...s, content: e.target.value }))}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="date"
                className={`w-full rounded-md border bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 ${formErrors.blog.date ? "border-red-400/70" : "border-white/10"}`}
                value={blogForm.date}
                onChange={(e) => setBlogForm((s) => ({ ...s, date: e.target.value }))}
              />
              <input
                className="w-full rounded-md border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
                placeholder="Read time (e.g. 5 min read)"
                value={blogForm.readTime}
                onChange={(e) => setBlogForm((s) => ({ ...s, readTime: e.target.value }))}
              />
            </div>
            {formErrors.blog.date && <p className="text-xs text-red-300">{formErrors.blog.date}</p>}
            <button disabled={busy} className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              Add Blog
            </button>
          </form>

          <div className="mt-6 space-y-2">
            {blogs.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-white/10 bg-zinc-900/55 px-3 py-2">
                <span className="text-sm text-zinc-200">{item.title}</span>
                <button type="button" onClick={() => onRemoveBlog(item.id)} className="text-xs text-red-400 hover:text-red-300">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
