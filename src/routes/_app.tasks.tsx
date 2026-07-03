
// import { createFileRoute } from "@tanstack/react-router";
// import { useEffect, useState } from "react";
// import { Plus, Search, Filter, Flag, Calendar, Link2, FileText, GraduationCap } from "lucide-react";
// import { PageHeader } from "@/components/page-header";
// import { auth, db } from "@/firebase/firebase";
// import {
//   addDoc,
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   query,
//   serverTimestamp,
//   setDoc,
//   updateDoc,
//   where,
// } from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";

// export const Route = createFileRoute("/_app/tasks")({
//   head: () => ({
//     meta: [
//       { title: "Tasks — Smart Campus" },
//       { name: "description", content: "Plan, prioritize and complete your tasks." },
//     ],
//   }),
//   component: Tasks,
// });

// type Status = "Pending" | "Completed" | "Overdue";

// // A personal to-do the student created themselves.
// type PersonalTask = {
//   id: string;
//   title: string;
//   subject: string;
//   due: string;
//   priority: "High" | "Medium" | "Low";
//   status: Status;
// };

// // An assignment set by a teacher for the student's section (+ semester if set).
// type Assignment = {
//   id: string;
//   title: string;
//   subject: string;
//   dueDate: string;
//   section: string;
//   semester: string;
// };

// // One row in the unified list rendered on screen.
// type UnifiedTask = {
//   id: string;
//   kind: "personal" | "assignment";
//   title: string;
//   subject: string;
//   due: string;
//   priority: "High" | "Medium" | "Low";
//   completed: boolean;
//   submissionLink?: string;
// };

// const tabs = ["All", "Pending", "Completed", "Overdue"] as const;

// function todayISO() {
//   return new Date().toISOString().slice(0, 10);
// }

// function computeStatus(completed: boolean, due: string): Status {
//   if (completed) return "Completed";
//   if (due && due < todayISO()) return "Overdue";
//   return "Pending";
// }

// function Tasks() {
//   const [tab, setTab] = useState<(typeof tabs)[number]>("All");

//   const [userId, setUserId] = useState("");
//   const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
//   const [assignments, setAssignments] = useState<Assignment[]>([]);
//   const [submissions, setSubmissions] = useState<
//     Record<string, { completed: boolean; submissionLink?: string }>
//   >({});
//   const [loading, setLoading] = useState(true);
//   const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
//   const [savingLinkId, setSavingLinkId] = useState<string | null>(null);

//   const [showModal, setShowModal] = useState(false);
//   const [title, setTitle] = useState("");
//   const [subject, setSubject] = useState("");
//   const [priority, setPriority] = useState("Medium");
//   const [due, setDue] = useState("");

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setUserId(user.uid);
//         loadEverything(user.uid);
//       } else {
//         setLoading(false);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   async function loadEverything(uid: string) {
//     setLoading(true);
//     try {
//       const [personal, profileSnap] = await Promise.all([
//         getDocs(query(collection(db, "tasks"), where("userId", "==", uid))),
//         getDoc(doc(db, "users", uid)),
//       ]);

//       setPersonalTasks(
//         personal.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PersonalTask, "id">) })),
//       );

//       const profile = profileSnap.exists() ? profileSnap.data() : null;
//       const section = profile?.section as string | undefined;
//       const semester = profile?.semester as string | undefined;

//       if (section) {
//         const aq = query(collection(db, "assignments"), where("section", "==", section));
//         const aSnap = await getDocs(aq);
//         let list = aSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Assignment[];
//         if (semester) {
//           list = list.filter((a) => !a.semester || a.semester === semester);
//         }
//         setAssignments(list);
//       } else {
//         setAssignments([]);
//       }

//       const sq = query(collection(db, "submissions"), where("studentId", "==", uid));
//       const sSnap = await getDocs(sq);
//       const subMap: Record<string, { completed: boolean; submissionLink?: string }> = {};
//       sSnap.docs.forEach((d) => {
//         const data = d.data();
//         subMap[data.assignmentId] = {
//           completed: data.status === "Completed",
//           submissionLink: data.submissionLink,
//         };
//       });
//       setSubmissions(subMap);
//     } catch (error) {
//       console.error(error);
//     }
//     setLoading(false);
//   }

//   async function saveTask() {
//     if (!title || !subject || !due) {
//       alert("Please fill all fields");
//       return;
//     }

//     try {
//       await addDoc(collection(db, "tasks"), {
//         userId,
//         title,
//         subject,
//         due,
//         priority,
//         status: "Pending",
//         createdAt: serverTimestamp(),
//       });

