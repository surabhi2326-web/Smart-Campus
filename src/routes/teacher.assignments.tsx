
// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader } from "@/components/page-header";
// import { Plus, Edit3, Trash2, CalendarClock, ChevronDown, ChevronUp, FileText } from "lucide-react";
// import { useEffect, useState } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth, db } from "@/firebase/firebase";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   query,
//   serverTimestamp,
//   updateDoc,
//   where,
// } from "firebase/firestore";

// export const Route = createFileRoute("/teacher/assignments")({
//   head: () => ({ meta: [{ title: "Assignments — Teacher" }] }),
//   component: Assignments,
// });

// type Assignment = {
//   id: string;
//   title: string;
//   subject: string;
//   section: string;
//   semester: string;
//   dueDate: string; // YYYY-MM-DD
//   teacherId: string;
// };

// type Counts = { completed: number; total: number };

// type SubmissionRow = {
//   studentId: string;
//   name: string;
//   status: "Pending" | "Completed";
//   submissionLink?: string;
// };

// function formatDue(d: string) {
//   if (!d) return "";
//   return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
//     weekday: "short",
//     day: "numeric",
//     month: "short",
//   });
// }

// function Assignments() {
//   const [userId, setUserId] = useState("");
//   const [assignments, setAssignments] = useState<Assignment[]>([]);
//   const [counts, setCounts] = useState<Record<string, Counts>>({});
//   const [loading, setLoading] = useState(true);

//   const [showModal, setShowModal] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [title, setTitle] = useState("");
//   const [subject, setSubject] = useState("");
//   const [section, setSection] = useState("");
//   const [semester, setSemester] = useState("");
//   const [dueDate, setDueDate] = useState("");

//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [rows, setRows] = useState<Record<string, SubmissionRow[]>>({});
//   const [rowsLoading, setRowsLoading] = useState<string | null>(null);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setUserId(user.uid);
//         loadAssignments(user.uid);
//       } else {
//         setLoading(false);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   async function loadAssignments(uid: string) {
//     setLoading(true);
//     const q = query(collection(db, "assignments"), where("teacherId", "==", uid));
//     const snapshot = await getDocs(q);
//     const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Assignment[];
//     setAssignments(data);
//     setLoading(false);
//     loadAllCounts(data);
//   }

//   async function loadAllCounts(list: Assignment[]) {
//     const entries = await Promise.all(
//       list.map(async (a) => {
//         const [roster, subs] = await Promise.all([
//           getStudentsForAssignment(a),
//           getDocs(query(collection(db, "submissions"), where("assignmentId", "==", a.id))),
//         ]);
//         const completedIds = new Set(
//           subs.docs.filter((d) => d.data().status === "Completed").map((d) => d.data().studentId),
//         );
//         return [a.id, { completed: completedIds.size, total: roster.length }] as const;
//       }),
//     );
//     setCounts(Object.fromEntries(entries));
//   }

//   async function getStudentsForAssignment(a: Assignment) {
//     const q = query(
//       collection(db, "users"),
//       where("role", "==", "student"),
//       where("section", "==", a.section),
//     );
//     const snap = await getDocs(q);
//     let students = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
//       id: string;
//       name: string;
//       semester?: string;
//     }[];
//     if (a.semester) {
//       students = students.filter((s) => !s.semester || s.semester === a.semester);
//     }
//     return students;
//   }

//   async function toggleExpand(a: Assignment) {
//     if (expandedId === a.id) {
//       setExpandedId(null);
//       return;
//     }
//     setExpandedId(a.id);
//     if (!rows[a.id]) {
//       setRowsLoading(a.id);
//       const [roster, subs] = await Promise.all([
//         getStudentsForAssignment(a),
//         getDocs(query(collection(db, "submissions"), where("assignmentId", "==", a.id))),
//       ]);
//       const subMap = new Map(subs.docs.map((d) => [d.data().studentId as string, d.data()]));
//       const list: SubmissionRow[] = roster.map((s) => {
//         const sub = subMap.get(s.id);
//         return {
//           studentId: s.id,
//           name: s.name ?? s.id,
//           status: sub?.status === "Completed" ? "Completed" : "Pending",
//           submissionLink: sub?.submissionLink,
//         };
//       });
//       setRows((r) => ({ ...r, [a.id]: list }));
//       setRowsLoading(null);
//     }
//   }

//   function openNew() {
//     setEditingId(null);
//     setTitle("");
//     setSubject("");
//     setSection("");
//     setSemester("");
//     setDueDate("");
//     setShowModal(true);
//   }

