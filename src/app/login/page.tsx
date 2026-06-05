"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole, Settings } from "lucide-react";

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
    <main className="mx-auto flex min-h-screen w-full max-w-[calc(100vw-2rem)] items-center px-5 pb-14 pt-28 sm:px-6">
      <section className="grid w-full gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-lg p-6 sm:p-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[var(--accent)] text-[#07110f]">
            <Settings className="h-5 w-5" />
          </div>
          <p className="accent-text mt-8 text-xs font-black uppercase tracking-[0.24em]">Portfolio System</p>
          <h1 className="text-balance mt-3 text-4xl font-black text-[var(--text)] sm:text-5xl">Open your content settings.</h1>
          <p className="muted-text mt-4 max-w-md text-sm leading-7">
            Login unlocks the studio where you can update projects, blogs, navigation, skills, experience, contact info, and the hero image.
          </p>
          <Link href="/" className="btn-secondary mt-8 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-black">
            <ArrowLeft className="h-4 w-4" /> Back Home
          </Link>
        </div>

        <form onSubmit={onSubmit} className="panel-strong rounded-lg p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="accent-text text-xs font-black uppercase tracking-[0.24em]">Admin Access</p>
              <h2 className="mt-2 text-3xl font-black text-[var(--text)]">Login</h2>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--line)]">
              <LockKeyhole className="h-5 w-5 text-[var(--text)]" />
            </div>
          </div>

          {!configured && (
            <div className="status-warning mt-5 rounded-lg p-3 text-sm">
              Firebase config missing hai. `.env.local` set karo phir login work karega.
            </div>
          )}

          {error && <div className="status-error mt-5 rounded-lg p-3 text-sm">{error}</div>}

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="muted-text text-xs font-bold uppercase tracking-[0.16em]">Admin email</span>
              <input type="email" className="field mt-2" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="block">
              <span className="muted-text text-xs font-bold uppercase tracking-[0.16em]">Password</span>
              <input type="password" className="field mt-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
          </div>

          <button disabled={busy || !configured} className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
            <LockKeyhole className="h-4 w-4" /> {busy ? "Opening..." : "Open Settings"}
          </button>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/" className="muted-text hover:text-[var(--text)]">
              Home
            </Link>
            <Link href="/blog" className="muted-text hover:text-[var(--text)]">
              Blog
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
