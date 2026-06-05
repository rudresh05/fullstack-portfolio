"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, BadgeCheck, Copy, Globe, Send } from "lucide-react";

import { CONTACT_INFO, SOCIAL_LINKS } from "@/constants";
import { fetchSetting, subscribeSetting } from "@/lib/content-store";
import { cn } from "@/lib/utils";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const iconMap = {
  github: BadgeCheck,
  linkedin: AtSign,
  twitter: Globe,
} as const;

type ContactFormErrors = {
  name?: string;
  email?: string;
  message?: string;
};

function FloatingField({
  id,
  label,
  type = "text",
  as = "input",
  error,
}: {
  id: keyof ContactFormErrors;
  label: string;
  type?: string;
  as?: "input" | "textarea";
  error?: string;
}) {
  const sharedClass =
    "peer w-full border-0 border-b bg-transparent px-0 pb-2 pt-5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]";

  return (
    <label htmlFor={id} className="relative block">
      {as === "textarea" ? (
        <textarea id={id} name={id} rows={5} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={cn(sharedClass, "resize-none", error ? "border-red-400/70" : "border-[var(--line)]")} placeholder=" " />
      ) : (
        <input id={id} name={id} type={type} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={cn(sharedClass, error ? "border-red-400/70" : "border-[var(--line)]")} placeholder=" " />
      )}
      <span className="pointer-events-none absolute left-0 top-4 text-sm text-[var(--muted)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-[var(--accent)] peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
        {label}
      </span>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </label>
  );
}

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [socials, setSocials] = useState(() => SOCIAL_LINKS);
  const [contact, setContact] = useState(() => CONTACT_INFO);

  useEffect(() => {
    fetchSetting("social_links", SOCIAL_LINKS).then((v) => setSocials(v ?? SOCIAL_LINKS));
    fetchSetting("contact_info", CONTACT_INFO).then((v) => setContact(v ?? CONTACT_INFO));

    const unsubS = subscribeSetting("social_links", (v) => setSocials(v ?? SOCIAL_LINKS));
    const unsubC = subscribeSetting("contact_info", (v) => setContact(v ?? CONTACT_INFO));

    return () => {
      unsubS();
      unsubC();
    };
  }, []);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email ?? CONTACT_INFO.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const nextErrors: ContactFormErrors = {};

    if (!name) nextErrors.name = "Please enter your name.";
    if (!email) {
      nextErrors.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!message) nextErrors.message = "Please write a message.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    setSubmitting(false);
    event.currentTarget.reset();
  };

  return (
    <section id="contact" className="relative mx-auto w-full max-w-[calc(100vw-2rem)] px-5 py-24 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.7, ease: EXPO_OUT }} className="panel rounded-lg p-6 sm:p-8">
          <p className="accent-text text-xs font-black uppercase tracking-[0.24em]">Get In Touch</p>
          <h2 className="text-balance mt-3 text-4xl font-black text-[var(--text)] sm:text-5xl">Let&apos;s build something with taste.</h2>
          <p className="muted-text mt-4 max-w-md text-sm leading-7">{contact.message}</p>

          <div className="mt-7 rounded-lg border border-[var(--line)] p-4">
            <p className="muted-text text-xs uppercase tracking-[0.18em]">Email</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="break-all text-sm font-bold text-[var(--text)]">{contact.email}</span>
              <button type="button" onClick={onCopy} className="btn-secondary inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-black">
                <Copy className="h-4 w-4" /> Copy
              </button>
            </div>
          </div>

          <AnimatePresence>
            {copied ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.35, ease: EXPO_OUT }} className="mt-3 inline-flex rounded-md border border-[var(--line)] px-3 py-1 text-xs text-[var(--text)]">
                Copied.
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mt-8 flex items-center gap-3">
            {socials.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              return (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--line)] text-[var(--text)] transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--text)_7%,transparent)]">
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </motion.div>

        <motion.form initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.75, ease: EXPO_OUT }} onSubmit={onSubmit} className="panel-strong rounded-lg p-6 sm:p-8">
          <div className="space-y-4">
            <FloatingField id="name" label="Name" error={errors.name} />
            <FloatingField id="email" label="Email" type="email" error={errors.email} />
            <FloatingField id="message" label="Message" as="textarea" error={errors.message} />
          </div>

          <button type="submit" disabled={submitting} className={cn("btn-primary mt-6 inline-flex min-w-36 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-black transition", submitting ? "cursor-not-allowed opacity-60" : "hover:-translate-y-0.5")}>
            <Send className="h-4 w-4" /> {submitting ? "Sending..." : "Send Message"}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
