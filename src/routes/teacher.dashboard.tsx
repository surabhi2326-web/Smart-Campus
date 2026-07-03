
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Megaphone,
  Plus,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, limit, query, where } from "firebase/firestore";

export const Route = createFileRoute("/teacher/dashboard")({
  head: () => ({ meta: [{ title: "Teacher Dashboard — Smart Campus" }] }),
  component: TeacherDashboard,
});

type Lecture = {
  id: string;
  teacherId: string;
  title: string;
  subject: string;
  section: string;
  room: string;
  day: string; // "Mon" ... "Sat"
  startTime: string;
  endTime: string;
};

type Notice = {
  id: string;
  title: string;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
}) {
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

function TeacherDashboard() {
  const now = new Date();
  const hours = now.getHours();
  const greet = hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";
  const todayStr = formatDateStr(now);
  const todayDayName = DAY_NAMES[now.getDay()];
  const currentTime = nowTimeStr();

  const [teacherName, setTeacherName] = useState("");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingSections, setPendingSections] = useState<string[]>([]);
  const [assignmentsPending, setAssignmentsPending] = useState(0);
  const [assignmentsOverdue, setAssignmentsOverdue] = useState(0);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Teacher's display name
      const userDoc = await getDoc(doc(db, "users", user.uid));
      setTeacherName(userDoc.data()?.name ?? "");

      // This teacher's full recurring weekly timetable
      const lecturesQuery = query(collection(db, "lectures"), where("teacherId", "==", user.uid));
      const lecturesSnap = await getDocs(lecturesQuery);
      const lectureList = lecturesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Lecture[];
      setLectures(lectureList);

      // Total students across every section this teacher teaches
      const sections = Array.from(new Set(lectureList.map((l) => l.section))).filter(Boolean);
      if (sections.length > 0) {
        const studentIds = new Set<string>();
        await Promise.all(
          sections.map(async (section) => {
            const studentsQuery = query(
              collection(db, "users"),
              where("role", "==", "student"),
              where("section", "==", section),
            );
            const studentsSnap = await getDocs(studentsQuery);
            studentsSnap.docs.forEach((d) => studentIds.add(d.id));
          }),
        );
        setTotalStudents(studentIds.size);
      }

      // Pending attendance — today's lectures that don't have a matching
      // attendance record for today yet
      const todaysLectures = lectureList.filter((l) => l.day === todayDayName);
      if (todaysLectures.length > 0) {
        const attendanceQuery = query(
          collection(db, "attendance"),
          where("teacherId", "==", user.uid),
          where("date", "==", todayStr),
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        const markedCombos = new Set(
          attendanceSnap.docs.map((d) => `${d.data().section}|${d.data().subject}`),
        );

        const pending = todaysLectures.filter(
          (l) => !markedCombos.has(`${l.section}|${l.subject}`),
        );
        setPendingSections(Array.from(new Set(pending.map((l) => l.section))));
      }

      // Assignments — collection/shape not confirmed yet, assumed:
      // { teacherId, status: "Pending" | "Reviewed", dueDate: "YYYY-MM-DD" }
      // Safe no-op (shows 0) if this collection doesn't exist.
      try {
        const assignmentsQuery = query(
          collection(db, "assignments"),
          where("teacherId", "==", user.uid),
          where("status", "==", "Pending"),
        );
        const assignmentsSnap = await getDocs(assignmentsQuery);
        setAssignmentsPending(assignmentsSnap.size);
        setAssignmentsOverdue(
          assignmentsSnap.docs.filter((d) => (d.data().dueDate ?? "") < todayStr).length,
        );
      } catch (err) {
        console.error("Assignments fetch failed (collection may not exist yet):", err);
      }

      // Recent notices — assumed { title, tag, createdAt: Timestamp }
      try {
        const noticesQuery = query(
          collection(db, "notices"),
          orderBy("createdAt", "desc"),
          limit(3),
        );
        const noticesSnap = await getDocs(noticesQuery);
        setNotices(noticesSnap.docs.map((d) => ({ id: d.id, title: d.data().title })));
      } catch (err) {
        console.error("Notices fetch failed:", err);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Project the recurring weekly timetable onto the next 7 calendar dates,
  // sorted chronologically, keeping only classes that haven't ended yet.
  const upcomingLectures = useMemo(() => {
    const projected: { date: string; dayName: string; lecture: Lecture; isNow: boolean }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = DAY_NAMES[d.getDay()];
      const dateStr = formatDateStr(d);

      lectures
        .filter((l) => l.day === dayName)
        .forEach((l) => {
          const isToday = dateStr === todayStr;
          const alreadyEnded = isToday && l.endTime < currentTime;
          if (alreadyEnded) return;

          projected.push({
            date: dateStr,
            dayName,
            lecture: l,
            isNow: isToday && l.startTime <= currentTime && currentTime <= l.endTime,
          });
        });
    }

    projected.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.lecture.startTime < b.lecture.startTime ? -1 : 1;
    });

    return projected.slice(0, 5);
  }, [lectures, todayStr, currentTime]);

  const todaysLectures = useMemo(
    () => lectures.filter((l) => l.day === todayDayName),
    [lectures, todayDayName],
  );

  const nextClassHint =
    upcomingLectures.length > 0
      ? `Next: ${upcomingLectures[0].lecture.startTime}`
      : "No classes scheduled";

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title="Teacher Dashboard" description="" />
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-hero p-8 shadow-soft">
        <p className="text-sm text-muted-foreground">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">
          {greet}
          {teacherName ? `, ${teacherName}` : ""}.
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          You have{" "}
          <span className="font-medium text-foreground">{todaysLectures.length} classes</span>{" "}
          today,{" "}
          <span className="font-medium text-foreground">{assignmentsPending} assignments</span>{" "}
          pending review and{" "}
          <span className="font-medium text-foreground">
            {notices.length} recent notice{notices.length === 1 ? "" : "s"}
          </span>
          .
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/teacher/assignments"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New assignment
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={BookOpen}
          label="Today's classes"
          value={String(todaysLectures.length)}
          hint={nextClassHint}
        />
        <Stat
          icon={ClipboardList}
          label="Assignments to review"
          value={String(assignmentsPending)}
          hint={assignmentsOverdue > 0 ? `${assignmentsOverdue} overdue` : undefined}
        />
        <Stat
          icon={ClipboardCheck}
          label="Pending attendance"
          value={String(pendingSections.length)}
          hint={
            pendingSections.length > 0 ? `Sections ${pendingSections.join(", ")}` : "All marked"
          }
        />
        <Stat
          icon={Users}
          label="Total students"
          value={String(totalStudents)}
          hint={
            lectures.length > 0
              ? `Across ${new Set(lectures.map((l) => l.section)).size} sections`
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Upcoming lectures</h2>
              <p className="text-sm text-muted-foreground">This week</p>
            </div>
            <Link
              to="/teacher/lectures"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Open <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ol className="space-y-3">
            {upcomingLectures.length === 0 && (
              <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No upcoming lectures scheduled.
              </li>
            )}
            {upcomingLectures.map((entry) => (
              <li
                key={`${entry.date}-${entry.lecture.id}`}
                className={`flex items-stretch gap-4 rounded-xl border p-4 transition ${
                  entry.isNow
                    ? "border-primary/30 bg-primary-soft/40"
                    : "border-border hover:border-foreground/20"
                }`}
              >
                <div className="w-16 text-sm font-semibold">{entry.lecture.startTime}</div>
                <div className="flex-1">
                  <p className="font-medium">
                    {entry.lecture.subject} — Sec {entry.lecture.section}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.date === todayStr ? "Today" : entry.dayName} · {entry.lecture.room}
                  </p>
                </div>
                {entry.isNow && (
                  <span className="self-center rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                    Now
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent notices</h2>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="space-y-3 text-sm">
            {notices.length === 0 ? (
              <li className="py-4 text-center text-muted-foreground">No recent notices</li>
            ) : (
              notices.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-border p-3 hover:bg-secondary/60"
                >
                  {n.title}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
