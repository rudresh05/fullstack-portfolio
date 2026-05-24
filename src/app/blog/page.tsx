"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { slugify, subscribeBlogs, type ManagedBlog } from "@/lib/content-store";

export default function BlogPage() {
  const [posts, setPosts] = useState<ManagedBlog[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeBlogs(setPosts);
    return () => unsubscribe();
  }, []);

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-5xl px-6 py-16">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-blue-500">Blog</p>
          <h1 className="heading-modern mt-3 text-4xl font-bold text-zinc-100 sm:text-5xl">Latest Articles</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/studio"
            className="inline-flex items-center justify-center rounded-md border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/15"
          >
            Open Studio
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-zinc-900/45 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-blue-500/30 hover:text-white"
          >
            Home
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug || slugify(post.title)}`}
            className="rounded-2xl border border-white/10 bg-zinc-900/45 p-5 backdrop-blur-md transition hover:border-blue-500/35 hover:bg-zinc-900/60"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-zinc-100">{post.title}</h2>
              <span className="text-xs text-zinc-500">{post.readTime}</span>
            </div>
            <p className="text-sm text-zinc-400">{post.excerpt}</p>
            <p className="mt-3 text-xs text-blue-400">Read article - {post.date}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