//   function openEdit(a: Assignment) {
//     setEditingId(a.id);
//     setTitle(a.title);
//     setSubject(a.subject);
//     setSection(a.section);
//     setSemester(a.semester ?? "");
//     setDueDate(a.dueDate);
//     setShowModal(true);
//   }

//   async function saveAssignment() {
//     if (!title || !subject || !section || !dueDate) {
//       alert("Please fill all required fields");
//       return;
//     }

//     const payload = {
//       title: title.trim(),
//       subject: subject.trim(),
//       section: section.trim().toUpperCase(),
//       semester: semester.trim(),
//       dueDate,
//     };

//     if (editingId) {
//       await updateDoc(doc(db, "assignments", editingId), payload);
//     } else {
//       await addDoc(collection(db, "assignments"), {
//         ...payload,
//         teacherId: userId,
//         createdAt: serverTimestamp(),
//       });
//     }

//     setShowModal(false);
//     loadAssignments(userId);
//   }

//   async function deleteAssignment(id: string) {
//     if (!confirm("Delete this assignment? Student submissions for it will remain but be orphaned."))
//       return;
//     await deleteDoc(doc(db, "assignments", id));
//     loadAssignments(userId);
//   }

//   return (
//     <div className="mx-auto max-w-5xl">
//       <>
//         {showModal && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//             <div className="w-full max-w-md rounded-2xl bg-white p-6">
//               <h2 className="mb-4 text-xl font-semibold">
//                 {editingId ? "Edit Assignment" : "New Assignment"}
//               </h2>

//               <input
//                 className="mb-3 w-full rounded-lg border p-2"
//                 placeholder="Assignment Title"
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
//                 className="mb-3 w-full rounded-lg border p-2"
//                 placeholder="Section (e.g. A)"
//                 value={section}
//                 onChange={(e) => setSection(e.target.value)}
//               />
//               <input
//                 className="mb-3 w-full rounded-lg border p-2"
//                 placeholder="Semester (optional, e.g. 3)"
//                 value={semester}
//                 onChange={(e) => setSemester(e.target.value)}
//               />
//               <input
//                 type="date"
//                 className="mb-4 w-full rounded-lg border p-2"
//                 value={dueDate}
//                 onChange={(e) => setDueDate(e.target.value)}
//               />

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setShowModal(false)}
//                   className="flex-1 rounded-lg bg-gray-200 py-2"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={saveAssignment}
//                   className="flex-1 rounded-lg bg-blue-600 py-2 text-white"
//                 >
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </>

//       <PageHeader
//         title="Assignments"
//         description="Create, edit and track submissions."
//         action={
//           <button
//             onClick={openNew}
//             className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
//           >
//             <Plus className="h-4 w-4" /> New assignment
//           </button>
//         }
//       />

//       {loading && <p className="text-sm text-muted-foreground">Loading assignments…</p>}
//       {!loading && assignments.length === 0 && (
//         <p className="text-sm text-muted-foreground">
//           No assignments yet — create one to get started.
//         </p>
//       )}

//       <div className="grid grid-cols-1 gap-4">
//         {assignments.map((a) => {
//           const c = counts[a.id] ?? { completed: 0, total: 0 };
//           const pct = c.total > 0 ? (c.completed / c.total) * 100 : 0;
//           const expanded = expandedId === a.id;
//           return (
//             <div
//               key={a.id}
//               className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
//             >
//               <div className="flex flex-wrap items-start justify-between gap-3">
//                 <div className="min-w-0">
//                   <h3 className="font-medium">{a.title}</h3>
//                   <p className="mt-1 text-xs text-muted-foreground">
//                     {a.subject} · Section {a.section}
//                     {a.semester ? ` · Sem ${a.semester}` : ""} ·{" "}
//                     <span className="inline-flex items-center gap-1">
//                       <CalendarClock className="h-3 w-3" /> Due {formatDue(a.dueDate)}
//                     </span>
//                   </p>
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <button
//                     onClick={() => openEdit(a)}
//                     className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
//                   >
//                     <Edit3 className="h-3.5 w-3.5" />
//                   </button>
//                   <button
//                     onClick={() => deleteAssignment(a.id)}
//                     className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
//                   >
//                     <Trash2 className="h-3.5 w-3.5" />
//                   </button>
//                 </div>
//               </div>

//               <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
//                 <span>Submissions</span>
//                 <span className="font-medium text-foreground">
//                   {c.completed}/{c.total}
//                 </span>
//               </div>
//               <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
//                 <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
//               </div>

