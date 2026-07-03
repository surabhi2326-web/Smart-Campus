

import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Check, X, Save, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";

export const Route = createFileRoute("/teacher/attendance")({
  head: () => ({ meta: [{ title: "Mark Attendance — Teacher" }] }),
  component: MarkAttendance,
});

type LectureCombo = { subject: string; section: string };

type Student = {
  id: string;
  name: string;
  rollNo?: string;
  section: string;
};

// Matches the real schema already in Firestore:
// studentId, teacherId, subject, section, date, status ("Present" | "Absent"),
// studentName, rollNo, createdAt
type AttendanceDoc = {
  studentId: string;
  subject: string;
  section: string;
  date: string;
  status: "Present" | "Absent";
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function MarkAttendance() {
  const [userId, setUserId] = useState("");
  const [combos, setCombos] = useState<LectureCombo[]>([]);
  const [cls, setCls] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(todayISO());

  const [students, setStudents] = useState<Student[]>([]);
  const [state, setState] = useState<Record<string, "Present" | "Absent">>({});
  const [saving, setSaving] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const [analytics, setAnalytics] = useState<Record<string, { present: number; total: number }>>(
    {},
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadCombos(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  async function loadCombos(uid: string) {
    const q = query(collection(db, "lectures"), where("teacherId", "==", uid));
    const snapshot = await getDocs(q);
    const seen = new Set<string>();
    const list: LectureCombo[] = [];
    snapshot.docs.forEach((d) => {
      const data = d.data() as { subject: string; section: string };
      const key = `${data.subject}::${data.section}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ subject: data.subject, section: data.section });
      }
    });
    setCombos(list);
    if (list.length > 0) {
      setSubject(list[0].subject);
      setCls(list[0].section);
    }
  }

  useEffect(() => {
    if (cls && subject) {
      loadRosterAndAttendance();
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls, subject, date]);

  async function loadRosterAndAttendance() {
    setLoadingRoster(true);

    const studentsQ = query(
      collection(db, "users"),
      where("role", "==", "student"),
      where("section", "==", cls),
    );
    const studentsSnap = await getDocs(studentsQ);
    const roster = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
    setStudents(roster);

    const attQ = query(
      collection(db, "attendance"),
      where("subject", "==", subject),
      where("section", "==", cls),
      where("date", "==", date),
    );
    const attSnap = await getDocs(attQ);
    const prefilled: Record<string, "Present" | "Absent"> = {};
    attSnap.docs.forEach((d) => {
      const data = d.data() as AttendanceDoc;
      prefilled[data.studentId] = data.status;
    });
    setState(prefilled);

    setLoadingRoster(false);
  }

  async function loadAnalytics() {
    const q = query(
      collection(db, "attendance"),
      where("subject", "==", subject),
      where("section", "==", cls),
    );
    const snap = await getDocs(q);
    const tally: Record<string, { present: number; total: number }> = {};
    snap.docs.forEach((d) => {
      const data = d.data() as AttendanceDoc;
      if (!tally[data.studentId]) tally[data.studentId] = { present: 0, total: 0 };
      tally[data.studentId].total += 1;
      if (data.status === "Present") tally[data.studentId].present += 1;
    });
    setAnalytics(tally);
  }

  const set = (studentId: string, v: "Present" | "Absent") =>
    setState((s) => ({ ...s, [studentId]: v }));
  const present = Object.values(state).filter((v) => v === "Present").length;

  async function saveAttendance() {
    if (!subject || !cls) return;
    setSaving(true);

    const batch = writeBatch(db);
    students.forEach((s) => {
      const status = state[s.id];
      if (!status) return; // skip unmarked students
      const id = `${subject}_${cls}_${date}_${s.id}`;
      batch.set(doc(db, "attendance", id), {
        studentId: s.id,
        studentName: s.name ?? "",
        rollNo: s.rollNo ?? "",
        teacherId: userId,
        subject,
        section: cls,
        date,
        status,
      });
    });

    await batch.commit();
    setSaving(false);
    loadAnalytics();
    alert("Attendance saved!");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Attendance"
        description="Choose a class, mark and save."
        action={
          <button
            onClick={saveAttendance}
            disabled={saving || students.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </button>
        }
      />

      {combos.length === 0 && (
        <p className="mb-6 text-sm text-muted-foreground">
          You don't have any scheduled lectures yet — add one under Lectures first, then come back
          here to mark attendance.
        </p>
      )}

      {combos.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <label className="rounded-xl border border-border bg-card p-3 text-sm">
              <span className="block text-xs text-muted-foreground">Section</span>
              <select
                value={cls}
                onChange={(e) => setCls(e.target.value)}
                className="mt-1 w-full bg-transparent font-medium focus:outline-none"
              >
                {[...new Set(combos.map((c) => c.section))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="rounded-xl border border-border bg-card p-3 text-sm">
              <span className="block text-xs text-muted-foreground">Subject</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full bg-transparent font-medium focus:outline-none"
              >
                {[...new Set(combos.filter((c) => c.section === cls).map((c) => c.subject))].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
            <label className="rounded-xl border border-border bg-card p-3 text-sm">
              <span className="block text-xs text-muted-foreground">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full bg-transparent font-medium focus:outline-none"
              />
            </label>
            <div className="rounded-xl border border-border bg-card p-3 text-sm">
              <span className="block text-xs text-muted-foreground">Present</span>
              <p className="mt-1 font-display text-2xl">
                {present}
                <span className="text-sm text-muted-foreground"> / {students.length}</span>
              </p>
            </div>
          </div>

          {loadingRoster && <p className="text-sm text-muted-foreground">Loading roster…</p>}

          {!loadingRoster && students.length === 0 && (
            <p className="text-sm text-muted-foreground">No students found in section {cls}.</p>
          )}

          {!loadingRoster && students.length > 0 && (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
              {students.map((s) => {
                const v = state[s.id];
                return (
                  <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="font-medium">{s.name}</p>
                      {s.rollNo && <p className="text-xs text-muted-foreground">{s.rollNo}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => set(s.id, "Present")}
                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${v === "Present" ? "border-success bg-success/10 text-success" : "border-border hover:bg-secondary"}`}
                      >
                        <Check className="h-3.5 w-3.5" /> Present
                      </button>
                      <button
                        onClick={() => set(s.id, "Absent")}
                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${v === "Absent" ? "border-destructive bg-destructive/10 text-destructive" : "border-border hover:bg-secondary"}`}
                      >
                        <X className="h-3.5 w-3.5" /> Absent
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {Object.keys(analytics).length > 0 && (
            <>
              <h2 className="mt-8 mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" /> Overall attendance — {subject} ({cls})
              </h2>
              <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
                {students.map((s) => {
                  const a = analytics[s.id];
                  if (!a) return null;
                  const pct = Math.round((a.present / a.total) * 100);
                  return (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className={pct >= 75 ? "text-success" : "text-destructive"}>
                        {pct}% ({a.present}/{a.total})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

