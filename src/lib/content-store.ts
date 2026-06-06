import { BLOG_POSTS, PROJECTS } from "@/constants";
import { auth } from "@/lib/firebase";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type ManagedProject = {
  id: string;
  title: string;
  description: string;
  tech: string[];
  link: string;
  imageUrl?: string;
  featured: boolean;
  stars?: number;
  forks?: number;
  updatedAt?: string;
  repoName?: string;
};

export type ManagedBlog = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
};

export type ManagedJournal = {
  id: string;
  date: string;
  data: Record<string, string>;
};

export type ForHerContent = {
  herName: string;
  tagline: string;
  storyHeading: string;
  storyBody: string;
  timeline: Array<{ date: string; title: string; desc: string }>;
  moments: Array<{ title: string; text: string; img: string; caption: string; date: string }>;
  letterDate: string;
  letterBody: string[];
  signature: string;
  quotes: string[];
  portraitUrl: string;
};

type ContentRecord = Record<string, unknown>;
type RegistryCallback = (value: unknown) => void;

const PROJECTS_KEY = "portfolio.projects.v1";
const BLOGS_KEY = "portfolio.blogs.v1";
const JOURNALS_KEY = "portfolio.journals.v1";
const SETTINGS_KEY = "portfolio.settings.v1";
const CONTENT_CHANGED_EVENT = "portfolio-content-changed";
const PROJECTS_COLLECTION = "projects";
const BLOGS_COLLECTION = "blogs";
const JOURNALS_COLLECTION = "journals";

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const defaultProjects: ManagedProject[] = PROJECTS.map((project, index) => ({
  id: `${slugify(project.title)}-${index + 1}`,
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

const defaultBlogs: ManagedBlog[] = BLOG_POSTS.map((post, index) => ({
  id: `${slugify(post.title)}-${index + 1}`,
  slug: slugify(post.title),
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  date: post.date,
  readTime: post.readTime,
}));

const isBrowser = () => typeof window !== "undefined";

function saveLocalProjects(projects: ManagedProject[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function saveLocalBlogs(blogs: ManagedBlog[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(BLOGS_KEY, JSON.stringify(blogs));
}

function saveLocalJournals(journals: ManagedJournal[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(JOURNALS_KEY, JSON.stringify(journals));
}

function loadLocalSettings(): Record<string, unknown> {
  if (!isBrowser()) return {};

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocalSetting<T = unknown>(key: string, value: T) {
  if (!isBrowser()) return;
  const settings = loadLocalSettings();
  settings[key] = value;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function notifyContentChanged(type: string) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(CONTENT_CHANGED_EVENT, { detail: type }));
}

async function getAdminToken() {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Please login again before saving.");
  return token;
}

async function contentRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    let message = typeof payload?.error === "string" ? payload.error : "Content request failed.";
    
    // Include extra details if available (e.g. from our new detailed error reporting)
    if (payload?.message) {
      message = `${message}: ${payload.message}`;
    }
    if (payload?.code) {
      message = `${message} (code: ${payload.code})`;
    }
    
    throw new Error(message);
  }

  return payload as T;
}

async function adminContentRequest<T>(init: RequestInit): Promise<T> {
  const token = await getAdminToken();
  return contentRequest<T>("/api/content", {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export function loadProjects(): ManagedProject[] {
  if (!isBrowser()) return defaultProjects;

  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    if (!raw) return defaultProjects;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultProjects;
    return parsed as ManagedProject[];
  } catch {
    return defaultProjects;
  }
}

export function saveProjects(projects: ManagedProject[]) {
  saveLocalProjects(projects);
}

export function loadBlogs(): ManagedBlog[] {
  if (!isBrowser()) return defaultBlogs;

  try {
    const raw = window.localStorage.getItem(BLOGS_KEY);
    if (!raw) return defaultBlogs;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultBlogs;
    return parsed as ManagedBlog[];
  } catch {
    return defaultBlogs;
  }
}

export function saveBlogs(blogs: ManagedBlog[]) {
  saveLocalBlogs(blogs);
}

export function loadJournals(): ManagedJournal[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(JOURNALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ManagedJournal[];
  } catch {
    return [];
  }
}

export function saveJournals(journals: ManagedJournal[]) {
  saveLocalJournals(journals);
}

export function createId(value: string) {
  return `${slugify(value)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function fetchProjects(): Promise<ManagedProject[]> {
  if (!isSupabaseConfigured) return loadProjects();

  try {
    const { data } = await contentRequest<{ data: unknown[] }>("/api/content?type=projects");
    const projects = data.map(normalizeProject);
    const result = projects.length ? projects : defaultProjects;
    saveLocalProjects(result);
    return result;
  } catch {
    try {
    const { data, error } = await supabase
      .from(PROJECTS_COLLECTION)
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return loadProjects();

    const projects = data.map(normalizeProject);

    const result = projects.length ? projects : defaultProjects;
    saveLocalProjects(result);
    return result;
    } catch {
      return loadProjects();
    }
  }
}

export async function fetchBlogs(): Promise<ManagedBlog[]> {
  if (!isSupabaseConfigured) return loadBlogs();

  try {
    const { data } = await contentRequest<{ data: unknown[] }>("/api/content?type=blogs");
    const blogs = data.map(normalizeBlog);
    const result = blogs.length ? blogs : defaultBlogs;
    saveLocalBlogs(result);
    return result;
  } catch {
    try {
    const { data, error } = await supabase
      .from(BLOGS_COLLECTION)
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return loadBlogs();

    const blogs = data.map(normalizeBlog);

    const result = blogs.length ? blogs : defaultBlogs;
    saveLocalBlogs(result);
    return result;
    } catch {
      return loadBlogs();
    }
  }
}

export async function fetchJournals(): Promise<ManagedJournal[]> {
  if (!isSupabaseConfigured) return loadJournals();

  try {
    const { data } = await contentRequest<{ data: unknown[] }>("/api/content?type=journals");
    const journals = data.map(normalizeJournal);
    saveLocalJournals(journals);
    return journals;
  } catch {
    try {
      const { data, error } = await supabase
        .from(JOURNALS_COLLECTION)
        .select("*")
        .order("date", { ascending: false });

      if (error || !data) return loadJournals();

      const journals = data.map(normalizeJournal);
      saveLocalJournals(journals);
      return journals;
    } catch {
      return loadJournals();
    }
  }
}

function safeStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function normalizeProject(entry: unknown): ManagedProject {
  const record = entry as ContentRecord;

  return {
    id: String(record.id),
    title: String(record.title ?? "Untitled"),
    description: String(record.description ?? ""),
    tech: safeStringArray(record.tech),
    link: String(record.link ?? "#"),
    imageUrl: record.image_url ? String(record.image_url) : String(record.imageUrl ?? ""),
    featured: Boolean(record.featured),
    stars: Number(record.stars ?? 0),
    forks: Number(record.forks ?? 0),
    updatedAt: record.updated_at ? String(record.updated_at) : String(record.updatedAt ?? ""),
    repoName: record.repo_name ? String(record.repo_name) : String(record.repoName ?? ""),
  };
}

function normalizeBlog(entry: unknown): ManagedBlog {
  const record = entry as ContentRecord;

  return {
    id: String(record.id),
    title: String(record.title ?? "Untitled"),
    slug: String(record.slug ?? slugify(String(record.title ?? "untitled"))),
    excerpt: String(record.excerpt ?? ""),
    content: String(record.content ?? record.excerpt ?? ""),
    date: String(record.date ?? ""),
    readTime: String(record.readTime ?? record.read_time ?? "5 min read"),
  };
}

function normalizeJournal(entry: unknown): ManagedJournal {
  const record = entry as ContentRecord;

  return {
    id: String(record.id),
    date: String(record.date ?? ""),
    data: (record.data as Record<string, string>) ?? {},
  };
}

export function subscribeProjects(callback: (items: ManagedProject[]) => void) {
  const handleLocalChange = (event: Event) => {
    if ((event as CustomEvent<string>).detail === "projects") {
      fetchProjects().then(callback).catch(() => callback(loadProjects()));
    }
  };

  if (isBrowser()) window.addEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);

  if (!isSupabaseConfigured) {
    callback(loadProjects());
    return () => {
      if (isBrowser()) window.removeEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);
    };
  }

  // initial fetch
  fetchProjects().then(callback).catch(() => callback(loadProjects()));

  const registryKey = "projects";

  if (!subscriptionRegistry.has(registryKey)) {
    const callbacks = new Set<RegistryCallback>();
    const channel = supabase.channel(`realtime:projects`);

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: PROJECTS_COLLECTION },
      () => {
        fetchProjects().then((items) => callbacks.forEach((cb) => cb(items))).catch(() => callbacks.forEach((cb) => cb(loadProjects())));
      },
    );

    try {
      channel.subscribe();
    } catch {
      // ignore subscribe errors; polling will still provide updates
    }

    const poll = setInterval(() => {
      fetchProjects().then((items) => callbacks.forEach((cb) => cb(items))).catch(() => {});
    }, 15000) as unknown as number;

    subscriptionRegistry.set(registryKey, { channel, callbacks, poll });
  }

  const entry = subscriptionRegistry.get(registryKey)!;
  entry.callbacks.add(callback as RegistryCallback);

  return () => {
    if (isBrowser()) window.removeEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);
    entry.callbacks.delete(callback as RegistryCallback);
    if (entry.callbacks.size === 0) {
      clearInterval(entry.poll);
      supabase.removeChannel(entry.channel);
      subscriptionRegistry.delete(registryKey);
    }
  };
}

export function subscribeBlogs(callback: (items: ManagedBlog[]) => void) {
  const handleLocalChange = (event: Event) => {
    if ((event as CustomEvent<string>).detail === "blogs") {
      fetchBlogs().then(callback).catch(() => callback(loadBlogs()));
    }
  };

  if (isBrowser()) window.addEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);

  if (!isSupabaseConfigured) {
    callback(loadBlogs());
    return () => {
      if (isBrowser()) window.removeEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);
    };
  }

  fetchBlogs().then(callback).catch(() => callback(loadBlogs()));

  const registryKey = "blogs";

  if (!subscriptionRegistry.has(registryKey)) {
    const callbacks = new Set<RegistryCallback>();
    const channel = supabase.channel(`realtime:blogs`);

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: BLOGS_COLLECTION },
      () => {
        fetchBlogs().then((items) => callbacks.forEach((cb) => cb(items))).catch(() => callbacks.forEach((cb) => cb(loadBlogs())));
      },
    );

    try {
      channel.subscribe();
    } catch {
      // ignore
    }

    const poll = setInterval(() => {
      fetchBlogs().then((items) => callbacks.forEach((cb) => cb(items))).catch(() => {});
    }, 15000) as unknown as number;

    subscriptionRegistry.set(registryKey, { channel, callbacks, poll });
  }

  const entry = subscriptionRegistry.get(registryKey)!;
  entry.callbacks.add(callback as RegistryCallback);

  return () => {
    if (isBrowser()) window.removeEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);
    entry.callbacks.delete(callback as RegistryCallback);
    if (entry.callbacks.size === 0) {
      clearInterval(entry.poll);
      supabase.removeChannel(entry.channel);
      subscriptionRegistry.delete(registryKey);
    }
  };
}

export function subscribeJournals(callback: (items: ManagedJournal[]) => void) {
  const handleLocalChange = (event: Event) => {
    if ((event as CustomEvent<string>).detail === "journals") {
      fetchJournals().then(callback).catch(() => callback(loadJournals()));
    }
  };

  if (isBrowser()) window.addEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);

  if (!isSupabaseConfigured) {
    callback(loadJournals());
    return () => {
      if (isBrowser()) window.removeEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);
    };
  }

  fetchJournals().then(callback).catch(() => callback(loadJournals()));

  const registryKey = "journals";

  if (!subscriptionRegistry.has(registryKey)) {
    const callbacks = new Set<RegistryCallback>();
    const channel = supabase.channel(`realtime:journals`);

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: JOURNALS_COLLECTION },
      () => {
        fetchJournals().then((items) => callbacks.forEach((cb) => cb(items))).catch(() => callbacks.forEach((cb) => cb(loadJournals())));
      },
    );

    try {
      channel.subscribe();
    } catch {
      // ignore
    }

    const poll = setInterval(() => {
      fetchJournals().then((items) => callbacks.forEach((cb) => cb(items))).catch(() => {});
    }, 15000) as unknown as number;

    subscriptionRegistry.set(registryKey, { channel, callbacks, poll });
  }

  const entry = subscriptionRegistry.get(registryKey)!;
  entry.callbacks.add(callback as RegistryCallback);

  return () => {
    if (isBrowser()) window.removeEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);
    entry.callbacks.delete(callback as RegistryCallback);
    if (entry.callbacks.size === 0) {
      clearInterval(entry.poll);
      supabase.removeChannel(entry.channel);
      subscriptionRegistry.delete(registryKey);
    }
  };
}

export async function addProject(project: Omit<ManagedProject, "id">) {
  if (!isSupabaseConfigured) {
    const localItem = { ...project, id: createId(project.title) };
    const next = [localItem, ...loadProjects()];
    saveLocalProjects(next);
    notifyContentChanged("projects");
    return;
  }

  await adminContentRequest({
    method: "POST",
    body: JSON.stringify({ type: "projects", project }),
  });
  notifyContentChanged("projects");
}

export async function addBlog(blog: Omit<ManagedBlog, "id">) {
  if (!isSupabaseConfigured) {
    const localItem = { ...blog, id: createId(blog.title) };
    const next = [localItem, ...loadBlogs()];
    saveLocalBlogs(next);
    notifyContentChanged("blogs");
    return;
  }

  await adminContentRequest({
    method: "POST",
    body: JSON.stringify({ type: "blogs", blog }),
  });
  notifyContentChanged("blogs");
}

export async function addJournal(journal: { date: string; data: Record<string, string> }) {
  if (!isSupabaseConfigured) {
    const existing = loadJournals();
    const index = existing.findIndex((j) => j.date === journal.date);
    const next = [...existing];
    if (index >= 0) {
      next[index] = { ...next[index], data: journal.data };
    } else {
      next.unshift({ id: createId("journal"), date: journal.date, data: journal.data });
    }
    saveLocalJournals(next);
    notifyContentChanged("journals");
    return;
  }

  await adminContentRequest({
    method: "POST",
    body: JSON.stringify({ type: "journals", journal }),
  });
  notifyContentChanged("journals");
}

export async function removeProject(id: string) {
  if (!isSupabaseConfigured) {
    const next = loadProjects().filter((item) => item.id !== id);
    saveLocalProjects(next);
    notifyContentChanged("projects");
    return;
  }

  await adminContentRequest({
    method: "DELETE",
    body: JSON.stringify({ type: "projects", id }),
  });
  notifyContentChanged("projects");
}

export async function removeBlog(id: string) {
  if (!isSupabaseConfigured) {
    const next = loadBlogs().filter((item) => item.id !== id);
    saveLocalBlogs(next);
    notifyContentChanged("blogs");
    return;
  }

  await adminContentRequest({
    method: "DELETE",
    body: JSON.stringify({ type: "blogs", id }),
  });
  notifyContentChanged("blogs");
}

export async function removeJournal(id: string) {
  if (!isSupabaseConfigured) {
    const next = loadJournals().filter((item) => item.id !== id);
    saveLocalJournals(next);
    notifyContentChanged("journals");
    return;
  }

  await adminContentRequest({
    method: "DELETE",
    body: JSON.stringify({ type: "journals", id }),
  });
  notifyContentChanged("journals");
}

export async function hasFirestoreContent() {
  if (!isSupabaseConfigured) return false;

  const { data: projects, error: pErr } = await supabase.from(PROJECTS_COLLECTION).select("id").limit(1);
  if (pErr) return false;
  if (projects && projects.length) return true;

  const { data: blogs, error: bErr } = await supabase.from(BLOGS_COLLECTION).select("id").limit(1);
  if (bErr) return false;
  return Boolean(blogs && blogs.length);
}

export async function seedFirestoreDefaults() {
  if (!isSupabaseConfigured) return;

  const alreadySeeded = await hasFirestoreContent();
  if (alreadySeeded) return;

  const projectsPayload = defaultProjects.map((project) => ({
    title: project.title,
    description: project.description,
    tech: project.tech,
    link: project.link,
    image_url: project.imageUrl,
    featured: project.featured,
  }));

  const blogsPayload = defaultBlogs.map((blog) => ({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      date: blog.date,
      read_time: blog.readTime,
  }));

  if (projectsPayload.length) await supabase.from(PROJECTS_COLLECTION).insert(projectsPayload);
  if (blogsPayload.length) await supabase.from(BLOGS_COLLECTION).insert(blogsPayload);
}

  // subscription registry for deduping realtime channels and fallback polling
  type RegistryEntry = {
    channel: ReturnType<typeof supabase.channel>;
    callbacks: Set<RegistryCallback>;
    poll: number;
  };

  const subscriptionRegistry: Map<string, RegistryEntry> = new Map();

// Generic settings store (key -> JSON payload)
export async function fetchSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured) {
    const localValue = loadLocalSettings()[key];
    return localValue === undefined ? fallback : (localValue as T);
  }

  try {
    const { data } = await contentRequest<{ data: T | null }>(`/api/content?type=settings&key=${encodeURIComponent(key)}`);
    if (data === null || data === undefined) return fallback;
    saveLocalSetting(key, data);
    return data;
  } catch {
    try {
    const { data, error } = await supabase.from("settings").select("value").eq("key", key).limit(1).single();
    if (error || !data) return fallback;
    return data.value as T;
    } catch {
      const localValue = loadLocalSettings()[key];
      return localValue === undefined ? fallback : (localValue as T);
    }
  }
}

export function subscribeSetting<T = never>(key: string, callback: (value: T | undefined) => void) {
  const handleLocalChange = (event: Event) => {
    if ((event as CustomEvent<string>).detail === `settings:${key}`) {
      fetchSetting(key, undefined as unknown as T).then(callback).catch(() => callback(undefined as unknown as T));
    }
  };

  if (isBrowser()) window.addEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);

  if (!isSupabaseConfigured) {
    callback(loadLocalSettings()[key] as T);
    return () => {
      if (isBrowser()) window.removeEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);
    };
  }

  // initial fetch
  fetchSetting(key, undefined as unknown as T).then(callback).catch(() => callback(undefined as unknown as T));

  const registryKey = `settings:${key}`;

  if (!subscriptionRegistry.has(registryKey)) {
    const callbacks = new Set<RegistryCallback>();
    const channel = supabase.channel(`realtime:settings:${key}`);

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "settings", filter: `key=eq.${key}` },
      () => {
        fetchSetting(key, undefined as unknown as T)
          .then((val) => callbacks.forEach((cb) => cb(val)))
          .catch(() => callbacks.forEach((cb) => cb(undefined)));
      },
    );

    try {
      channel.subscribe();
    } catch {
      // ignore subscribe errors
    }

    const poll = setInterval(() => {
      fetchSetting(key, undefined as unknown as T).then((val) => callbacks.forEach((cb) => cb(val))).catch(() => {});
    }, 15000) as unknown as number;

    subscriptionRegistry.set(registryKey, { channel, callbacks, poll });
  }

  const entry = subscriptionRegistry.get(registryKey)!;
  entry.callbacks.add(callback as RegistryCallback);

  return () => {
    if (isBrowser()) window.removeEventListener(CONTENT_CHANGED_EVENT, handleLocalChange);
    entry.callbacks.delete(callback as RegistryCallback);
    if (entry.callbacks.size === 0) {
      clearInterval(entry.poll);
      supabase.removeChannel(entry.channel);
      subscriptionRegistry.delete(registryKey);
    }
  };
}

export async function saveSetting<T = unknown>(key: string, value: T) {
  if (!isSupabaseConfigured) {
    saveLocalSetting(key, value);
    notifyContentChanged(`settings:${key}`);
    return;
  }

  await adminContentRequest({
    method: "POST",
    body: JSON.stringify({ type: "settings", key, value }),
  });
  saveLocalSetting(key, value);
  notifyContentChanged(`settings:${key}`);
}