//               <button
//                 onClick={() => toggleExpand(a)}
//                 className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
//               >
//                 {expanded ? (
//                   <ChevronUp className="h-3.5 w-3.5" />
//                 ) : (
//                   <ChevronDown className="h-3.5 w-3.5" />
//                 )}
//                 {expanded ? "Hide" : "View"} submissions
//               </button>

//               {expanded && (
//                 <div className="mt-3 divide-y divide-border rounded-xl border border-border">
//                   {rowsLoading === a.id && (
//                     <p className="p-3 text-xs text-muted-foreground">Loading…</p>
//                   )}
//                   {rowsLoading !== a.id &&
//                     (rows[a.id] ?? []).map((r) => (
//                       <div
//                         key={r.studentId}
//                         className="flex items-center justify-between gap-3 p-3 text-xs"
//                       >
//                         <span>{r.name}</span>
//                         <div className="flex items-center gap-2">
//                           {r.submissionLink && (
//                             <a
//                               href={r.submissionLink}
//                               target="_blank"
//                               rel="noreferrer"
//                               className="inline-flex items-center gap-1 text-primary hover:underline"
//                             >
//                               <FileText className="h-3 w-3" /> View submission
//                             </a>
//                           )}
//                           <span
//                             className={`rounded-full px-2 py-0.5 font-medium ${r.status === "Completed" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}
//                           >
//                             {r.status}
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   {rowsLoading !== a.id && (rows[a.id] ?? []).length === 0 && (
//                     <p className="p-3 text-xs text-muted-foreground">
//                       No students found in this section.
//                     </p>
//                   )}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Plus, Edit3, Trash2, CalendarClock, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export const Route = createFileRoute("/teacher/assignments")({
  head: () => ({ meta: [{ title: "Assignments — Teacher" }] }),
  component: Assignments,
});

type Assignment = {
  id: string;
  title: string;
  subject: string;
  department: string;
  section: string;
  semester: string;
  dueDate: string; // YYYY-MM-DD
  teacherId: string;
};

// A department + section pair, as defined by admin under Classes.
type ClassOption = {
  department: string;
  section: string;
};

type Counts = { completed: number; total: number };

type SubmissionRow = {
  studentId: string;
  name: string;
  status: "Pending" | "Completed";
  submissionLink?: string;
};

