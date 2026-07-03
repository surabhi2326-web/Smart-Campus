
// import { createFileRoute, Link } from "@tanstack/react-router";
// import { useEffect, useState } from "react";

// import {
//   Calendar,
//   CheckCircle2,
//   Clock,
//   TrendingUp,
//   ArrowUpRight,
//   Plus,
//   BookOpen,
//   Megaphone,
//   NotebookPen,
// } from "lucide-react";

// import { auth, db } from "@/firebase/firebase";
// import { onAuthStateChanged } from "firebase/auth";

// import {
//   collection,
//   getDocs,
//   query,
//   where,
//   doc,
//   getDoc,
//   orderBy,
//   limit,
//   Timestamp,
// } from "firebase/firestore";

// export const Route = createFileRoute("/_app/dashboard")({
//   head: () => ({
//     meta: [
//       { title: "Dashboard — Smart Campus" },
//       {
//         name: "description",
//         content: "Your day at a glance: classes, tasks, attendance and notices.",
//       },
//     ],
//   }),
//   component: Dashboard,
// });

// function Dashboard() {
//   const [name, setName] = useState("Student");
//   const [pendingTasks, setPendingTasks] = useState(0);
//   const [userName, setUserName] = useState("");
//   const [todayLectures, setTodayLectures] = useState<any[]>([]);
//   const [tasks, setTasks] = useState<any[]>([]);

//   // Attendance: % present, computed from the "attendance" collection
//   const [attendance, setAttendance] = useState<{
//     percent: number;
//     present: number;
//     total: number;
//   } | null>(null);

//   // Recent notices from the "notices" collection
//   const [notices, setNotices] = useState<any[]>([]);

//   // Productivity: tasks done comes from the "tasks" collection,
//   // focusMinutes / streak are assumed to live on the user's doc
//   const [productivity, setProductivity] = useState<{
//     tasksDone: number;
//     totalTasks: number;
//     focusMinutes: number | null;
//     streak: number | null;
//   }>({ tasksDone: 0, totalTasks: 0, focusMinutes: null, streak: null });

//   const now = new Date();
//   const today = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

//   const hours = now.getHours();
//   const greet = hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";

//   // Real dates for the current week (Mon–Sun), no more hardcoded "28 + i"
//   const weekDates = getCurrentWeekDates();
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (!user) return;

//       // Load user name
//       const userQuery = query(collection(db, "users"), where("uid", "==", user.uid));

//       const userSnap = await getDocs(userQuery);

//       if (!userSnap.empty) {
//         setName(userSnap.docs[0].data().name);
//       }

//       // Load pending tasks
//       const taskQuery = query(
//         collection(db, "tasks"),
//         where("userId", "==", user.uid),
//         where("status", "==", "Pending"),
//       );

//       const taskSnap = await getDocs(taskQuery);

//       setPendingTasks(taskSnap.size);
//       setTasks(
//         taskSnap.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         })),
//       );
//       const userDoc = await getDoc(doc(db, "users", user.uid));

//       const section = userDoc.data()?.section;

//       const lectureQuery = query(
//         collection(db, "lectures"),
//         where("section", "==", section),
//         where("day", "==", today),
//       );

//       const lectureSnap = await getDocs(lectureQuery);

//       setTodayLectures(
//         lectureSnap.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         })),
//       );

//       // Attendance — assumes an "attendance" collection with one doc per
//       // session: { userId, status: "Present" | "Absent" }
//       const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", user.uid));
//       const attendanceSnap = await getDocs(attendanceQuery);

//       if (!attendanceSnap.empty) {
//         const total = attendanceSnap.size;
//         const present = attendanceSnap.docs.filter((d) => d.data().status === "Present").length;
//         setAttendance({ percent: Math.round((present / total) * 100), present, total });
//       } else {
//         setAttendance({ percent: 0, present: 0, total: 0 });
//       }

//       // Notices — assumes a "notices" collection with { title, tag, createdAt: Timestamp }
//       const noticesQuery = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(3));
//       const noticesSnap = await getDocs(noticesQuery);

//       setNotices(
//         noticesSnap.docs.map((d) => ({
//           id: d.id,
//           ...d.data(),
//         })),
//       );

//       // Productivity — "tasks done" from the full tasks list;
//       // focusMinutes / streak assumed to live directly on the user doc
//       const allTasksQuery = query(collection(db, "tasks"), where("userId", "==", user.uid));
//       const allTasksSnap = await getDocs(allTasksQuery);

