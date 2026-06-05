"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { fetchBlogs, slugify, type ManagedBlog } from "@/lib/content-store";

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<ManagedBlog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  const post = useMemo(
    () => posts.find((item) => (item.slug || slugify(item.title)) === params.slug),
    [params.slug, posts],
  );

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[calc(100vw-2rem)] items-center justify-center px-6">
        <p className="muted-text text-sm">Loading article...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[calc(100vw-2rem)] px-6 pb-16 pt-28">
        <p className="accent-text text-xs font-black uppercase tracking-[0.25em]">Article</p>
        <h1 className="mt-3 text-3xl font-black text-[var(--text)]">Post not found</h1>
        <p className="muted-text mt-3 text-sm">This article may have been deleted or renamed.</p>
        <Link href="/blog" className="btn-secondary mt-6 inline-flex rounded-md px-4 py-2 text-sm font-black">
          Back to Blog
        </Link>
      </main>
    );
  }

  const paragraphs = (post.content || post.excerpt)
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[calc(100vw-2rem)] px-6 pb-16 pt-28">
      <Link href="/blog" className="accent-text text-sm font-black hover:opacity-80">
        Back to Blog
      </Link>

      <article className="panel-strong mt-8 rounded-lg p-6 sm:p-8">
        <p className="accent-text text-xs font-black uppercase tracking-[0.25em]">{post.date}</p>
        <h1 className="mt-4 max-w-5xl text-3xl font-black text-[var(--text)] sm:text-6xl">{post.title}</h1>
        <p className="muted-text mt-3 text-sm">{post.readTime}</p>
        <p className="muted-text mt-6 max-w-4xl text-lg leading-8">{post.excerpt}</p>

        <div className="mt-8 grid gap-5 border-t border-[var(--line)] pt-8 lg:grid-cols-2">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="muted-text text-sm leading-7">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}
