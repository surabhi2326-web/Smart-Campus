import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import {
  GraduationCap,
  Users,
  Building2,
  School,
  TrendingUp,
  ClipboardList,
  Megaphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Smart Campus" }] }),
  component: AdminDashboard,
});

function Stat({ icon: Icon, label, value, hint }: any) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

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

type Stats = {
  totalStudents: number;
  totalTeachers: number;
  totalDepartments: number;
  totalClasses: number;
  attendancePct: number;
  assignmentsThisMonth: number;
};

type NoticeItem = { id: string; title: string };

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setLoadError("");
    try {
      const [
        studentsSnap,
        teachersSnap,
        deptSnap,
        classSnap,
        attendanceSnap,
        assignmentsSnap,
        noticesSnap,
      ] = await Promise.all([
        getDocs(query(collection(db, "users"), where("role", "==", "student"))),
        getDocs(query(collection(db, "users"), where("role", "==", "teacher"))),
        getDocs(collection(db, "departments")),
        getDocs(collection(db, "classes")),
        getDocs(collection(db, "attendance")),
        getDocs(collection(db, "assignments")),
        getDocs(query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(3))),
      ]);

      const totalPresent = attendanceSnap.docs.filter((d) => d.data().status === "Present").length;
      const attendancePct =
        attendanceSnap.docs.length > 0
          ? Math.round((totalPresent / attendanceSnap.docs.length) * 100)
          : 0;

      const now = new Date();
      const assignmentsThisMonth = assignmentsSnap.docs.filter((d) => {
        const created = toDate(d.data().createdAt);
        return (
          created &&
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }).length;

      setStats({
        totalStudents: studentsSnap.docs.length,
        totalTeachers: teachersSnap.docs.length,
        totalDepartments: deptSnap.docs.length,
        totalClasses: classSnap.docs.length,
        attendancePct,
        assignmentsThisMonth,
      });

      setNotices(noticesSnap.docs.map((d) => ({ id: d.id, title: d.data().title })));

      // Institute-wide attendance trend, last 7 weeks
      const thisWeekStart = startOfWeek(now);
      const weeks = [];
      for (let i = 6; i >= 0; i--) {
        const start = new Date(thisWeekStart);
        start.setDate(start.getDate() - i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        weeks.push({ start, end });
      }
      const trend = weeks.map((w) => {
        const inWeek = attendanceSnap.docs.filter((d) => {
          const date = d.data().date as string | undefined;
          if (!date) return false;
          const dt = new Date(date);
          return dt >= w.start && dt <= w.end;
        });
        if (inWeek.length === 0) return 0;
        const present = inWeek.filter((d) => d.data().status === "Present").length;
        return Math.round((present / inWeek.length) * 100);
      });
      setWeeklyTrend(trend);
    } catch (error: any) {
      console.error(error);
      setLoadError(
        error?.code ? `${error.code}: ${error.message}` : (error?.message ?? "Unknown error"),
      );
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-hero p-8 shadow-soft">
        <p className="text-sm text-muted-foreground">Institute overview</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Welcome back, Admin.</h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          A calm command center for people, departments and performance.
        </p>
      </section>

      {loading && <p className="text-sm text-muted-foreground">Loading institute data…</p>}

      {!loading && loadError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          Couldn't load dashboard data: {loadError}
        </p>
      )}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Stat
              icon={GraduationCap}
              label="Total Students"
              value={stats.totalStudents.toLocaleString()}
            />
            <Stat
              icon={Users}
              label="Total Teachers"
              value={stats.totalTeachers.toLocaleString()}
            />
            <Stat icon={Building2} label="Departments" value={stats.totalDepartments} />
            <Stat icon={School} label="Classes" value={stats.totalClasses} />
            <Stat
              icon={TrendingUp}
              label="Attendance"
              value={`${stats.attendancePct}%`}
              hint="Institute-wide"
            />
            <Stat
              icon={ClipboardList}
              label="Assignments"
              value={stats.assignmentsThisMonth}
              hint="This month"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="mb-4 text-lg font-semibold">Recent notices</h2>
              {notices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notices posted yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {notices.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3"
                    >
                      <Megaphone className="mt-0.5 h-4 w-4 text-primary" /> {n.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="mb-4 text-lg font-semibold">Attendance trend</h2>
              <div className="flex h-40 items-end gap-3">
                {weeklyTrend.map((v, i) => (
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
          </div>
        </>
      )}
    </div>
  );
}
