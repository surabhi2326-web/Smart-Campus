
import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — Smart Campus" },
      { name: "description", content: "Track your attendance, subject by subject." },
    ],
  }),
  component: Attendance,
});

// Matches the real schema in Firestore: status is "Present" | "Absent"
type AttendanceRecord = {
  id: string;
  subject: string;
  date: string; // YYYY-MM-DD
  status: "Present" | "Absent";
};

const colors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-sky-500",
];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildWeeklyTrend(records: AttendanceRecord[]) {
  const thisWeekStart = startOfWeek(new Date());
  const weeks = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    weeks.push({ label: `W${6 - i}`, start, end });
  }
  return weeks.map((w) => {
    const inWeek = records.filter((r) => {
      const d = new Date(r.date);
      return d >= w.start && d <= w.end;
    });
    const total = inWeek.length;
    const present = inWeek.filter((r) => r.status === "Present").length;
    return { label: w.label, pct: total > 0 ? Math.round((present / total) * 100) : 0 };
  });
}

function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadAttendance(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function loadAttendance(uid: string) {
    setLoading(true);
    const q = query(collection(db, "attendance"), where("studentId", "==", uid));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AttendanceRecord[];
    setRecords(data);
    setLoading(false);
  }

  const subjectMap = new Map<string, { attended: number; total: number }>();
  records.forEach((r) => {
    const cur = subjectMap.get(r.subject) ?? { attended: 0, total: 0 };
    cur.total += 1;
    if (r.status === "Present") cur.attended += 1;
    subjectMap.set(r.subject, cur);
  });
  const subjects = [...subjectMap.entries()].map(([name, v], i) => ({
    name,
    attended: v.attended,
    total: v.total,
    color: colors[i % colors.length],
  }));

  const overallTotal = subjects.reduce((a, s) => a + s.total, 0);
  const overall =
    overallTotal > 0
      ? Math.round((subjects.reduce((a, s) => a + s.attended, 0) / overallTotal) * 100)
      : 0;

  const weeklyTrend = buildWeeklyTrend(records);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Attendance" description="Stay above the line. Comfortably." />

      {loading && <p className="text-sm text-muted-foreground">Loading your attendance…</p>}

      {!loading && records.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No attendance has been recorded for you yet.
        </p>
      )}

      {!loading && records.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft md:col-span-1">
              <p className="text-sm text-muted-foreground">Overall</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="font-display text-6xl">{overall}%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${overall}%` }} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Requirement: 75%</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft md:col-span-2">
              <p className="text-sm font-medium">Last 6 weeks</p>
              <div className="mt-6 flex h-40 items-end gap-3">
                {weeklyTrend.map((w, i) => (
                  <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-primary/80 transition group-hover:bg-primary"
                      style={{ height: `${w.pct}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 className="mt-8 mb-4 text-lg font-semibold">Subjects</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => {
              const pct = Math.round((s.attended / s.total) * 100);
              const ok = pct >= 75;
              return (
                <div
                  key={s.name}
                  className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                    <h3 className="font-medium">{s.name}</h3>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="font-display text-3xl">{pct}%</span>
                    <span
                      className={`text-xs ${ok ? "text-success" : "text-destructive"} inline-flex items-center gap-1`}
                    >
                      {ok ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {s.attended}/{s.total}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${ok ? "bg-primary" : "bg-destructive"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}