// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader } from "@/components/page-header";
// import { Search } from "lucide-react";
// import { useState } from "react";

// export const Route = createFileRoute("/admin/students")({
//   head: () => ({ meta: [{ title: "Students — Admin" }] }),
//   component: AdminStudents,
// });

// const seed = Array.from({length: 12}).map((_,i) => ({
//   name: ["Aarav Sharma","Priya Kapoor","Rohit Verma","Ananya Rao","Vivek Singh","Meera Iyer","Kabir Nair","Isha Patel","Arjun Menon","Zara Khan","Dev Malhotra","Riya Sen"][i],
//   roll: `CS21B0${(i+1).toString().padStart(2,"0")}`,
//   dept: ["CSE","ECE","MECH"][i%3],
//   sem: (i%8)+1,
// }));

// function AdminStudents() {
//   const [q,setQ] = useState("");
//   const [dept,setDept] = useState("All");
//   const [sem,setSem] = useState("All");
//   const list = seed.filter(s => (dept==="All"||s.dept===dept) && (sem==="All"||String(s.sem)===sem) && (s.name.toLowerCase().includes(q.toLowerCase())||s.roll.toLowerCase().includes(q.toLowerCase())));
//   return (
//     <div className="mx-auto max-w-6xl">
//       <PageHeader title="Students" description="View, search and filter all enrolled students." />
//       <div className="mb-6 flex flex-wrap items-center gap-3">
//         <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
//           <Search className="h-4 w-4 text-muted-foreground"/>
//           <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search students" className="w-full bg-transparent focus:outline-none"/>
//         </div>
//         <select value={dept} onChange={e=>setDept(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
//           {["All","CSE","ECE","MECH"].map(d=><option key={d}>{d}</option>)}
//         </select>
//         <select value={sem} onChange={e=>setSem(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
//           {["All","1","2","3","4","5","6","7","8"].map(d=><option key={d}>{d}</option>)}
//         </select>
//       </div>
//       <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
//         <table className="w-full text-sm">
//           <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
//             <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Roll</th><th className="px-5 py-3">Dept</th><th className="px-5 py-3">Sem</th></tr>
//           </thead>
//           <tbody className="divide-y divide-border">
//             {list.map(s => (
//               <tr key={s.roll} className="transition hover:bg-secondary/40">
//                 <td className="px-5 py-3 font-medium">{s.name}</td>
//                 <td className="px-5 py-3 text-muted-foreground">{s.roll}</td>
//                 <td className="px-5 py-3">{s.dept}</td>
//                 <td className="px-5 py-3">{s.sem}</td>
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
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Students — Admin" }] }),
  component: AdminStudents,
});

type Student = {
  id: string;
  name: string;
  rollNo?: string;
  department?: string;
  semester?: string;
  section?: string;
};

function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [sem, setSem] = useState("All");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Student[];
      setStudents(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  // Built from real data rather than hardcoded, so it reflects whatever
  // departments actually exist across the institute.
  const departments = [...new Set(students.map((s) => s.department).filter(Boolean))] as string[];
  const semesters = [
    ...new Set(students.map((s) => s.semester).filter(Boolean)),
  ].sort() as string[];

  const list = students.filter(
    (s) =>
      (dept === "All" || s.department === dept) &&
      (sem === "All" || s.semester === sem) &&
      (s.name?.toLowerCase().includes(q.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Students"
        description={`View, search and filter all enrolled students${students.length ? ` — ${students.length} total` : ""}.`}
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students"
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
        <select
          value={sem}
          onChange={(e) => setSem(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {["All", ...semesters].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading students…</p>}

      {!loading && students.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No students found. Make sure student accounts have role set to "student".
        </p>
      )}

      {!loading && students.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Roll</th>
                <th className="px-5 py-3">Dept</th>
                <th className="px-5 py-3">Section</th>
                <th className="px-5 py-3">Sem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((s) => (
                <tr key={s.id} className="transition hover:bg-secondary/40">
                  <td className="px-5 py-3 font-medium">{s.name ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.rollNo ?? "—"}</td>
                  <td className="px-5 py-3">{s.department ?? "—"}</td>
                  <td className="px-5 py-3">{s.section ?? "—"}</td>
                  <td className="px-5 py-3">{s.semester ?? "—"}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted-foreground">
                    No students match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