//       const totalTasks = allTasksSnap.size;
//       const tasksDone = allTasksSnap.docs.filter((d) => d.data().status === "Completed").length;
//       const userData = userDoc.data();

//       setProductivity({
//         tasksDone,
//         totalTasks,
//         focusMinutes: typeof userData?.focusMinutes === "number" ? userData.focusMinutes : null,
//         streak: typeof userData?.streak === "number" ? userData.streak : null,
//       });
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <div className="mx-auto max-w-7xl space-y-6">
//       <section className="relative overflow-hidden rounded-3xl border border-border bg-hero p-8 shadow-soft">
//         <div className="max-w-2xl">
//           <p className="text-sm text-muted-foreground">
//             {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
//           </p>
//           <h1 className="mt-2 font-display text-4xl sm:text-5xl">
//             {greet}, {name}
//           </h1>
//           You have <span className="font-medium text-foreground">{pendingTasks} pending tasks</span>{" "}
//           today.
//           <div className="mt-5 flex flex-wrap gap-2">
//             <Link
//               to="/tasks"
//               className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
//             >
//               <Plus className="h-4 w-4" /> New task
//             </Link>
//             <Link
//               to="/timetable"
//               className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary"
//             >
//               View timetable
//             </Link>
//           </div>
//         </div>
//       </section>

//       <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
//         <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2 lg:row-span-2">
//           <div className="mb-5 flex items-center justify-between">
//             <div>
//               <h2 className="text-lg font-semibold">Today's timetable</h2>
//               <p className="text-sm text-muted-foreground">{today}</p>
//             </div>
//             <Link
//               to="/timetable"
//               className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
//             >
//               Open <ArrowUpRight className="h-3.5 w-3.5" />
//             </Link>
//           </div>
//           <ol className="space-y-3">
//             {todayLectures.length === 0 && (
//               <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
//                 No lectures scheduled for today.
//               </li>
//             )}
//             {todayLectures.map((c) => (
//               <li
//                 key={c.id}
//                 className={`group flex items-stretch gap-4 rounded-xl border p-4 transition ${c.active ? "border-primary/30 bg-primary-soft/40" : "border-border hover:border-foreground/20"}`}
//               >
//                 <div className="flex w-20 flex-col text-sm">
//                   <span className="font-semibold">{c.startTime}</span>
//                   <span className="text-muted-foreground">{c.endTime}</span>
//                 </div>
//                 <div className="w-1 rounded-full bg-blue-500" />
//                 <div className="flex-1 min-w-0">
//                   <p className="font-medium">{c.subject}</p>
//                   <p className="text-sm text-muted-foreground">{c.room}</p>
//                 </div>
//                 <span className="self-center rounded-full bg-primary px-2 py-1 text-xs text-white">
//                   Class
//                 </span>
//               </li>
//             ))}
//           </ol>
//         </div>

//         <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
//           <div className="mb-4 flex items-center justify-between">
//             <h2 className="text-lg font-semibold">Pending tasks</h2>
//             <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
//           </div>
//           <ul className="space-y-3 text-sm">
//             {tasks.length === 0 ? (
//               <li className="text-center text-muted-foreground py-6">No pending tasks</li>
//             ) : (
//               tasks.map((t) => (
//                 <li key={t.id} className="flex items-start gap-3">
//                   <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border" />

//                   <div className="flex-1 min-w-0">
//                     <p className="truncate font-medium">{t.title}</p>

//                     <p className="text-xs text-muted-foreground">
//                       Due: {t.dueDate || "No Due Date"}
//                     </p>
//                   </div>

//                   <span
//                     className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
//                       t.priority === "High"
//                         ? "bg-destructive/10 text-destructive"
//                         : t.priority === "Medium"
//                           ? "bg-yellow-100 text-yellow-700"
//                           : "bg-secondary text-muted-foreground"
//                     }`}
//                   >
//                     {t.priority}
//                   </span>
//                 </li>
//               ))
//             )}
//           </ul>
//         </div>

//         <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
//           <div className="mb-4 flex items-center justify-between">
//             <h2 className="text-lg font-semibold">Attendance</h2>
//             <TrendingUp className="h-4 w-4 text-success" />
//           </div>
//           <div className="flex items-end gap-2">
//             <span className="font-display text-5xl">
//               {attendance ? `${attendance.percent}%` : "—"}
//             </span>
//           </div>
//           <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
//             <div
//               className="h-full rounded-full bg-primary"
//               style={{ width: `${attendance?.percent ?? 0}%` }}
//             />
//           </div>
//           <p className="mt-3 text-xs text-muted-foreground">
//             {attendance && attendance.total > 0
//               ? `${attendance.present} of ${attendance.total} sessions attended`
//               : "No attendance records yet."}
//           </p>
//         </div>

