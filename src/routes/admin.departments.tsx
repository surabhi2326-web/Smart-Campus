// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader } from "@/components/page-header";
// import { Plus, Edit3, Trash2, Building2 } from "lucide-react";

// export const Route = createFileRoute("/admin/departments")({
//   head: () => ({ meta: [{ title: "Departments — Admin" }] }),
//   component: AdminDepartments,
// });

// const depts = [
//   { name: "Computer Science", head: "Dr. Neha Bhatt", students: 420, faculty: 24 },
//   { name: "Electronics", head: "Dr. Kavita Rao", students: 310, faculty: 18 },
//   { name: "Mechanical", head: "Dr. Radhika Iyer", students: 280, faculty: 20 },
//   { name: "Civil", head: "Dr. Anil Gupta", students: 210, faculty: 15 },
// ];

// function AdminDepartments() {
//   return (
//     <div className="mx-auto max-w-6xl">
//       <PageHeader title="Departments" description="Manage academic departments." action={
//         <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4"/> New department</button>
//       }/>
//       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
//         {depts.map(d => (
//           <div key={d.name} className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
//             <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><Building2 className="h-5 w-5"/></div>
//             <h3 className="font-medium">{d.name}</h3>
//             <p className="mt-1 text-xs text-muted-foreground">Head: {d.head}</p>
//             <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
//               <div className="rounded-lg bg-secondary/60 p-2"><p className="text-muted-foreground">Students</p><p className="font-medium">{d.students}</p></div>
//               <div className="rounded-lg bg-secondary/60 p-2"><p className="text-muted-foreground">Faculty</p><p className="font-medium">{d.faculty}</p></div>
//             </div>
//             <div className="mt-4 flex gap-2">
//               <button className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary"><Edit3 className="h-3.5 w-3.5"/> Edit</button>
//               <button className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5"/> Remove</button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Plus, Edit3, Trash2, Building2 } from "lucide-react";
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

export const Route = createFileRoute("/admin/departments")({
  head: () => ({ meta: [{ title: "Departments — Admin" }] }),
  component: AdminDepartments,
});

type Department = {
  id: string;
  name: string;
  head: string;
};

function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [counts, setCounts] = useState<Record<string, { students: number; faculty: number }>>({});
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [head, setHead] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [depSnap, studentsSnap, teachersSnap] = await Promise.all([
        getDocs(collection(db, "departments")),
        getDocs(query(collection(db, "users"), where("role", "==", "student"))),
        getDocs(query(collection(db, "users"), where("role", "==", "teacher"))),
      ]);

      setDepartments(depSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Department[]);

      const tally: Record<string, { students: number; faculty: number }> = {};
      studentsSnap.docs.forEach((d) => {
        const dept = d.data().department as string | undefined;
        if (!dept) return;
        tally[dept] = tally[dept] ?? { students: 0, faculty: 0 };
        tally[dept].students += 1;
      });
      teachersSnap.docs.forEach((d) => {
        const dept = d.data().department as string | undefined;
        if (!dept) return;
        tally[dept] = tally[dept] ?? { students: 0, faculty: 0 };
        tally[dept].faculty += 1;
      });
      setCounts(tally);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  function openNew() {
    setEditingId(null);
    setName("");
    setHead("");
    setShowModal(true);
  }

  function openEdit(d: Department) {
    setEditingId(d.id);
    setName(d.name);
    setHead(d.head ?? "");
    setShowModal(true);
  }

  async function saveDepartment() {
    if (!name) {
      alert("Department name is required");
      return;
    }
    const payload = { name: name.trim(), head: head.trim() };
    if (editingId) {
      await updateDoc(doc(db, "departments", editingId), payload);
    } else {
      await addDoc(collection(db, "departments"), payload);
    }
    setShowModal(false);
    loadAll();
  }

  async function removeDepartment(id: string) {
    if (
      !confirm(
        "Remove this department? Students/teachers already assigned to it won't be affected.",
      )
    )
      return;
    await deleteDoc(doc(db, "departments", id));
    loadAll();
  }

  return (
    <div className="mx-auto max-w-6xl">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {editingId ? "Edit Department" : "New Department"}
            </h2>
            <input
              className="mb-3 w-full rounded-lg border p-2"
              placeholder="Department name (e.g. Computer Science)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="mb-4 w-full rounded-lg border p-2"
              placeholder="Head of department"
              value={head}
              onChange={(e) => setHead(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg bg-gray-200 py-2"
              >
                Cancel
              </button>
              <button
                onClick={saveDepartment}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Departments"
        description="Manage academic departments."
        action={
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New department
          </button>
        }
      />

      {loading && <p className="text-sm text-muted-foreground">Loading departments…</p>}
      {!loading && departments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No departments yet — add one to get started.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => {
          const c = counts[d.name] ?? { students: 0, faculty: 0 };
          return (
            <div
              key={d.id}
              className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="font-medium">{d.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Head: {d.head || "Not assigned"}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-secondary/60 p-2">
                  <p className="text-muted-foreground">Students</p>
                  <p className="font-medium">{c.students}</p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-2">
                  <p className="text-muted-foreground">Faculty</p>
                  <p className="font-medium">{c.faculty}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(d)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => removeDepartment(d.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