function formatDue(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function Assignments() {
  const [userId, setUserId] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [counts, setCounts] = useState<Record<string, Counts>>({});
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const departments = [...new Set(classOptions.map((c) => c.department))];
  const sectionsForDept = classOptions
    .filter((c) => c.department === department)
    .map((c) => c.section);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, SubmissionRow[]>>({});
  const [rowsLoading, setRowsLoading] = useState<string | null>(null);

  useEffect(() => {
    loadClassOptions();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadAssignments(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function loadClassOptions() {
    const snapshot = await getDocs(collection(db, "classes"));
    setClassOptions(snapshot.docs.map((d) => d.data()) as ClassOption[]);
  }

  async function loadAssignments(uid: string) {
    setLoading(true);
    const q = query(collection(db, "assignments"), where("teacherId", "==", uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Assignment[];
    setAssignments(data);
    setLoading(false);
    loadAllCounts(data);
  }

  async function loadAllCounts(list: Assignment[]) {
    const entries = await Promise.all(
      list.map(async (a) => {
        const [roster, subs] = await Promise.all([
          getStudentsForAssignment(a),
          getDocs(query(collection(db, "submissions"), where("assignmentId", "==", a.id))),
        ]);
        const completedIds = new Set(
          subs.docs.filter((d) => d.data().status === "Completed").map((d) => d.data().studentId),
        );
        return [a.id, { completed: completedIds.size, total: roster.length }] as const;
      }),
    );
    setCounts(Object.fromEntries(entries));
  }

  async function getStudentsForAssignment(a: Assignment) {
    const q = query(
      collection(db, "users"),
      where("role", "==", "student"),
      where("department", "==", a.department),
      where("section", "==", a.section),
    );
    const snap = await getDocs(q);
    let students = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
      id: string;
      name: string;
      semester?: string;
    }[];
    if (a.semester) {
      students = students.filter((s) => !s.semester || s.semester === a.semester);
    }
    return students;
  }

  async function toggleExpand(a: Assignment) {
    if (expandedId === a.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(a.id);
    if (!rows[a.id]) {
      setRowsLoading(a.id);
      const [roster, subs] = await Promise.all([
        getStudentsForAssignment(a),
        getDocs(query(collection(db, "submissions"), where("assignmentId", "==", a.id))),
      ]);
      const subMap = new Map(subs.docs.map((d) => [d.data().studentId as string, d.data()]));
      const list: SubmissionRow[] = roster.map((s) => {
        const sub = subMap.get(s.id);
        return {
          studentId: s.id,
          name: s.name ?? s.id,
          status: sub?.status === "Completed" ? "Completed" : "Pending",
          submissionLink: sub?.submissionLink,
        };
      });
      setRows((r) => ({ ...r, [a.id]: list }));
      setRowsLoading(null);
    }
  }

  function openNew() {
    setEditingId(null);
    setTitle("");
    setSubject("");
    setDepartment("");
    setSection("");
    setSemester("");
    setDueDate("");
    setShowModal(true);
  }

  function openEdit(a: Assignment) {
    setEditingId(a.id);
    setTitle(a.title);
    setSubject(a.subject);
    setDepartment(a.department);
    setSection(a.section);
    setSemester(a.semester ?? "");
    setDueDate(a.dueDate);
    setShowModal(true);
  }

  async function saveAssignment() {
    if (!title || !subject || !department || !section || !dueDate) {
      alert("Please fill all required fields");
      return;
    }

    const payload = {
      title: title.trim(),
      subject: subject.trim(),
      department,
      section,
      semester: semester.trim(),
      dueDate,
    };

    if (editingId) {
      await updateDoc(doc(db, "assignments", editingId), payload);
    } else {
      await addDoc(collection(db, "assignments"), {
        ...payload,
        teacherId: userId,
        createdAt: serverTimestamp(),
      });
    }

    setShowModal(false);
    loadAssignments(userId);
  }

  async function deleteAssignment(id: string) {
    if (!confirm("Delete this assignment? Student submissions for it will remain but be orphaned."))
      return;
    await deleteDoc(doc(db, "assignments", id));
    loadAssignments(userId);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold">
                {editingId ? "Edit Assignment" : "New Assignment"}
              </h2>

              <input
                className="mb-3 w-full rounded-lg border p-2"
                placeholder="Assignment Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="mb-3 w-full rounded-lg border p-2"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <select
                className="mb-3 w-full rounded-lg border p-2"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setSection("");
                }}
              >
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                className="mb-3 w-full rounded-lg border p-2"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                disabled={!department}
              >
                <option value="">
                  {department ? "Select section…" : "Select department first"}
                </option>
                {sectionsForDept.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {classOptions.length === 0 && (
                <p className="mb-3 text-xs text-muted-foreground">
                  No classes have been set up by admin yet — ask your admin to add departments and
                  classes first.
                </p>
              )}
              <input
                className="mb-3 w-full rounded-lg border p-2"
                placeholder="Semester (optional, e.g. 3)"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
              <input
                type="date"
                className="mb-4 w-full rounded-lg border p-2"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg bg-gray-200 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAssignment}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </>

      <PageHeader
        title="Assignments"
        description="Create, edit and track submissions."
        action={
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New assignment
          </button>
        }
      />

      {loading && <p className="text-sm text-muted-foreground">Loading assignments…</p>}
      {!loading && assignments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No assignments yet — create one to get started.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((a) => {
          const c = counts[a.id] ?? { completed: 0, total: 0 };
          const pct = c.total > 0 ? (c.completed / c.total) * 100 : 0;
          const expanded = expandedId === a.id;
          return (
            <div
              key={a.id}
              className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium">{a.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.subject} · {a.department}-{a.section}
                    {a.semester ? ` · Sem ${a.semester}` : ""} ·{" "}
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> Due {formatDue(a.dueDate)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(a)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteAssignment(a.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Submissions</span>
                <span className="font-medium text-foreground">
                  {c.completed}/{c.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>

              <button
                onClick={() => toggleExpand(a)}
                className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {expanded ? "Hide" : "View"} submissions
              </button>

              {expanded && (
                <div className="mt-3 divide-y divide-border rounded-xl border border-border">
                  {rowsLoading === a.id && (
                    <p className="p-3 text-xs text-muted-foreground">Loading…</p>
                  )}
                  {rowsLoading !== a.id &&
                    (rows[a.id] ?? []).map((r) => (
                      <div
                        key={r.studentId}
                        className="flex items-center justify-between gap-3 p-3 text-xs"
                      >
                        <span>{r.name}</span>
                        <div className="flex items-center gap-2">
                          {r.submissionLink && (
                            <a
                              href={r.submissionLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <FileText className="h-3 w-3" /> View submission
                            </a>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium ${r.status === "Completed" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}
                          >
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  {rowsLoading !== a.id && (rows[a.id] ?? []).length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground">
                      No students found in this section.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
