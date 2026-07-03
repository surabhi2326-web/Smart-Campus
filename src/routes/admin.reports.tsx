import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
  component: AdminReports,
});

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "string") return new Date(value);
  return null;
}

type DeptAttendance = { name: string; pct: number };

function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deptAttendance, setDeptAttendance] = useState<DeptAttendance[]>([]);
  const [submissionTrend, setSubmissionTrend] = useState<number[]>([]);
  const [userStats, setUserStats] = useState({
    activeStudents: 0,
    activeTeachers: 0,
    noticesThisMonth: 0,
    assignmentsOpen: 0,
  });

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setLoadError("");
    try {
      const [
        studentsSnap,
        teachersSnap,
        attendanceSnap,
        submissionsSnap,
        noticesSnap,
        assignmentsSnap,
      ] = await Promise.all([
        getDocs(query(collection(db, "users"), where("role", "==", "student"))),
        getDocs(query(collection(db, "users"), where("role", "==", "teacher"))),
        getDocs(collection(db, "attendance")),
        getDocs(query(collection(db, "submissions"), where("status", "==", "Completed"))),
        getDocs(collection(db, "notices")),
        getDocs(collection(db, "assignments")),
      ]);

      // Attendance records don't carry department directly, so join through
      // each student's profile to figure out which department they belong to.
      const studentDept: Record<string, string> = {};
      studentsSnap.docs.forEach((d) => {
        const dept = d.data().department as string | undefined;
        if (dept) studentDept[d.id] = dept;
      });

      const deptTally: Record<string, { present: number; total: number }> = {};
      attendanceSnap.docs.forEach((d) => {
        const data = d.data();
        const dept = studentDept[data.studentId];
        if (!dept) return;
        deptTally[dept] = deptTally[dept] ?? { present: 0, total: 0 };
        deptTally[dept].total += 1;
        if (data.status === "Present") deptTally[dept].present += 1;
      });
      setDeptAttendance(
        Object.entries(deptTally).map(([name, v]) => ({
          name,
          pct: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
        })),
      );

      // Weekly count of completed submissions, last 7 weeks
      const now = new Date();
      const thisWeekStart = startOfWeek(now);
      const weeks = [];
      for (let i = 6; i >= 0; i--) {
        const start = new Date(thisWeekStart);
        start.setDate(start.getDate() - i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        weeks.push({ start, end });
      }
      const maxPossible = Math.max(
        1,
        ...weeks.map(
          (w) =>
            submissionsSnap.docs.filter((d) => {
              const dt = toDate(d.data().completedAt);
              return dt && dt >= w.start && dt <= w.end;
            }).length,
        ),
      );
      const trend = weeks.map((w) => {
        const count = submissionsSnap.docs.filter((d) => {
          const dt = toDate(d.data().completedAt);
          return dt && dt >= w.start && dt <= w.end;
        }).length;
        return Math.round((count / maxPossible) * 100);
      });
      setSubmissionTrend(trend);

      const noticesThisMonth = noticesSnap.docs.filter((d) => {
        const created = toDate(d.data().createdAt);
        return (
          created &&
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }).length;

      const todayISO = now.toISOString().slice(0, 10);
      const assignmentsOpen = assignmentsSnap.docs.filter(
        (d) => (d.data().dueDate as string) >= todayISO,
      ).length;

      setUserStats({
        activeStudents: studentsSnap.docs.length,
        activeTeachers: teachersSnap.docs.length,
        noticesThisMonth,
        assignmentsOpen,
      });
    } catch (error: any) {
      console.error(error);
      setLoadError(
        error?.code ? `${error.code}: ${error.message}` : (error?.message ?? "Unknown error"),
      );
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Reports" description="Institute-wide analytics at a glance." />

      {loading && <p className="text-sm text-muted-foreground">Loading reports…</p>}

      {!loading && loadError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          Couldn't load report data: {loadError}
        </p>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold">Attendance by department</h2>
            {deptAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance data yet.</p>
            ) : (
              <div className="space-y-3">
                {deptAttendance.map((d) => (
                  <div key={d.name}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{d.name}</span>
                      <span className="text-muted-foreground">{d.pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold">Assignments submitted</h2>
            <p className="mb-2 text-xs text-muted-foreground">
              Relative to this period's busiest week
            </p>
            <div className="flex h-40 items-end gap-3">
              {submissionTrend.map((v, i) => (
                <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition group-hover:bg-primary"
                    style={{ height: `${v}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold">User statistics</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { l: "Active students", v: userStats.activeStudents.toLocaleString() },
                { l: "Active teachers", v: userStats.activeTeachers.toLocaleString() },
                { l: "Notices this month", v: userStats.noticesThisMonth },
                { l: "Assignments open", v: userStats.assignmentsOpen },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                  <p className="mt-1 font-display text-2xl">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