//         <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
//           <div className="mb-4 flex items-center justify-between">
//             <h2 className="text-lg font-semibold">This week</h2>
//             <Calendar className="h-4 w-4 text-muted-foreground" />
//           </div>
//           <div className="grid grid-cols-7 gap-1 text-center text-xs">
//             {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
//               <div key={i} className="text-muted-foreground">
//                 {d}
//               </div>
//             ))}
//             {weekDates.map((d, i) => (
//               <div
//                 key={i}
//                 className={`aspect-square grid place-items-center rounded-lg text-sm ${d.isToday ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-secondary"}`}
//               >
//                 {d.date}
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
//           <div className="mb-4 flex items-center justify-between">
//             <h2 className="text-lg font-semibold">Recent notices</h2>
//             <Link to="/notices" className="text-sm text-primary hover:underline">
//               All
//             </Link>
//           </div>
//           <ul className="divide-y divide-border">
//             {notices.length === 0 ? (
//               <li className="py-6 text-center text-sm text-muted-foreground">No recent notices</li>
//             ) : (
//               notices.map((n) => (
//                 <li key={n.id} className="flex items-center gap-3 py-3">
//                   <span className="rounded-md bg-secondary px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
//                     {n.tag}
//                   </span>
//                   <p className="flex-1 truncate text-sm">{n.title}</p>
//                   <span className="text-xs text-muted-foreground">
//                     {n.createdAt instanceof Timestamp
//                       ? formatRelativeTime(n.createdAt.toDate())
//                       : ""}
//                   </span>
//                 </li>
//               ))
//             )}
//           </ul>
//         </div>

//         <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
//           <div className="mb-4 flex items-center justify-between">
//             <h2 className="text-lg font-semibold">Quick notes</h2>
//             <NotebookPen className="h-4 w-4 text-muted-foreground" />
//           </div>
//           <textarea
//             placeholder="Jot down a thought…"
//             className="h-24 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
//           />
//           <Link to="/notes" className="mt-3 inline-flex text-sm text-primary hover:underline">
//             Open notes
//           </Link>
//         </div>

//         <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
//           <div className="mb-4 flex items-center justify-between">
//             <h2 className="text-lg font-semibold">Productivity</h2>
//             <Clock className="h-4 w-4 text-muted-foreground" />
//           </div>
//           <div className="space-y-3">
//             <Row
//               label="Focus time"
//               value={
//                 productivity.focusMinutes != null ? formatMinutes(productivity.focusMinutes) : "—"
//               }
//             />
//             <Row
//               label="Tasks done"
//               value={`${productivity.tasksDone} / ${productivity.totalTasks}`}
//             />
//             <Row
//               label="Streak"
//               value={productivity.streak != null ? `${productivity.streak} days` : "—"}
//             />
//           </div>
//         </div>

//         <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
//           <h2 className="mb-4 text-lg font-semibold">Quick actions</h2>
//           <div className="grid grid-cols-2 gap-2 text-sm">
//             <ActionLink to="/tasks" icon={<CheckCircle2 className="h-4 w-4" />} label="Add task" />
//             <ActionLink to="/timetable" icon={<Calendar className="h-4 w-4" />} label="Add class" />
//             <ActionLink to="/notes" icon={<BookOpen className="h-4 w-4" />} label="New note" />
//             <ActionLink to="/notices" icon={<Megaphone className="h-4 w-4" />} label="Notices" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function getCurrentWeekDates() {
//   const now = new Date();
//   const dayIndex = (now.getDay() + 6) % 7; // 0 = Monday ... 6 = Sunday
//   const monday = new Date(now);
//   monday.setDate(now.getDate() - dayIndex);

//   return Array.from({ length: 7 }).map((_, i) => {
//     const d = new Date(monday);
//     d.setDate(monday.getDate() + i);
//     return {
//       date: d.getDate(),
//       isToday: d.toDateString() === now.toDateString(),
//     };
//   });
// }

// function formatRelativeTime(date: Date) {
//   const diffMs = Date.now() - date.getTime();
//   const diffMins = Math.round(diffMs / 60000);

