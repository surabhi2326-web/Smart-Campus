// import { createFileRoute } from "@tanstack/react-router";
// import { useEffect, useState } from "react";
// import { PageHeader } from "@/components/page-header";
// import { Pin } from "lucide-react";
// import { db } from "@/firebase/firebase";
// import { collection, getDocs } from "firebase/firestore";

// export const Route = createFileRoute("/teacher/notices")({
//   head: () => ({ meta: [{ title: "Notices — Teacher" }] }),
//   component: TeacherNotices,
// });

// type Notice = {
//   id: string;
//   title: string;
//   category: string;
//   pinned: boolean;
// };

// function TeacherNotices() {
//   const [items, setItems] = useState<Notice[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadNotices();
//   }, []);

//   async function loadNotices() {
//     setLoading(true);
//     const snapshot = await getDocs(collection(db, "notices"));

//     const data = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     })) as Notice[];

//     setItems(data);
//     setLoading(false);
//   }

//   return (
//     <div className="mx-auto max-w-4xl">
//       <PageHeader title="Notices" description="Announcements from the institute." />

//       {loading && <p className="text-sm text-muted-foreground">Loading notices…</p>}

//       {!loading && items.length === 0 && (
//         <p className="text-sm text-muted-foreground">No notices yet.</p>
//       )}

//       <ul className="space-y-3">
//         {items.map((n) => (
//           <li
//             key={n.id}
//             className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
//           >
//             <div className="flex items-start gap-3">
//               {n.pinned && <Pin className="mt-1 h-4 w-4 text-primary" />}
//               <div className="min-w-0 flex-1">
//                 <div className="flex flex-wrap items-center gap-2">
//                   <h3 className="font-medium">{n.title}</h3>
//                   <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
//                     {n.category}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Plus, Edit3, Trash2, Video } from "lucide-react";
import { useState, useEffect } from "react";
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
  where,
} from "firebase/firestore";
export const Route = createFileRoute("/teacher/notices")({
  head: () => ({ meta: [{ title: "Lectures — Teacher" }] }),
  component: Lectures,
});

// A department + section pair, as defined by admin under Classes.
type ClassOption = {
  department: string;
  section: string;
};

function Lectures() {
  type Lecture = {
    id: string;
    title: string;
    subject: string;
    department: string;
    section: string;
    room: string;
    day: string;
    startTime: string;
    endTime: string;
  };

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [room, setRoom] = useState("");
  const [day, setDay] = useState("Mon");
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const departments = [...new Set(classOptions.map((c) => c.department))];
  const sectionsForDept = classOptions
    .filter((c) => c.department === department)
    .map((c) => c.section);

  const [userId, setUserId] = useState("");
  useEffect(() => {
    loadClassOptions();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadLectures(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadClassOptions() {
    const snapshot = await getDocs(collection(db, "classes"));
    const options = snapshot.docs.map((d) => d.data()) as ClassOption[];
    setClassOptions(options);
  }
  async function loadLectures(uid: string) {
    const q = query(collection(db, "lectures"), where("teacherId", "==", uid));

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lecture[];

    setLectures(data);
  }
  async function saveLecture() {
    if (!title || !subject || !department || !section || !room || !day || !startTime || !endTime) {
      alert("Fill all fields");
      return;
    }

    await addDoc(collection(db, "lectures"), {
      teacherId: userId,
      title: title.trim(),
      subject: subject.trim(),
      department,
      section,
      room: room.trim(),
      day,
      startTime,
      endTime,
      createdAt: serverTimestamp(),
    });

    alert("Lecture Added!");

    setTitle("");
    setSubject("");
    setDepartment("");
    setSection("");
    setRoom("");
    setDay("Mon");
    setStartTime("");
    setEndTime("");

    setShowModal(false);

    loadLectures(userId);
  }
  async function deleteLecture(id: string) {
    await deleteDoc(doc(db, "lectures", id));
    loadLectures(userId);
  }
  return (
    <div className="mx-auto max-w-5xl">
      <>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold">Schedule Lecture</h2>

              <input
                className="mb-3 w-full rounded-lg border p-2"
                placeholder="Lecture Title"
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
                placeholder="Room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />

              <select
                className="mb-3 w-full rounded-lg border p-2"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <input
                type="time"
                className="mb-3 w-full rounded-lg border p-2"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <input
                type="time"
                className="mb-3 w-full rounded-lg border p-2"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg bg-gray-200 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={saveLecture}
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
        title="Lectures"
        description="Schedule and manage your sessions."
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Schedule Lecture
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {lectures.map((l) => (
          <div
            key={l.id}
            className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="font-medium">{l.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {l.subject} · {l.day} · {l.startTime}-{l.endTime} · {l.room} · {l.department}-
              {l.section}
            </p>
            <div className="mt-4 flex gap-2">
              <button className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary">
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => deleteLecture(l.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}