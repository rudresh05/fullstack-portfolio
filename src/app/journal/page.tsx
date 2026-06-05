"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Dumbbell,
  Gauge,
  IndianRupee,
  Network,
  PenLine,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { addJournal, fetchJournals, subscribeJournals } from "@/lib/content-store";
import { toast } from "sonner";

type JournalState = {
  date: string;
  workCompleted: string;
  codingCompleted: string;
  contentCreated: string;
  learning: string;
  wins: string;
  mistakes: string;
  avoided: string;
  realityCheck: string;
  holdingBack: string;
  deepWorkHours: string;
  exercise: string;
  contentPublished: string;
  networking: string;
  revenue: string;
  biggestLesson: string;
  nonNegotiable1: string;
  nonNegotiable2: string;
  nonNegotiable3: string;
  futureSentence: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const initialJournal: JournalState = {
  date: today(),
  workCompleted: "",
  codingCompleted: "",
  contentCreated: "",
  learning: "",
  wins: "",
  mistakes: "",
  avoided: "",
  realityCheck: "",
  holdingBack: "",
  deepWorkHours: "",
  exercise: "",
  contentPublished: "",
  networking: "",
  revenue: "",
  biggestLesson: "",
  nonNegotiable1: "",
  nonNegotiable2: "",
  nonNegotiable3: "",
  futureSentence: "",
};

function WritingBlock({
  title,
  caption,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  title: string;
  caption: string;
  name: keyof JournalState;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label className="group block rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_58%,transparent)] p-4 transition hover:-translate-y-0.5">
      <span className="block text-sm font-black text-[var(--text)]">{title}</span>
      <span className="muted-text mt-1 block text-xs leading-5">{caption}</span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="mt-4 min-h-28 w-full resize-y rounded-md border border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] px-3 py-3 text-sm leading-6 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
      />
    </label>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  name,
  onChange,
  placeholder,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  name: keyof JournalState;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}) {
  return (
    <label className="rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_62%,transparent)] p-4">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
        <Icon className="h-4 w-4 accent-text" /> {label}
      </span>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder} className="field mt-3" />
    </label>
  );
}

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: typeof Target;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="accent-text flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em]">
          <Icon className="h-4 w-4" /> {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black text-[var(--text)] sm:text-3xl">{title}</h2>
      </div>
      <div aria-hidden="true" className="hidden h-px flex-1 premium-rule opacity-60 sm:block" />
    </div>
  );
}

