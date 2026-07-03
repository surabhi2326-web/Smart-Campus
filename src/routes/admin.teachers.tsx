// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader } from "@/components/page-header";
// import { Search } from "lucide-react";
// import { useState } from "react";

// export const Route = createFileRoute("/admin/teachers")({
//   head: () => ({ meta: [{ title: "Teachers — Admin" }] }),
//   component: AdminTeachers,
// });

// const teachers = [
//   { name: "Prof. Manish Sharma", dept: "CSE", desg: "Associate Prof." },
//   { name: "Dr. Kavita Rao", dept: "ECE", desg: "Professor" },
//   { name: "Prof. Suresh Menon", dept: "MECH", desg: "Assistant Prof." },
//   { name: "Dr. Neha Bhatt", dept: "CSE", desg: "Professor" },
//   { name: "Prof. Ajay Kulkarni", dept: "ECE", desg: "Associate Prof." },
//   { name: "Dr. Radhika Iyer", dept: "MECH", desg: "Professor" },
// ];

// function AdminTeachers() {
//   const [q,setQ] = useState("");
//   const [dept,setDept] = useState("All");
//   const list = teachers.filter(t => (dept==="All"||t.dept===dept) && t.name.toLowerCase().includes(q.toLowerCase()));
//   return (
//     <div className="mx-auto max-w-6xl">
//       <PageHeader title="Teachers" description="Faculty directory across departments." />
//       <div className="mb-6 flex flex-wrap items-center gap-3">
//         <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
//           <Search className="h-4 w-4 text-muted-foreground"/>
//           <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search teachers" className="w-full bg-transparent focus:outline-none"/>
//         </div>
//         <select value={dept} onChange={e=>setDept(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
//           {["All","CSE","ECE","MECH"].map(d=><option key={d}>{d}</option>)}
//         </select>
//       </div>
//       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
//         {list.map(t => (
//           <div key={t.name} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
//             <div className="flex items-center gap-3">
//               <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 font-medium text-primary">{t.name.split(" ").map(n=>n[0]).slice(0,2).join("")}</div>
//               <div className="min-w-0">
//                 <p className="truncate font-medium">{t.name}</p>
//                 <p className="text-xs text-muted-foreground">{t.desg} · {t.dept}</p>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const Route = createFileRoute("/admin/teachers")({
  head: () => ({ meta: [{ title: "Teachers — Admin" }] }),
  component: AdminTeachers,
});

// Matches the fields written by teacher.profile.tsx on users/{uid}
type Teacher = {
  id: string;
  name?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function AdminTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "teacher"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Teacher[];
      setTeachers(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const departments = [...new Set(teachers.map((t) => t.department).filter(Boolean))] as string[];

  const list = teachers.filter(
    (t) =>
      (dept === "All" || t.department === dept) &&
      (t.name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Teachers"
        description={`Faculty directory across departments${teachers.length ? ` — ${teachers.length} total` : ""}.`}
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search teachers"
            className="w-full bg-transparent focus:outline-none"
          />
        </div>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {["All", ...departments].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading teachers…</p>}

      {!loading && teachers.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No teachers found. Make sure teacher accounts have role set to "teacher".
        </p>
      )}

      {!loading && teachers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 font-medium text-primary">
                  {initials(t.name ?? "?")}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.name ?? "Unnamed teacher"}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.designation ?? "—"} · {t.department ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground">
              No teachers match your filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
