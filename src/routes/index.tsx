import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Play,
  Calendar,
  CheckCircle2,
  BarChart3,
  Megaphone,
  NotebookPen,
  Sparkles,
  Twitter,
  Github,
} from "lucide-react";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Campus — Less Chaos. More Organization." },
      { name: "description", content: "A calm, premium student productivity workspace. Classes, tasks, notes, attendance and notices — in one place." },
      { property: "og:title", content: "Smart Campus — Less Chaos. More Organization." },
      { property: "og:description", content: "A calm, premium student productivity workspace for students." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Floating navbar */}
      <header className="fixed inset-x-0 top-4 z-40 mx-auto flex max-w-6xl items-center justify-between rounded-full glass px-4 py-2.5 shadow-soft sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#benefits" className="hover:text-foreground">Students</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden rounded-full px-3 py-1.5 text-sm font-medium hover:bg-secondary sm:inline-flex">Sign in</Link>
          <Link to="/signup" className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-36 pb-20 bg-hero">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft">
            <Sparkles className="h-3 w-3 text-primary" /> Built for students, by students
          </div>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] sm:text-7xl">
            Less Chaos.<br/>
            <span className="italic text-primary">More Organization.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Smart Campus brings your classes, tasks, attendance, notices and notes into one calm, beautifully organized workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-secondary">
              <Play className="h-4 w-4" /> Watch Demo
            </button>
          </div>
        </div>

        {/* Product preview */}
        <div className="mx-auto mt-16 max-w-5xl px-6">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
            <div className="flex items-center gap-1.5 border-b border-border bg-secondary/50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-3 text-xs text-muted-foreground">smart-campus.app/dashboard</span>
            </div>
            <div className="grid grid-cols-12 gap-4 p-6">
              <div className="col-span-3 space-y-2">
                {["Dashboard", "Tasks", "Timetable", "Attendance", "Notes"].map((n, i) => (
                  <div key={n} className={`rounded-lg px-3 py-2 text-xs ${i === 0 ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground"}`}>{n}</div>
                ))}
              </div>
              <div className="col-span-9 space-y-3">
                <div className="rounded-xl bg-hero p-5">
                  <p className="text-xs text-muted-foreground">Tuesday, June 30</p>
                  <p className="font-display text-2xl">Good morning, Aarav.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Today</p>
                    <p className="mt-1 text-lg font-semibold">3 classes</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Attendance</p>
                    <p className="mt-1 text-lg font-semibold">87%</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Tasks</p>
                    <p className="mt-1 text-lg font-semibold">2 due</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Features</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">Everything a student needs. Nothing they don't.</h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Calendar, t: "Timetable", d: "Day, week and calendar views. Add classes in seconds." },
            { icon: CheckCircle2, t: "Tasks", d: "Pending, completed, overdue — with priorities and reminders." },
            { icon: BarChart3, t: "Attendance", d: "Track overall and subject-wise. Stay above the line." },
            { icon: Megaphone, t: "Notice Board", d: "Pinned, categorized notices from your institute." },
            { icon: NotebookPen, t: "Notes", d: "Organized folders. Pin important ones. Search instantly." },
            { icon: Sparkles, t: "Calm by design", d: "A workspace that respects your attention." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="group rounded-2xl border border-border bg-card p-6 transition hover:shadow-lift hover:-translate-y-0.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-4xl sm:text-5xl">Three steps to calmer studies.</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Set up your timetable", d: "Add your classes once. We'll show what's next, automatically." },
              { n: "02", t: "Capture as you go", d: "Tasks, notes and notices land where they belong." },
              { n: "03", t: "Focus on today", d: "Every morning, see only what matters now." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
                <p className="font-display text-3xl text-primary">{s.n}</p>
                <h3 className="mt-3 font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-primary">For students</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Designed for the way you actually study.</h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {[
                "Mobile-first — works wherever you do",
                "Quiet, focused interface with zero clutter",
                "Built-in keyboard shortcuts",
                "Dark mode ready",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-border bg-hero p-10 shadow-soft">
            <blockquote className="font-display text-2xl leading-snug">
              "Smart Campus replaced four apps. My week finally feels organized."
            </blockquote>
            <p className="mt-4 text-sm text-muted-foreground">— Ananya R., 3rd year, NIT Trichy</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-4xl sm:text-5xl">Loved by students.</h2>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { q: "It feels handcrafted. Every detail is intentional.", n: "Rahul M." },
              { q: "Finally, a planner that doesn't look like a spreadsheet.", n: "Priya K." },
              { q: "I open it first thing each morning. It's calming.", n: "Vivek S." },
            ].map((t) => (
              <figure key={t.n} className="rounded-2xl border border-border bg-card p-6">
                <blockquote className="text-sm leading-relaxed">"{t.q}"</blockquote>
                <figcaption className="mt-4 text-xs text-muted-foreground">{t.n}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="font-display text-4xl sm:text-5xl">Questions, answered.</h2>
        <div className="mt-10 divide-y divide-border">
          {[
            { q: "Is Smart Campus free?", a: "Yes, the core experience is free for students." },
            { q: "Does it work on mobile?", a: "It's built mobile-first with bottom navigation and touch-friendly cards." },
            { q: "Can I import my timetable?", a: "Adding classes is fast — and import is on the roadmap." },
            { q: "Is my data private?", a: "We keep things minimal and respect your data. You're in control." },
          ].map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between text-base font-medium">
                {f.q}
                <span className="text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-12 sm:flex-row sm:items-center">
          <Logo />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Smart Campus. Less chaos. More organization.</p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="#" aria-label="Twitter" className="hover:text-foreground"><Twitter className="h-4 w-4" /></a>
            <a href="#" aria-label="Github" className="hover:text-foreground"><Github className="h-4 w-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
