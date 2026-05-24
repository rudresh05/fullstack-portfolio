"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading, configured, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace("/studio");
    }
  }, [isAdmin, loading, router, user]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      setBusy(true);
      await login(email.trim(), password);
      router.replace("/studio");
    } catch {
      setError("Login failed. Check credentials and admin email setup.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[72vh] w-full max-w-md items-center px-6 py-14">
      <section className="w-full rounded-2xl border border-white/10 bg-zinc-900/45 p-6 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.24em] text-blue-500">Admin Access</p>
        <h1 className="heading-modern mt-3 text-3xl font-semibold text-zinc-100">Studio Login</h1>
        <p className="mt-2 text-sm text-zinc-400">Projects aur blogs manage karne ke liye login karo.</p>

        {!configured && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            Firebase config missing hai. `.env.local` set karo phir login work karega.
          </div>
        )}

        {error && <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            type="email"
            className="w-full rounded-md border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full rounded-md border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            disabled={busy || !configured}
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Login
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link href="/" className="text-zinc-300 hover:text-white">
            Back Home
          </Link>
          <Link href="/blog" className="text-zinc-300 hover:text-white">
            Blog
          </Link>
        </div>
      </section>
    </main>
  );
}