//       setTitle("");
//       setSubject("");
//       setDue("");
//       setPriority("Medium");
//       setShowModal(false);

//       loadEverything(userId);
//     } catch (error) {
//       console.error(error);
//       alert("Failed to save task.");
//     }
//   }

//   async function togglePersonal(t: PersonalTask) {
//     const newStatus: Status = t.status === "Completed" ? "Pending" : "Completed";
//     setPersonalTasks((list) => list.map((x) => (x.id === t.id ? { ...x, status: newStatus } : x)));
//     await updateDoc(doc(db, "tasks", t.id), { status: newStatus });
//   }

//   async function toggleAssignment(assignmentId: string, subject: string, section: string) {
//     const current = submissions[assignmentId];
//     const newCompleted = !current?.completed;
//     setSubmissions((s) => ({
//       ...s,
//       [assignmentId]: { ...s[assignmentId], completed: newCompleted },
//     }));
//     await setDoc(
//       doc(db, "submissions", `${assignmentId}_${userId}`),
//       {
//         assignmentId,
//         studentId: userId,
//         subject,
//         section,
//         status: newCompleted ? "Completed" : "Pending",
//         completedAt: serverTimestamp(),
//       },
//       { merge: true },
//     );
//   }

//   // No Firebase Storage — students paste a link (Google Drive, GitHub, etc.)
//   // to whatever file they want to submit, instead of uploading a binary.
//   async function submitLink(assignment: Assignment) {
//     const link = (linkDrafts[assignment.id] ?? "").trim();
//     if (!link) {
//       alert("Paste a link first (Google Drive, GitHub, etc.)");
//       return;
//     }
//     if (!/^https?:\/\//i.test(link)) {
//       alert("That doesn't look like a valid link — it should start with http:// or https://");
//       return;
//     }

//     setSavingLinkId(assignment.id);
//     try {
//       await setDoc(
//         doc(db, "submissions", `${assignment.id}_${userId}`),
//         {
//           assignmentId: assignment.id,
//           studentId: userId,
//           subject: assignment.subject,
//           section: assignment.section,
//           status: "Completed",
//           submissionLink: link,
//           completedAt: serverTimestamp(),
//         },
//         { merge: true },
//       );

//       setSubmissions((s) => ({
//         ...s,
//         [assignment.id]: { completed: true, submissionLink: link },
//       }));
//       setLinkDrafts((d) => ({ ...d, [assignment.id]: "" }));
//     } catch (error) {
//       console.error(error);
//       alert("Couldn't save your submission. Please try again.");
//     }
//     setSavingLinkId(null);
//   }

//   const unified: UnifiedTask[] = [
//     ...personalTasks.map((t) => ({
//       id: t.id,
//       kind: "personal" as const,
//       title: t.title,
//       subject: t.subject,
//       due: t.due,
//       priority: t.priority,
//       completed: t.status === "Completed",
//     })),
//     ...assignments.map((a) => ({
//       id: a.id,
//       kind: "assignment" as const,
//       title: a.title,
//       subject: a.subject,
//       due: a.dueDate,
//       priority: "Medium" as const,
//       completed: submissions[a.id]?.completed ?? false,
//       submissionLink: submissions[a.id]?.submissionLink,
//     })),
//   ].sort((a, b) => (a.due || "").localeCompare(b.due || ""));

//   const list = unified.filter((t) => {
//     const status = computeStatus(t.completed, t.due);
//     if (tab === "All") return true;
//     return status === tab;
//   });

//   return (
//     <div className="mx-auto max-w-6xl">
//       <>
//         {showModal && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//             <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
//               <h2 className="mb-4 text-xl font-semibold">Add New Task</h2>

//               <input
//                 className="mb-3 w-full rounded-lg border p-2"
//                 placeholder="Task Title"
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//               />

//               <input
//                 className="mb-3 w-full rounded-lg border p-2"
//                 placeholder="Subject"
//                 value={subject}
//                 onChange={(e) => setSubject(e.target.value)}
//               />

//               <input
//                 type="date"
//                 className="mb-3 w-full rounded-lg border p-2"
//                 value={due}
//                 onChange={(e) => setDue(e.target.value)}
//               />

//               <select
//                 className="mb-5 w-full rounded-lg border p-2"
//                 value={priority}
//                 onChange={(e) => setPriority(e.target.value)}
//               >
//                 <option>High</option>
//                 <option>Medium</option>
//                 <option>Low</option>
//               </select>

