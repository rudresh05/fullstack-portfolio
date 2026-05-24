"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, BadgeCheck, Globe } from "lucide-react";

import { CONTACT_INFO, SOCIAL_LINKS } from "@/constants";
import { fetchSetting, subscribeSetting } from "@/lib/content-store";
import { cn } from "@/lib/utils";

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const iconMap = {
  github: BadgeCheck,
  linkedin: AtSign,
  twitter: Globe,
} as const;

function MagneticSocial({ label, href, icon }: { label: string; href: string; icon: keyof typeof iconMap }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="glass inline-flex h-11 w-11 items-center justify-center rounded-full text-white/80"
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 260, damping: 16, mass: 0.5 }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        setOffset({ x: dx * 0.2, y: dy * 0.2 });
      }}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
    >
      {(() => {
        const Icon = iconMap[icon];
        return <Icon className="h-5 w-5" />;
      })()}
    </motion.a>
  );
}

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
    "peer w-full border-0 border-b bg-transparent px-0 pb-2 pt-5 text-sm text-zinc-100 outline-none transition focus:border-blue-500";

  return (
    <label htmlFor={id} className="relative block">
      {as === "textarea" ? (
        <textarea
          id={id}
          name={id}
          rows={5}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(sharedClass, "resize-none", error ? "border-red-400/70" : "border-white/10")}
          placeholder=" "
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(sharedClass, error ? "border-red-400/70" : "border-white/10")}
          placeholder=" "
        />
      )}
      <span className="pointer-events-none absolute left-0 top-4 text-sm text-zinc-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
        {label}
      </span>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs text-red-300">
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
    <section id="contact" className="relative mx-auto w-full max-w-6xl px-5 py-24 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: EXPO_OUT }}
          className="rounded-2xl border border-white/10 bg-zinc-900/45 p-8 backdrop-blur-md"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-blue-500">Get In Touch</p>
          <h2 className="heading-modern mt-3 text-3xl font-bold text-zinc-100 sm:text-4xl">Let&apos;s Connect</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">{contact.message}</p>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onCopy}
              className="rounded-md border border-blue-500/35 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/15"
            >
              Copy Email
            </button>
            <span className="text-sm text-zinc-400">{contact.email}</span>
          </div>

          <AnimatePresence>
            {copied ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, ease: EXPO_OUT }}
                className="mt-3 inline-flex rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-400"
              >
                Copied!
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mt-8 flex items-center gap-3">
            {socials.map((item) => (
              <MagneticSocial key={item.label} label={item.label} href={item.href} icon={item.icon as keyof typeof iconMap} />
            ))}
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.75, ease: EXPO_OUT }}
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-zinc-900/45 p-8 backdrop-blur-md lg:max-w-[600px]"
        >
          <div className="space-y-4">
            <FloatingField id="name" label="Name" error={errors.name} />
            <FloatingField id="email" label="Email" type="email" error={errors.email} />
            <FloatingField id="message" label="Message" as="textarea" error={errors.message} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "mt-6 inline-flex min-w-32 items-center justify-center rounded-md px-5 py-2 text-sm font-semibold transition",
              submitting
                ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                : "bg-blue-500 text-white hover:shadow-[0_0_24px_2px_rgba(59,130,246,0.35)]",
            )}
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
