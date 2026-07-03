
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Search, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const Route = createFileRoute("/teacher/students")({
  head: () => ({ meta: [{ title: "Students — Teacher" }] }),
  component: TeacherStudents,
});

type Student = {
  id: string;
  name: string;
  rollNo?: string;
  email?: string;
  section: string;
};

type AttendanceRow = {
  studentId: string;
  status: "Present" | "Absent";
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function TeacherStudents() {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("All");

  const [sections, setSections] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { present: number; total: number }>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadRoster(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function loadRoster(uid: string) {
    setLoading(true);
    try {
      // Sections this teacher actually teaches, derived from their lectures —
      // not a hardcoded list, so it stays correct as their schedule changes.
      const lecturesSnap = await getDocs(
        query(collection(db, "lectures"), where("teacherId", "==", uid)),
      );
      const sectionSet = new Set<string>();
      lecturesSnap.docs.forEach((d) => {
        const section = d.data().section as string | undefined;
        if (section) sectionSet.add(section);
      });
      const sectionList = [...sectionSet];
      setSections(sectionList);

      if (sectionList.length === 0) {
        setStudents([]);
        setAttendance({});
        setLoading(false);
        return;
      }

      // Firestore "in" supports up to 10 values — fine for a typical teaching load.
      const studentsSnap = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "student"),
          where("section", "in", sectionList.slice(0, 10)),
        ),
      );
      const roster = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
      setStudents(roster);

      // All attendance this teacher has ever marked, grouped by student —
      // one query instead of one-per-student.
      const attSnap = await getDocs(
        query(collection(db, "attendance"), where("teacherId", "==", uid)),
      );
      const tally: Record<string, { present: number; total: number }> = {};
      attSnap.docs.forEach((d) => {
        const data = d.data() as AttendanceRow;
        if (!tally[data.studentId]) tally[data.studentId] = { present: 0, total: 0 };
        tally[data.studentId].total += 1;
        if (data.status === "Present") tally[data.studentId].present += 1;
      });
      setAttendance(tally);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const list = students.filter(
    (s) =>
      (cls === "All" || s.section === cls) &&
      (s.name?.toLowerCase().includes(q.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Students" description="Browse and manage your class rosters." />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or roll no."
            className="w-full bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
          {["All", ...sections].map((c) => (
            <button
              key={c}
              onClick={() => setCls(c)}
              className={`rounded-md px-3 py-1.5 text-xs transition ${cls === c ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading roster…</p>}

      {!loading && sections.length === 0 && (
        <p className="text-sm text-muted-foreground">
          You don't have any scheduled lectures yet, so no class roster can be shown. Add a lecture
          first.
        </p>
      )}

      {!loading && sections.length > 0 && list.length === 0 && (
        <p className="text-sm text-muted-foreground">No students match your search.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => {
          const a = attendance[s.id];
          const pct = a && a.total > 0 ? Math.round((a.present / a.total) * 100) : null;
          return (
            <div
              key={s.id}
              className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 font-medium text-primary">
                  {initials(s.name ?? "?")}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.rollNo ?? "—"} · {s.section}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Attendance</span>
                {pct === null ? (
                  <span className="font-medium text-muted-foreground">No data</span>
                ) : (
                  <span
                    className={`font-medium ${pct >= 75 ? "text-success" : "text-destructive"}`}
                  >
                    {pct}%
                  </span>
                )}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${pct !== null && pct >= 75 ? "bg-primary" : "bg-destructive"}`}
                  style={{ width: `${pct ?? 0}%` }}
                />
              </div>

              {s.email ? (
                <a
                  href={`mailto:${s.email}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                >
                  <Mail className="h-3.5 w-3.5" /> Message
                </a>
              ) : (
                <button
                  disabled
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" /> No email on file
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