//               <div className="flex gap-3">
//                 <button
//                   className="flex-1 rounded-lg bg-gray-200 py-2"
//                   onClick={() => setShowModal(false)}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   onClick={saveTask}
//                   className="flex-1 rounded-lg bg-blue-600 py-2 text-white"
//                 >
//                   Save Task
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </>
//       <PageHeader
//         title="Tasks"
//         description="Stay on top of what's next — personal to-dos and assignments in one place."
//         action={
//           <button
//             onClick={() => setShowModal(true)}
//             className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
//           >
//             <Plus className="h-4 w-4" />
//             New Task
//           </button>
//         }
//       />

//       <div className="mb-6 flex flex-wrap items-center gap-3">
//         <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
//           <Search className="h-4 w-4 text-muted-foreground" />
//           <input
//             placeholder="Search tasks"
//             className="w-full bg-transparent placeholder:text-muted-foreground focus:outline-none"
//           />
//         </div>
//         <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
//           <Filter className="h-4 w-4" /> Filter
//         </button>
//       </div>

//       <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
//         {tabs.map((t) => (
//           <button
//             key={t}
//             onClick={() => setTab(t)}
//             className={`rounded-md px-3 py-1.5 text-sm transition ${tab === t ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
//           >
//             {t}
//           </button>
//         ))}
//       </div>

//       {loading && <p className="text-sm text-muted-foreground">Loading tasks…</p>}

//       {!loading && list.length === 0 ? (
//         <Empty />
//       ) : (
//         <ul className="space-y-3">
//           {list.map((t) => {
//             const status = computeStatus(t.completed, t.due);
//             const assignment =
//               t.kind === "assignment" ? assignments.find((a) => a.id === t.id) : undefined;
//             return (
//               <li
//                 key={`${t.kind}-${t.id}`}
//                 className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:shadow-lift"
//               >
//                 <div className="flex items-start gap-4">
//                   <input
//                     type="checkbox"
//                     checked={t.completed}
//                     onChange={() =>
//                       t.kind === "personal"
//                         ? togglePersonal(personalTasks.find((p) => p.id === t.id)!)
//                         : toggleAssignment(t.id, t.subject, assignment?.section ?? "")
//                     }
//                     className="mt-1 h-4 w-4 rounded border-border"
//                   />
//                   <div className="min-w-0 flex-1">
//                     <div className="flex flex-wrap items-center gap-2">
//                       <h3
//                         className={`font-medium ${status === "Completed" ? "line-through text-muted-foreground" : ""}`}
//                       >
//                         {t.title}
//                       </h3>
//                       <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
//                         {t.subject}
//                       </span>
//                       {t.kind === "assignment" && (
//                         <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
//                           <GraduationCap className="h-3 w-3" /> Assignment
//                         </span>
//                       )}
//                     </div>
//                     <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
//                       <span className="inline-flex items-center gap-1">
//                         <Calendar className="h-3.5 w-3.5" /> {t.due}
//                       </span>
//                       {t.kind === "personal" && (
//                         <span
//                           className={`inline-flex items-center gap-1 ${t.priority === "High" ? "text-destructive" : ""}`}
//                         >
//                           <Flag className="h-3.5 w-3.5" /> {t.priority}
//                         </span>
//                       )}
//                       {t.kind === "assignment" && t.submissionLink && (
//                         <a
//                           href={t.submissionLink}
//                           target="_blank"
//                           rel="noreferrer"
//                           className="inline-flex items-center gap-1 text-primary hover:underline"
//                         >
//                           <FileText className="h-3.5 w-3.5" /> View submission
//                         </a>
//                       )}
//                     </div>

//                     {t.kind === "assignment" && (
//                       <div className="mt-3 flex flex-wrap items-center gap-2">
//                         <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs">
//                           <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
//                           <input
//                             placeholder="Paste Google Drive / GitHub link…"
//                             value={linkDrafts[t.id] ?? ""}
//                             onChange={(e) =>
//                               setLinkDrafts((d) => ({ ...d, [t.id]: e.target.value }))
//                             }
//                             className="w-full bg-transparent placeholder:text-muted-foreground focus:outline-none"
//                           />
//                         </div>
//                         <button
//                           onClick={() => assignment && submitLink(assignment)}
//                           disabled={savingLinkId === t.id}
//                           className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
//                         >
//                           {savingLinkId === t.id
//                             ? "Saving…"
//                             : t.submissionLink
//                               ? "Update link"
//                               : "Submit"}
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                   <span
//                     className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${status === "Overdue" ? "bg-destructive/10 text-destructive" : status === "Completed" ? "bg-success/10 text-success" : "bg-primary-soft text-primary"}`}
//                   >
//                     {status}
//                   </span>
//                 </div>
//               </li>
//             );
//           })}
//         </ul>
//       )}
//     </div>
//   );
// }

