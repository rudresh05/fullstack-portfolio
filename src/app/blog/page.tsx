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
    <main className="mx-auto min-h-screen w-full max-w-[calc(100vw-2rem)] px-5 pb-16 pt-28 sm:px-6">
      <div className="mb-10 flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        <div>
          <p className="accent-text text-xs font-black uppercase tracking-[0.25em]">Blog</p>
          <h1 className="mt-3 text-4xl font-black text-[var(--text)] sm:text-5xl">Latest Articles</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/studio"
            className="btn-secondary inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-black transition hover:-translate-y-0.5"
          >
            Open Studio
          </Link>
          <Link
            href="/"
            className="btn-primary inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-black transition hover:-translate-y-0.5"
          >
            Home
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug || slugify(post.title)}`}
            className="panel rounded-lg p-5 transition hover:-translate-y-0.5"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-[var(--text)]">{post.title}</h2>
              <span className="muted-text text-xs">{post.readTime}</span>
            </div>
            <p className="muted-text text-sm leading-7">{post.excerpt}</p>
            <p className="accent-text mt-3 text-xs font-black uppercase tracking-[0.16em]">Read article - {post.date}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