export default function JournalPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [journal, setJournal] = useState<JournalState>(initialJournal);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;
    
    fetchJournals().then((items) => {
      const todayEntry = items.find((item) => item.date === journal.date);
      if (todayEntry) {
        setJournal((current) => ({ ...current, ...todayEntry.data, date: todayEntry.date }));
      }
    });

    const unsub = subscribeJournals((items) => {
      const todayEntry = items.find((item) => item.date === journal.date);
      if (todayEntry) {
        setJournal((current) => ({ ...current, ...todayEntry.data, date: todayEntry.date }));
      }
    });

    return () => unsub();
  }, [user, journal.date]);

  const update = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = event.target;
    setJournal((current) => ({ ...current, [name]: value }));
  };

  const saveJournal = async () => {
    const toastId = toast.loading("Saving your entry...");
    try {
      setBusy(true);
      const { date, ...data } = journal;
      await addJournal({ date, data: data as Record<string, string> });
      
      toast.success("Entry saved to database", { id: toastId });
      
      // Since the email is triggered by the API, we can show a follow-up toast
      toast.info("System update sent to updates@rudreshp.me", {
        description: "Your monochrome report has been dispatched.",
        duration: 4000,
      });
      
    } catch (error) {
      console.error("Failed to save journal:", error);
      toast.error("Failed to save entry", {
        id: toastId,
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setBusy(false);
    }
  };

  const completedFields = useMemo(() => {
    const values = Object.entries(journal).filter(([key]) => key !== "date").map(([, value]) => value.trim());
    return values.filter(Boolean).length;
  }, [journal]);

  const completion = Math.round((completedFields / 18) * 100);

  const markdown = useMemo(
    () => `# Daily Journal Entry

Date: ${journal.date}

## What did I do today?

* Work completed: ${journal.workCompleted}
* Coding completed: ${journal.codingCompleted}
* Content created: ${journal.contentCreated}
* Learning: ${journal.learning}

## Wins

* What moved me closer to my goals today?
${journal.wins}

## Mistakes

* What wasted my time?
${journal.mistakes}
* What did I avoid doing?
${journal.avoided}

## Reality Check

* Am I acting like someone who wants Rs 1L/month and long-term financial freedom?
${journal.realityCheck}
* If not, what behavior is holding me back?
${journal.holdingBack}

## Progress Metrics

* Deep work hours: ${journal.deepWorkHours}
* Exercise/Gym: ${journal.exercise}
* Content published: ${journal.contentPublished}
* Applications/Networking: ${journal.networking}
* Revenue earned: ${journal.revenue}

## Biggest Lesson

* ${journal.biggestLesson}

## Tomorrow's Non-Negotiables

1. ${journal.nonNegotiable1}
2. ${journal.nonNegotiable2}
3. ${journal.nonNegotiable3}

## One Sentence to Future Me

${journal.futureSentence}
`,
    [journal],
  );

  const copyJournal = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const resetJournal = () => {
    setJournal({ ...initialJournal, date: today() });
  };

  if (loading || !user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
        <div className="panel rounded-lg p-6 text-center">
          <p className="accent-text text-xs font-black uppercase tracking-[0.24em]">Journal Access</p>
          <p className="muted-text mt-3 text-sm">Checking login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full px-4 pb-16 pt-28 sm:px-5">
      <div className="mx-auto grid w-full max-w-[calc(100vw-2rem)] gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] 2xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)]">
          <div className="panel-strong flex h-full flex-col rounded-lg p-5">
            <Link href="/" className="btn-secondary inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-black">
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>

            <div className="mt-7 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_62%,transparent)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[var(--accent)] text-[#07110f]">
                  <BookOpenText className="h-5 w-5" />
                </div>
                <span className="rounded-md border border-[var(--line)] px-2 py-1 text-xs font-black text-[var(--text)]">{completion}%</span>
              </div>
              <p className="accent-text mt-5 text-xs font-black uppercase tracking-[0.2em]">Daily Ledger</p>
              <h1 className="mt-2 text-2xl font-black leading-tight text-[var(--text)] sm:text-3xl">Your proof of work.</h1>
              <p className="muted-text mt-3 text-sm leading-6">
                Capture output, excuses, money moves, and tomorrow&apos;s standards in one sharp review.
              </p>
            </div>

            <label className="mt-4 block">
              <span className="muted-text flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]">
                <CalendarDays className="h-4 w-4" /> Date
              </span>
              <input type="date" name="date" value={journal.date} onChange={update} className="field mt-2" />
            </label>

            <div className="mt-4 rounded-lg border border-[var(--line)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="muted-text font-bold">Entry depth</span>
                <span className="font-black text-[var(--text)]">{completedFields}/18</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--line)_75%,transparent)]">
                <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${completion}%` }} />
              </div>
            </div>

            <div className="mt-auto grid gap-2 pt-5">
              <button
                type="button"
                onClick={saveJournal}
                disabled={busy}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" /> {busy ? "Saving..." : "Save Entry"}
              </button>
              <button type="button" onClick={copyJournal} className="btn-secondary inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black">
                <Clipboard className="h-4 w-4" /> {copied ? "Copied" : "Copy Markdown"}
              </button>
              <button type="button" onClick={resetJournal} className="btn-secondary inline-flex items-center justify-center rounded-md px-4 py-3 text-sm font-black">
                Reset Today
              </button>
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="panel-strong overflow-hidden rounded-lg">
            <div className="grid lg:grid-cols-[1fr_18rem]">
              <div className="p-6 sm:p-8">
                <p className="accent-text flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em]">
                  <Gauge className="h-4 w-4" /> Premium Daily Journal
                </p>
                <h2 className="text-balance mt-4 max-w-3xl text-4xl font-black leading-tight text-[var(--text)] sm:text-6xl">
                  Audit today. Design tomorrow.
                </h2>
                <p className="muted-text mt-5 max-w-2xl text-sm leading-7 sm:text-base">
                  This page is not for pretty thoughts. It is for evidence: what you shipped, where you drifted, and what future you must protect.
                </p>
              </div>
              <div className="border-t border-[var(--line)] p-6 lg:border-l lg:border-t-0">
                {[
                  ["Focus", journal.deepWorkHours || "Not logged"],
                  ["Revenue", journal.revenue || "Rs 0"],
                  ["Tomorrow", [journal.nonNegotiable1, journal.nonNegotiable2, journal.nonNegotiable3].filter(Boolean).length + "/3"],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-[var(--line)] py-4 last:border-b-0">
                    <p className="muted-text text-xs font-black uppercase tracking-[0.16em]">{label}</p>
                    <p className="mt-1 text-2xl font-black text-[var(--text)]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel rounded-lg p-5 sm:p-6">
            <SectionTitle icon={Rocket} eyebrow="Output" title="What did I do today?" />
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <WritingBlock title="Work completed" caption="Anything productive outside code." name="workCompleted" value={journal.workCompleted} onChange={update} placeholder="Client work, planning, research, tasks completed..." />
              <WritingBlock title="Coding completed" caption="Features, fixes, commits, debugging." name="codingCompleted" value={journal.codingCompleted} onChange={update} placeholder="What did you build or improve?" />
              <WritingBlock title="Content created" caption="Public proof: posts, videos, notes, portfolio." name="contentCreated" value={journal.contentCreated} onChange={update} placeholder="What did you publish or prepare?" />
              <WritingBlock title="Learning" caption="Concepts, docs, mistakes, patterns." name="learning" value={journal.learning} onChange={update} placeholder="What became clearer today?" />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="panel rounded-lg p-5 sm:p-6">
              <SectionTitle icon={CheckCircle2} eyebrow="Wins" title="What moved me closer?" />
              <WritingBlock title="Win log" caption="Name exact actions, not vague motivation." name="wins" value={journal.wins} onChange={update} placeholder="The behavior that actually compounded today..." rows={6} />
            </div>

            <div className="panel rounded-lg p-5 sm:p-6">
              <SectionTitle icon={PenLine} eyebrow="Mistakes" title="Where did I leak time?" />
              <div className="grid gap-4">
                <WritingBlock title="Time waste" caption="Apps, excuses, people, loops." name="mistakes" value={journal.mistakes} onChange={update} placeholder="What wasted my time?" />
                <WritingBlock title="Avoided task" caption="The thing that quietly mattered." name="avoided" value={journal.avoided} onChange={update} placeholder="What did I avoid doing?" />
              </div>
            </div>
          </section>

          <section className="panel-strong rounded-lg p-5 sm:p-6">
            <SectionTitle icon={Target} eyebrow="Reality Check" title="Am I behaving like the person I claim to be?" />
            <div className="grid gap-4 lg:grid-cols-2">
              <WritingBlock
                title="Rs 1L/month standard"
                caption="Yes/no, backed by proof from today."
                name="realityCheck"
                value={journal.realityCheck}
                onChange={update}
                placeholder="Did today's behavior match long-term financial freedom?"
                rows={6}
              />
              <WritingBlock title="Holding pattern" caption="The uncomfortable pattern to break." name="holdingBack" value={journal.holdingBack} onChange={update} placeholder="What behavior is holding me back?" rows={6} />
            </div>
          </section>

          <section className="panel rounded-lg p-5 sm:p-6">
            <SectionTitle icon={Sparkles} eyebrow="Metrics" title="Track the scoreboard." />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Metric icon={Rocket} label="Deep work" name="deepWorkHours" value={journal.deepWorkHours} onChange={update} placeholder="e.g. 4h" />
              <Metric icon={Dumbbell} label="Exercise/Gym" name="exercise" value={journal.exercise} onChange={update} placeholder="Done / skipped" />
              <Metric icon={Sparkles} label="Content" name="contentPublished" value={journal.contentPublished} onChange={update} placeholder="0, 1, 2..." />
              <Metric icon={Network} label="Networking" name="networking" value={journal.networking} onChange={update} placeholder="Applications / DMs" />
              <Metric icon={IndianRupee} label="Revenue" name="revenue" value={journal.revenue} onChange={update} placeholder="Rs 0" />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr] 2xl:grid-cols-[1.2fr_0.8fr]">
            <div className="panel rounded-lg p-5 sm:p-6">
              <SectionTitle icon={BookOpenText} eyebrow="Lesson" title="What should future me remember?" />
              <WritingBlock title="Biggest lesson" caption="Keep the sentence useful enough to reread." name="biggestLesson" value={journal.biggestLesson} onChange={update} placeholder="One thing I learned today that I should remember..." rows={7} />
            </div>

            <div className="panel rounded-lg p-5 sm:p-6">
              <SectionTitle icon={CheckCircle2} eyebrow="Tomorrow" title="Non-negotiables" />
              <div className="space-y-3">
                {(["nonNegotiable1", "nonNegotiable2", "nonNegotiable3"] as const).map((name, index) => (
                  <label key={name} className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_58%,transparent)] p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-sm font-black text-[#07110f]">{index + 1}</span>
                    <input name={name} value={journal[name]} onChange={update} placeholder={`Non-negotiable ${index + 1}`} className="field" />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="panel-strong rounded-lg p-5 sm:p-6">
            <SectionTitle icon={PenLine} eyebrow="Future Me" title="One brutally honest sentence." />
            <WritingBlock
              title="Final note"
              caption="No performance. No excuses. Just the truth."
              name="futureSentence"
              value={journal.futureSentence}
              onChange={update}
              placeholder="Write one brutally honest sentence about today's effort."
              rows={4}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