//   if (diffMins < 1) return "just now";
//   if (diffMins < 60) return `${diffMins}m ago`;

//   const diffHours = Math.round(diffMins / 60);
//   if (diffHours < 24) return `${diffHours}h ago`;

//   const diffDays = Math.round(diffHours / 24);
//   return `${diffDays}d ago`;
// }

// function formatMinutes(totalMinutes: number) {
//   const h = Math.floor(totalMinutes / 60);
//   const m = totalMinutes % 60;
//   return h > 0 ? `${h}h ${m}m` : `${m}m`;
// }

// function Row({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="flex items-center justify-between text-sm">
//       <span className="text-muted-foreground">{label}</span>
//       <span className="font-medium">{value}</span>
//     </div>
//   );
// }

// function ActionLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
//   return (
//     <Link
//       to={to as any}
//       className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 hover:bg-secondary"
//     >
//       {icon}
//       <span>{label}</span>
//     </Link>
//   );
// }
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Plus,
  BookOpen,
  Megaphone,
  NotebookPen,
} from "lucide-react";

import { auth, db } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Smart Campus" },
      {
        name: "description",
        content: "Your day at a glance: classes, tasks, attendance and notices.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [name, setName] = useState("Student");
  const [pendingTasks, setPendingTasks] = useState(0);
  const [userName, setUserName] = useState("");
  const [todayLectures, setTodayLectures] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Attendance: % present, computed from the "attendance" collection
  const [attendance, setAttendance] = useState<{ percent: number; present: number; total: number } | null>(
    null,
  );

  // Recent notices from the "notices" collection
  const [notices, setNotices] = useState<any[]>([]);

  // Productivity: tasks done comes from the "tasks" collection,
  // focusMinutes / streak are assumed to live on the user's doc
  const [productivity, setProductivity] = useState<{
    tasksDone: number;
    totalTasks: number;
    focusMinutes: number | null;
    streak: number | null;
  }>({ tasksDone: 0, totalTasks: 0, focusMinutes: null, streak: null });

  const now = new Date();
  const today = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

  const hours = now.getHours();
  const greet = hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";

  // Real dates for the current week (Mon–Sun), no more hardcoded "28 + i"
  const weekDates = getCurrentWeekDates();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      // Load user name
      const userQuery = query(collection(db, "users"), where("uid", "==", user.uid));

      const userSnap = await getDocs(userQuery);

      if (!userSnap.empty) {
        setName(userSnap.docs[0].data().name);
      }

      // Load pending tasks
      const taskQuery = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid),
        where("status", "==", "Pending"),
      );

      const taskSnap = await getDocs(taskQuery);

      setPendingTasks(taskSnap.size);
      setTasks(
        taskSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      );
      const userDoc = await getDoc(doc(db, "users", user.uid));

      const section = userDoc.data()?.section;

      
      const lectureQuery = query(
        collection(db, "lectures"),
        where("section", "==", section),
        where("day", "==", today),
      );

      const lectureSnap = await getDocs(lectureQuery);

      setTodayLectures(
        lectureSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      );

      // Attendance — from the "attendance" collection, matched by studentId
      // (the field the teacher's attendance page actually writes)
      const attendanceQuery = query(collection(db, "attendance"), where("studentId", "==", user.uid));
      const attendanceSnap = await getDocs(attendanceQuery);

      if (!attendanceSnap.empty) {
        const total = attendanceSnap.size;
        const present = attendanceSnap.docs.filter((d) => d.data().status === "Present").length;
        setAttendance({ percent: Math.round((present / total) * 100), present, total });
      } else {
        setAttendance({ percent: 0, present: 0, total: 0 });
      }

      // Notices — assumes a "notices" collection with { title, tag, createdAt: Timestamp }
      const noticesQuery = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(3));
      const noticesSnap = await getDocs(noticesQuery);

      setNotices(
        noticesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })),
      );

      // Productivity — "tasks done" from the full tasks list;
      // focusMinutes / streak assumed to live directly on the user doc
      const allTasksQuery = query(collection(db, "tasks"), where("userId", "==", user.uid));
      const allTasksSnap = await getDocs(allTasksQuery);

      const totalTasks = allTasksSnap.size;
      const tasksDone = allTasksSnap.docs.filter((d) => d.data().status === "Completed").length;
      const userData = userDoc.data();

      setProductivity({
        tasksDone,
        totalTasks,
        focusMinutes: typeof userData?.focusMinutes === "number" ? userData.focusMinutes : null,
        streak: typeof userData?.streak === "number" ? userData.streak : null,
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-hero p-8 shadow-soft">
        <div className="max-w-2xl">
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">
            {greet}, {name}
          </h1>
          You have <span className="font-medium text-foreground">{pendingTasks} pending tasks</span>{" "}
          today.
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New task
            </Link>
            <Link
              to="/timetable"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              View timetable
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2 lg:row-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Today's timetable</h2>
              <p className="text-sm text-muted-foreground">{today}</p>
            </div>
            <Link
              to="/timetable"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Open <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ol className="space-y-3">
            {todayLectures.length === 0 && (
              <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No lectures scheduled for today.
              </li>
            )}
            {todayLectures.map((c) => (
              <li
                key={c.id}
                className={`group flex items-stretch gap-4 rounded-xl border p-4 transition ${c.active ? "border-primary/30 bg-primary-soft/40" : "border-border hover:border-foreground/20"}`}
              >
                <div className="flex w-20 flex-col text-sm">
                  <span className="font-semibold">{c.startTime}</span>
                  <span className="text-muted-foreground">{c.endTime}</span>
                </div>
                <div className="w-1 rounded-full bg-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{c.subject}</p>
                  <p className="text-sm text-muted-foreground">{c.room}</p>
                </div>
                <span className="self-center rounded-full bg-primary px-2 py-1 text-xs text-white">
                  Class
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending tasks</h2>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="space-y-3 text-sm">
            {tasks.length === 0 ? (
              <li className="text-center text-muted-foreground py-6">No pending tasks</li>
            ) : (
              tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border" />

                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{t.title}</p>

                    <p className="text-xs text-muted-foreground">
                      
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      t.priority === "High"
                        ? "bg-destructive/10 text-destructive"
                        : t.priority === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {t.priority}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Attendance</h2>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div className="flex items-end gap-2">
            <span className="font-display text-5xl">{attendance ? `${attendance.percent}%` : "—"}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${attendance?.percent ?? 0}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {attendance && attendance.total > 0
              ? `${attendance.present} of ${attendance.total} sessions attended`
              : "No attendance records yet."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">This week</h2>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-muted-foreground">
                {d}
              </div>
            ))}
            {weekDates.map((d, i) => (
              <div
                key={i}
                className={`aspect-square grid place-items-center rounded-lg text-sm ${d.isToday ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-secondary"}`}
              >
                {d.date}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent notices</h2>
            <Link to="/notices" className="text-sm text-primary hover:underline">
              All
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {notices.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">No recent notices</li>
            ) : (
              notices.map((n) => (
                <li key={n.id} className="flex items-center gap-3 py-3">
                  <span className="rounded-md bg-secondary px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {n.tag}
                  </span>
                  <p className="flex-1 truncate text-sm">{n.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {n.createdAt instanceof Timestamp ? formatRelativeTime(n.createdAt.toDate()) : ""}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick notes</h2>
            <NotebookPen className="h-4 w-4 text-muted-foreground" />
          </div>
          <textarea
            placeholder="Jot down a thought…"
            className="h-24 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Link to="/notes" className="mt-3 inline-flex text-sm text-primary hover:underline">
            Open notes
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Productivity</h2>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <Row
              label="Focus time"
              value={productivity.focusMinutes != null ? formatMinutes(productivity.focusMinutes) : "—"}
            />
            <Row label="Tasks done" value={`${productivity.tasksDone} / ${productivity.totalTasks}`} />
            <Row
              label="Streak"
              value={productivity.streak != null ? `${productivity.streak} days` : "—"}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold">Quick actions</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <ActionLink to="/tasks" icon={<CheckCircle2 className="h-4 w-4" />} label="Add task" />
            <ActionLink to="/timetable" icon={<Calendar className="h-4 w-4" />} label="Add class" />
            <ActionLink to="/notes" icon={<BookOpen className="h-4 w-4" />} label="New note" />
            <ActionLink to="/notices" icon={<Megaphone className="h-4 w-4" />} label="Notices" />
          </div>
        </div>
      </div>
    </div>
  );
}

function getCurrentWeekDates() {
  const now = new Date();
  const dayIndex = (now.getDay() + 6) % 7; // 0 = Monday ... 6 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayIndex);

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: d.getDate(),
      isToday: d.toDateString() === now.toDateString(),
    };
  });
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ActionLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to as any}
      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 hover:bg-secondary"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
