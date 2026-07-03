// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader } from "@/components/page-header";
// import { Plus, Edit3, Trash2 } from "lucide-react";

// export const Route = createFileRoute("/admin/classes")({
//   head: () => ({ meta: [{ title: "Classes — Admin" }] }),
//   component: AdminClasses,
// });

// const classes = [
//   { name: "CS-A", dept: "CSE", year: 3, strength: 60 },
//   { name: "CS-B", dept: "CSE", year: 3, strength: 58 },
//   { name: "EC-A", dept: "ECE", year: 2, strength: 55 },
//   { name: "ME-A", dept: "MECH", year: 4, strength: 52 },
// ];

// function AdminClasses() {
//   return (
//     <div className="mx-auto max-w-6xl">
//       <PageHeader title="Classes" description="Sections, strength and coordinators." action={
//         <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4"/> New class</button>
//       }/>
//       <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
//         <table className="w-full text-sm">
//           <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
//             <tr><th className="px-5 py-3">Class</th><th className="px-5 py-3">Dept</th><th className="px-5 py-3">Year</th><th className="px-5 py-3">Strength</th><th className="px-5 py-3"></th></tr>
//           </thead>
//           <tbody className="divide-y divide-border">
//             {classes.map(c => (
//               <tr key={c.name} className="transition hover:bg-secondary/40">
//                 <td className="px-5 py-3 font-medium">{c.name}</td>
//                 <td className="px-5 py-3">{c.dept}</td>
//                 <td className="px-5 py-3">{c.year}</td>
//                 <td className="px-5 py-3">{c.strength}</td>
//                 <td className="px-5 py-3">
//                   <div className="flex justify-end gap-1">
//                     <button className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"><Edit3 className="h-3.5 w-3.5"/></button>
//                     <button className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5"/></button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

export const Route = createFileRoute("/admin/classes")({
  head: () => ({ meta: [{ title: "Classes — Admin" }] }),
  component: AdminClasses,
});

// section + department match the fields already used on student profiles,
// lectures, and attendance records elsewhere in the app.
type ClassRow = {
  id: string;
  section: string;
  department: string;
  year: string;
};

function AdminClasses() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [strength, setStrength] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [section, setSection] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [classSnap, studentsSnap] = await Promise.all([
        getDocs(collection(db, "classes")),
        getDocs(query(collection(db, "users"), where("role", "==", "student"))),
      ]);

      const rows = classSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClassRow[];
      setClasses(rows);

      const tally: Record<string, number> = {};
      studentsSnap.docs.forEach((d) => {
        const data = d.data();
        const key = `${data.department}::${data.section}`;
        tally[key] = (tally[key] ?? 0) + 1;
      });
      setStrength(tally);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  function openNew() {
    setEditingId(null);
    setSection("");
    setDepartment("");
    setYear("");
    setShowModal(true);
  }

  function openEdit(c: ClassRow) {
    setEditingId(c.id);
    setSection(c.section);
    setDepartment(c.department);
    setYear(c.year);
    setShowModal(true);
  }

  async function saveClass() {
    if (!section || !department || !year) {
      alert("Please fill all fields");
      return;
    }
    const payload = {
      section: section.trim().toUpperCase(),
      department: department.trim(),
      year: year.trim(),
    };
    if (editingId) {
      await updateDoc(doc(db, "classes", editingId), payload);
    } else {
      await addDoc(collection(db, "classes"), payload);
    }
    setShowModal(false);
    loadAll();
  }

  async function removeClass(id: string) {
    if (!confirm("Remove this class?")) return;
    await deleteDoc(doc(db, "classes", id));
    loadAll();
  }

  return (
    <div className="mx-auto max-w-6xl">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">{editingId ? "Edit Class" : "New Class"}</h2>
            <input
              className="mb-3 w-full rounded-lg border p-2"
              placeholder="Section (e.g. A)"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            />
            <input
              className="mb-3 w-full rounded-lg border p-2"
              placeholder="Department (e.g. CSE)"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
            <input
              className="mb-4 w-full rounded-lg border p-2"
              placeholder="Year (e.g. 3)"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg bg-gray-200 py-2"
              >
                Cancel
              </button>
              <button onClick={saveClass} className="flex-1 rounded-lg bg-blue-600 py-2 text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Classes"
        description="Sections, strength and coordinators."
        action={
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New class
          </button>
        }
      />

      {loading && <p className="text-sm text-muted-foreground">Loading classes…</p>}
      {!loading && classes.length === 0 && (
        <p className="text-sm text-muted-foreground">No classes yet — add one to get started.</p>
      )}

      {!loading && classes.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Dept</th>
                <th className="px-5 py-3">Year</th>
                <th className="px-5 py-3">Strength</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classes.map((c) => (
                <tr key={c.id} className="transition hover:bg-secondary/40">
                  <td className="px-5 py-3 font-medium">
                    {c.department}-{c.section}
                  </td>
                  <td className="px-5 py-3">{c.department}</td>
                  <td className="px-5 py-3">{c.year}</td>
                  <td className="px-5 py-3">{strength[`${c.department}::${c.section}`] ?? 0}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeClass(c.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
