
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

export const Route = createFileRoute("/_app/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable — Smart Campus" },
      { name: "description", content: "Your weekly class schedule, beautifully laid out." },
    ],
  }),
  component: Timetable,
});

const views = ["Day", "Week", "Calendar"] as const;
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = ["08", "09", "10", "11", "12", "13", "14", "15", "16"];

// Cycled per-lecture so different subjects are visually distinct
const palette = [
  "bg-primary-soft border-primary/30 text-primary",
  "bg-amber-50 border-amber-200 text-amber-700",
  "bg-emerald-50 border-emerald-200 text-emerald-700",
  "bg-sky-50 border-sky-200 text-sky-700",
  "bg-rose-50 border-rose-200 text-rose-700",
  "bg-violet-50 border-violet-200 text-violet-700",
];

type Lecture = {
  id: string;
  title: string;
  subject: string;
  section: string;
  room: string;
  day: string; // one of `days`, e.g. "Mon"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
};

type Class = {
  day: number; // index into `days`
  start: number; // hour, may be fractional (e.g. 9.5 = 9:30)
  duration: number; // hours, may be fractional
  name: string;
  room: string;
  color: string;
};

function timeToHour(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

function lectureToClass(l: Lecture, i: number): Class {
  return {
    day: days.indexOf(l.day),
    start: timeToHour(l.startTime),
    duration: Math.max(timeToHour(l.endTime) - timeToHour(l.startTime), 0.5),
    name: `${l.subject} — ${l.title}`,
    room: l.room,
    color: palette[i % palette.length],
  };
}

function Timetable() {
  const [view, setView] = useState<(typeof views)[number]>("Week");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [section, setSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0); // for Day view, index into `days`

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadTimetable(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadTimetable(uid: string) {
    setLoading(true);

    // Look up the student's section from their profile doc.
    // Assumes a `users/{uid}` document with a `section` field.
    const userSnap = await getDoc(doc(db, "users", uid));
    const userSection = userSnap.exists() ? (userSnap.data().section as string) : null;
    setSection(userSection ?? null);

    if (userSection) {
      const q = query(collection(db, "lectures"), where("section", "==", userSection));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Lecture[];

      setLectures(data);
    } else {
      setLectures([]);
    }

    setLoading(false);
  }

  const classes = lectures.map(lectureToClass).filter((c) => c.day >= 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Timetable"
        description={
          section ? `Section ${section} — your week at a glance.` : "Your week, at a glance."
        }
      />

      {!loading && !section && (
        <div className="mb-5 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          We couldn't find a section assigned to your account, so no lectures can be shown yet.
          Contact your admin if this seems wrong.
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm ${view === v ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground"}`}
            >
              {v}
            </button>
          ))}
        </div>
        {view === "Day" && (
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setSelectedDay((d) => (d + days.length - 1) % days.length)}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium">{days[selectedDay]}</span>
            <button
              onClick={() => setSelectedDay((d) => (d + 1) % days.length)}
              className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading your timetable…</p>}

      {!loading && view === "Week" && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
          <div className="relative grid min-w-[820px] grid-cols-[60px_repeat(6,1fr)]">
            <div></div>
            {days.map((d, i) => (
              <div
                key={d}
                className={`border-b border-border p-3 text-center text-xs font-medium ${i === 1 ? "text-primary" : "text-muted-foreground"}`}
              >
                {d}
              </div>
            ))}
            {hours.map((h) => (
              <div key={h} className="contents">
                <div className="border-r border-border p-2 text-right text-[10px] text-muted-foreground">
                  {h}:00
                </div>
                {days.map((_, di) => (
                  <div key={di} className="relative h-16 border-r border-b border-border/60" />
                ))}
              </div>
            ))}
            {classes.map((c, i) => {
              const top = (c.start - 8) * 64 + 40; // 40px header
              const height = c.duration * 64 - 6;
              const colStart = c.day + 2;
              return (
                <div
                  key={i}
                  className={`absolute m-1 rounded-lg border p-2 text-xs ${c.color}`}
                  style={{
                    gridColumn: `${colStart} / span 1`,
                    gridRow: "1 / -1",
                    transform: `translateY(${top}px)`,
                    height,
                  }}
                >
                  <p className="font-medium">{c.name}</p>
                  <p className="opacity-75">{c.room}</p>
                </div>
              );
            })}
          </div>
          {!loading && section && classes.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              No lectures scheduled for your section yet.
            </p>
          )}
        </div>
      )}

      {!loading && view === "Day" && (
        <ol className="space-y-3">
          {classes
            .filter((c) => c.day === selectedDay)
            .sort((a, b) => a.start - b.start)
            .map((c, i) => {
              const startH = Math.floor(c.start);
              const startM = Math.round((c.start - startH) * 60);
              const endTotal = c.start + c.duration;
              const endH = Math.floor(endTotal);
              const endM = Math.round((endTotal - endH) * 60);
              return (
                <li
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft"
                >
                  <div className="w-20 text-sm">
                    <p className="font-semibold">
                      {String(startH).padStart(2, "0")}:{String(startM).padStart(2, "0")}
                    </p>
                    <p className="text-muted-foreground">
                      {String(endH).padStart(2, "0")}:{String(endM).padStart(2, "0")}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.room}</p>
                  </div>
                </li>
              );
            })}
          {classes.filter((c) => c.day === selectedDay).length === 0 && (
            <p className="text-sm text-muted-foreground">No lectures on {days[selectedDay]}.</p>
          )}
        </ol>
      )}

      {!loading && view === "Calendar" && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg border border-border p-2 text-left text-xs ${i === 1 ? "bg-primary-soft border-primary/30" : ""}`}
              >
                <span className={i === 1 ? "font-semibold text-primary" : ""}>{(i % 30) + 1}</span>
                {i % 5 === 1 && <div className="mt-1 h-1 rounded-full bg-primary/60" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}