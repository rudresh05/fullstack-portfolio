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
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-6">
        <p className="text-sm text-zinc-400">Loading article...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto min-h-[70vh] w-full max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-blue-500">Article</p>
        <h1 className="heading-modern mt-3 text-3xl font-bold text-zinc-100">Post not found</h1>
        <p className="mt-3 text-sm text-zinc-400">This article may have been deleted or renamed.</p>
        <Link href="/blog" className="mt-6 inline-flex rounded-md border border-white/10 px-4 py-2 text-sm text-zinc-100 hover:border-blue-500/35">
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
    <main className="mx-auto min-h-[70vh] w-full max-w-3xl px-6 py-16">
      <Link href="/blog" className="text-sm text-blue-400 hover:text-blue-300">
        Back to Blog
      </Link>

      <article className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/45 p-6 backdrop-blur-md sm:p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-blue-500">{post.date}</p>
        <h1 className="heading-modern mt-4 text-3xl font-bold text-zinc-100 sm:text-5xl">{post.title}</h1>
        <p className="mt-3 text-sm text-zinc-500">{post.readTime}</p>
        <p className="mt-6 text-lg leading-8 text-zinc-300">{post.excerpt}</p>

        <div className="mt-8 space-y-5 border-t border-white/10 pt-8">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-7 text-zinc-400">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}