// function Empty() {
//   return (
//     <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
//       <p className="font-medium">Nothing here yet.</p>
//       <p className="mt-1 text-sm text-muted-foreground">
//         Create your first task, or wait for your teacher to post an assignment.
//       </p>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Search, Filter, Flag, Calendar, Link2, FileText, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { auth, db } from "@/firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Smart Campus" },
      { name: "description", content: "Plan, prioritize and complete your tasks." },
    ],
  }),
  component: Tasks,
});

type Status = "Pending" | "Completed" | "Overdue";

// A personal to-do the student created themselves.
type PersonalTask = {
  id: string;
  title: string;
  subject: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: Status;
};

// An assignment set by a teacher for the student's department + section (+ semester if set).
type Assignment = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  department: string;
  section: string;
  semester: string;
};

// One row in the unified list rendered on screen.
type UnifiedTask = {
  id: string;
  kind: "personal" | "assignment";
  title: string;
  subject: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  submissionLink?: string;
};

const tabs = ["All", "Pending", "Completed", "Overdue"] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function computeStatus(completed: boolean, due: string): Status {
  if (completed) return "Completed";
  if (due && due < todayISO()) return "Overdue";
  return "Pending";
}

function Tasks() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");

  const [userId, setUserId] = useState("");
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<
    Record<string, { completed: boolean; submissionLink?: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [due, setDue] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadEverything(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function loadEverything(uid: string) {
    setLoading(true);
    try {
      const [personal, profileSnap] = await Promise.all([
        getDocs(query(collection(db, "tasks"), where("userId", "==", uid))),
        getDoc(doc(db, "users", uid)),
      ]);

      setPersonalTasks(
        personal.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PersonalTask, "id">) })),
      );

      const profile = profileSnap.exists() ? profileSnap.data() : null;
      const department = profile?.department as string | undefined;
      const section = profile?.section as string | undefined;
      const semester = profile?.semester as string | undefined;

      if (department && section) {
        const aq = query(
          collection(db, "assignments"),
          where("department", "==", department),
          where("section", "==", section),
        );
        const aSnap = await getDocs(aq);
        let list = aSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Assignment[];
        if (semester) {
          list = list.filter((a) => !a.semester || a.semester === semester);
        }
        setAssignments(list);
      } else {
        setAssignments([]);
      }

      const sq = query(collection(db, "submissions"), where("studentId", "==", uid));
      const sSnap = await getDocs(sq);
      const subMap: Record<string, { completed: boolean; submissionLink?: string }> = {};
      sSnap.docs.forEach((d) => {
        const data = d.data();
        subMap[data.assignmentId] = {
          completed: data.status === "Completed",
          submissionLink: data.submissionLink,
        };
      });
      setSubmissions(subMap);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  async function saveTask() {
    if (!title || !subject || !due) {
      alert("Please fill all fields");
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
        userId,
        title,
        subject,
        due,
        priority,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setSubject("");
      setDue("");
      setPriority("Medium");
      setShowModal(false);

      loadEverything(userId);
    } catch (error) {
      console.error(error);
      alert("Failed to save task.");
    }
  }

  async function togglePersonal(t: PersonalTask) {
    const newStatus: Status = t.status === "Completed" ? "Pending" : "Completed";
    setPersonalTasks((list) => list.map((x) => (x.id === t.id ? { ...x, status: newStatus } : x)));
    await updateDoc(doc(db, "tasks", t.id), { status: newStatus });
  }

  async function toggleAssignment(
    assignmentId: string,
    subject: string,
    department: string,
    section: string,
  ) {
    const current = submissions[assignmentId];
    const newCompleted = !current?.completed;
    setSubmissions((s) => ({
      ...s,
      [assignmentId]: { ...s[assignmentId], completed: newCompleted },
    }));
    await setDoc(
      doc(db, "submissions", `${assignmentId}_${userId}`),
      {
        assignmentId,
        studentId: userId,
        subject,
        department,
        section,
        status: newCompleted ? "Completed" : "Pending",
        completedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  // No Firebase Storage — students paste a link (Google Drive, GitHub, etc.)
  // to whatever file they want to submit, instead of uploading a binary.
  async function submitLink(assignment: Assignment) {
    const link = (linkDrafts[assignment.id] ?? "").trim();
    if (!link) {
      alert("Paste a link first (Google Drive, GitHub, etc.)");
      return;
    }
    if (!/^https?:\/\//i.test(link)) {
      alert("That doesn't look like a valid link — it should start with http:// or https://");
      return;
    }

    setSavingLinkId(assignment.id);
    try {
      await setDoc(
        doc(db, "submissions", `${assignment.id}_${userId}`),
        {
          assignmentId: assignment.id,
          studentId: userId,
          subject: assignment.subject,
          department: assignment.department,
          section: assignment.section,
          status: "Completed",
          submissionLink: link,
          completedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setSubmissions((s) => ({
        ...s,
        [assignment.id]: { completed: true, submissionLink: link },
      }));
      setLinkDrafts((d) => ({ ...d, [assignment.id]: "" }));
    } catch (error) {
      console.error(error);
      alert("Couldn't save your submission. Please try again.");
    }
    setSavingLinkId(null);
  }

  const unified: UnifiedTask[] = [
    ...personalTasks.map((t) => ({
      id: t.id,
      kind: "personal" as const,
      title: t.title,
      subject: t.subject,
      due: t.due,
      priority: t.priority,
      completed: t.status === "Completed",
    })),
    ...assignments.map((a) => ({
      id: a.id,
      kind: "assignment" as const,
      title: a.title,
      subject: a.subject,
      due: a.dueDate,
      priority: "Medium" as const,
      completed: submissions[a.id]?.completed ?? false,
      submissionLink: submissions[a.id]?.submissionLink,
    })),
  ].sort((a, b) => (a.due || "").localeCompare(b.due || ""));

  const list = unified.filter((t) => {
    const status = computeStatus(t.completed, t.due);
    if (tab === "All") return true;
    return status === tab;
  });

  return (
    <div className="mx-auto max-w-6xl">
      <>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-semibold">Add New Task</h2>

              <input
                className="mb-3 w-full rounded-lg border p-2"
                placeholder="Task Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <input
                className="mb-3 w-full rounded-lg border p-2"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <input
                type="date"
                className="mb-3 w-full rounded-lg border p-2"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />

              <select
                className="mb-5 w-full rounded-lg border p-2"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-lg bg-gray-200 py-2"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  onClick={saveTask}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-white"
                >
                  Save Task
                </button>
              </div>
            </div>
          </div>
        )}
      </>
      <PageHeader
        title="Tasks"
        description="Stay on top of what's next — personal to-dos and assignments in one place."
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search tasks"
            className="w-full bg-transparent placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm transition ${tab === t ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading tasks…</p>}

      {!loading && list.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-3">
          {list.map((t) => {
            const status = computeStatus(t.completed, t.due);
            const assignment =
              t.kind === "assignment" ? assignments.find((a) => a.id === t.id) : undefined;
            return (
              <li
                key={`${t.kind}-${t.id}`}
                className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:shadow-lift"
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() =>
                      t.kind === "personal"
                        ? togglePersonal(personalTasks.find((p) => p.id === t.id)!)
                        : toggleAssignment(
                            t.id,
                            t.subject,
                            assignment?.department ?? "",
                            assignment?.section ?? "",
                          )
                    }
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`font-medium ${status === "Completed" ? "line-through text-muted-foreground" : ""}`}
                      >
                        {t.title}
                      </h3>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {t.subject}
                      </span>
                      {t.kind === "assignment" && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                          <GraduationCap className="h-3 w-3" /> Assignment
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {t.due}
                      </span>
                      {t.kind === "personal" && (
                        <span
                          className={`inline-flex items-center gap-1 ${t.priority === "High" ? "text-destructive" : ""}`}
                        >
                          <Flag className="h-3.5 w-3.5" /> {t.priority}
                        </span>
                      )}
                      {t.kind === "assignment" && t.submissionLink && (
                        <a
                          href={t.submissionLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" /> View submission
                        </a>
                      )}
                    </div>

                    {t.kind === "assignment" && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs">
                          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            placeholder="Paste Google Drive / GitHub link…"
                            value={linkDrafts[t.id] ?? ""}
                            onChange={(e) =>
                              setLinkDrafts((d) => ({ ...d, [t.id]: e.target.value }))
                            }
                            className="w-full bg-transparent placeholder:text-muted-foreground focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => assignment && submitLink(assignment)}
                          disabled={savingLinkId === t.id}
                          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
                        >
                          {savingLinkId === t.id
                            ? "Saving…"
                            : t.submissionLink
                              ? "Update link"
                              : "Submit"}
                        </button>
                      </div>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${status === "Overdue" ? "bg-destructive/10 text-destructive" : status === "Completed" ? "bg-success/10 text-success" : "bg-primary-soft text-primary"}`}
                  >
                    {status}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <p className="font-medium">Nothing here yet.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first task, or wait for your teacher to post an assignment.
      </p>
    </div>
  );
}
