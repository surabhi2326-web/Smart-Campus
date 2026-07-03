// import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
// import { useState } from "react";
// import { GraduationCap, Users, ShieldCheck, Check } from "lucide-react";
// import { AuthShell, Field, PrimaryButton } from "@/components/auth-shell";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { doc, serverTimestamp, setDoc } from "firebase/firestore";
// import { auth, db } from "@/firebase/firebase";

// export const Route = createFileRoute("/signup")({
//   head: () => ({
//     meta: [
//       { title: "Create account — Smart Campus" },
//       { name: "description", content: "Start organizing your academic life in minutes." },
//     ],
//   }),
//   component: Signup,
// });

// type Role = "student" | "teacher" | "admin";
// const roles: { id: Role; label: string; icon: any; desc: string; to: string }[] = [
//   { id: "student", label: "Student", icon: GraduationCap, desc: "Track classes, tasks and notes.", to: "/dashboard" },
//   { id: "teacher", label: "Teacher", icon: Users, desc: "Manage lectures and assignments.", to: "/teacher/dashboard" },
//   { id: "admin", label: "Admin", icon: ShieldCheck, desc: "Oversee the entire institute.", to: "/admin/dashboard" },
// ];

// function Signup() { const [name, setName] = useState("");
// const [email, setEmail] = useState("");
// const [password, setPassword] = useState("");
// const [course, setCourse] = useState("");
// const [semester, setSemester] = useState("");
// const [section, setSection] = useState("");
// const [rollNo, setRollNo] = useState("");
// const [department, setDepartment] = useState("");

// const [loading, setLoading] = useState(false);

// const [error, setError] = useState("");
//   const [role, setRole] = useState<Role>("student");
//   const navigate = useNavigate();
//   const target = roles.find(r => r.id === role)!.to;
//   const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     setError("");
// if (role === "student" && (!section || !rollNo)) {
//   setError("Please enter Section and Roll Number.");
//   return;
// }
//     try {
//       setLoading(true);

//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);

//       await setDoc(doc(db, "users", userCredential.user.uid), {
//         uid: userCredential.user.uid,
//         name,
//         email,
//         role,
        

//         course: role === "student" ? course : "",
//         semester: role === "student" ? semester : "",
//         section: role === "student" ? section : "",
//         rollNo: role === "student" ? rollNo : "",

//         department: role === "teacher" ? department : "",

//         createdAt: serverTimestamp(),
//       });

//       navigate({
//         to: target,
//       });
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <AuthShell
//       title="Create your account"
//       subtitle="Pick your role to get a workspace built for you."
//       footer={
//         <>
//           Already have an account?{" "}
//           <Link to="/login" className="font-medium text-primary hover:underline">
//             Sign in
//           </Link>
//         </>
//       }
//     >
//       <div className="mb-5 grid grid-cols-3 gap-2">
//         {roles.map((r) => {
//           const Icon = r.icon;
//           const active = role === r.id;
//           return (
//             <button
//               key={r.id}
//               type="button"
//               onClick={() => setRole(r.id)}
//               className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 ${
//                 active
//                   ? "border-primary bg-primary-soft shadow-[0_0_0_4px_var(--primary-soft)]"
//                   : "border-border bg-card hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-soft"
//               }`}
//             >
//               {active && (
//                 <span
//                   aria-hidden
//                   className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 to-transparent"
//                 />
//               )}
//               <div
//                 className={`grid h-8 w-8 place-items-center rounded-lg transition ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:text-foreground"}`}
//               >
//                 <Icon className="h-4 w-4" />
//               </div>
//               <p className="mt-2 text-sm font-medium">{r.label}</p>
//               <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{r.desc}</p>
//               {active && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
//             </button>
//           );
//         })}
//       </div>
//       <form className="space-y-4" onSubmit={handleSignup}>
//         <Field
//           label="Full name"
//           placeholder="Aarav Sharma"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//         />
//         <Field
//           label="Email"
//           type="email"
//           placeholder="you@college.edu"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <Field
//           label="Password"
//           type="password"
//           placeholder="At least 8 characters"
//           hint="Use a passphrase you can remember."
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />
//         {role === "student" && (
//           <>
//             <Field
//               label="Course"
//               placeholder="B.Tech CSE"
//               value={course}
//               onChange={(e) => setCourse(e.target.value)}
//             />

//             <Field
//               label="Semester"
//               placeholder="5"
//               value={semester}
//               onChange={(e) => setSemester(e.target.value)}
//             />

//             <Field
//               label="Section"
//               placeholder="A"
//               value={section}
//               onChange={(e) => setSection(e.target.value)}
//             />
//             <Field
//               label="Roll Number"
//               placeholder="CS21B001"
//               value={rollNo}
//               onChange={(e) => setRollNo(e.target.value)}
//             />
//           </>
//         )}
//         {role === "teacher" && (
//           <Field
//             label="Department"
//             placeholder="Computer Science"
//             value={department}
//             onChange={(e) => setDepartment(e.target.value)}
//           />
//         )}
//         {error && <p className="text-sm text-red-500">{error}</p>}
//         <PrimaryButton type="submit" disabled={loading}>
//           {loading ? "Creating..." : `Create ${roles.find((r) => r.id === role)!.label} account`}
//         </PrimaryButton>
//         <p className="text-center text-xs text-muted-foreground">
//           By continuing you agree to our terms.
//         </p>
//       </form>
//     </AuthShell>
//   );
// }
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Users, ShieldCheck, Check, Lock } from "lucide-react";
import { AuthShell, Field, PrimaryButton } from "@/components/auth-shell";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Smart Campus" },
      { name: "description", content: "Start organizing your academic life in minutes." },
    ],
  }),
  component: Signup,
});

type Role = "student" | "teacher" | "admin";
const roles: { id: Role; label: string; icon: any; desc: string; to: string }[] = [
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    desc: "Track classes, tasks and notes.",
    to: "/dashboard",
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: Users,
    desc: "Manage lectures and assignments.",
    to: "/teacher/dashboard",
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    desc: "Oversee the entire institute.",
    to: "/admin/dashboard",
  },
];

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

// A department + section pair, as defined by admin under Classes.
type ClassOption = {
  department: string;
  section: string;
};

// Lives at signupCodes/access — created manually once by whoever sets up
// the project. See the setup note at the bottom of the chat response.
type SignupConfig = {
  teacherCode?: string;
  adminSetupCode?: string;
  adminSetupUsed?: boolean;
  allowedEmailDomain?: string; // e.g. "college.edu" — leave blank to allow any domain
};

function isStrongPassword(pw: string) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pw);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [accessCode, setAccessCode] = useState(""); // teacher access code / admin setup code

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState<Role>("student");
  const navigate = useNavigate();
  const target = roles.find((r) => r.id === role)!.to;

  const [departments, setDepartments] = useState<string[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [signupConfig, setSignupConfig] = useState<SignupConfig | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const sectionsForDept = classOptions
    .filter((c) => c.department === department)
    .map((c) => c.section);

  useEffect(() => {
    loadOptions();
  }, []);

  const [loadError, setLoadError] = useState("");

  async function loadOptions() {
    setLoadingOptions(true);
    setLoadError("");

    try {
      const deptSnap = await getDocs(collection(db, "departments"));
      setDepartments(deptSnap.docs.map((d) => d.data().name as string).filter(Boolean));
    } catch (err: any) {
      console.error("Failed to load departments:", err);
      setLoadError((e) => e || `Couldn't load departments: ${err.code ?? err.message}`);
    }

    try {
      const classSnap = await getDocs(collection(db, "classes"));
      setClassOptions(classSnap.docs.map((d) => d.data()) as ClassOption[]);
    } catch (err: any) {
      console.error("Failed to load classes:", err);
      setLoadError((e) => e || `Couldn't load classes: ${err.code ?? err.message}`);
    }

    try {
      const configSnap = await getDoc(doc(db, "signupCodes", "access"));
      if (configSnap.exists()) {
        setSignupConfig(configSnap.data() as SignupConfig);
      } else {
        setSignupConfig({});
        setLoadError((e) => e || "signupCodes/access document doesn't exist yet.");
      }
    } catch (err: any) {
      console.error("Failed to load signupCodes/access:", err);
      setSignupConfig({});
      setLoadError((e) => e || `Couldn't load signup codes: ${err.code ?? err.message}`);
    }

    setLoadingOptions(false);
  }

  function handleDepartmentChange(value: string) {
    setDepartment(value);
    setSection("");
  }

  function handleRoleChange(r: Role) {
    setRole(r);
    setAccessCode("");
    setError("");
  }

  const adminLocked = !!signupConfig?.adminSetupUsed;

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // --- shared validation ---
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    const allowedDomain = signupConfig?.allowedEmailDomain?.trim();
    if (allowedDomain && !email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
      setError(`Please sign up with your institute email (@${allowedDomain}).`);
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Password must be at least 8 characters and include a letter and a number.");
      return;
    }

    // --- role-specific validation ---
    if (role === "student") {
      if (!department || !section || !semester || !rollNo.trim()) {
        setError("Please select your Department, Semester, Section, and enter your Roll Number.");
        return;
      }
    }

    if (role === "teacher") {
      if (!department) {
        setError("Please select your Department.");
        return;
      }
      if (!signupConfig?.teacherCode) {
        setError("Teacher signup codes haven't been configured yet. Contact your admin.");
        return;
      }
      if (accessCode.trim().toUpperCase() !== signupConfig.teacherCode.trim().toUpperCase()) {
        setError("That teacher access code isn't valid.");
        return;
      }
    }

    if (role === "admin") {
      if (adminLocked) {
        setError("Admin self-signup is closed. Ask an existing admin to create your account.");
        return;
      }
      if (!signupConfig?.adminSetupCode) {
        setError("Admin setup hasn't been configured yet. Contact whoever deployed this project.");
        return;
      }
      if (accessCode.trim() !== signupConfig.adminSetupCode.trim()) {
        setError("That admin setup code isn't valid.");
        return;
      }
    }

    // Fast, non-atomic pre-check purely for a nicer error message before we
    // even create the Auth account. The real guarantee is the transaction below.
    if (role === "student") {
      const dupeQ = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("rollNo", "==", rollNo.trim()),
      );
      const dupeSnap = await getDocs(dupeQ);
      if (!dupeSnap.empty) {
        setError("That roll number is already registered.");
        return;
      }
    }

    let createdUid: string | null = null;
    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      createdUid = userCredential.user.uid;

      // Atomically claim the roll number so two simultaneous signups can
      // never both succeed with the same one — a plain query-then-write has
      // a race condition, a transaction doesn't.
      if (role === "student") {
        const rollRef = doc(db, "rollNumbers", rollNo.trim());
        await runTransaction(db, async (tx) => {
          const existing = await tx.get(rollRef);
          if (existing.exists()) {
            throw new Error("ROLL_TAKEN");
          }
          tx.set(rollRef, { uid: createdUid, claimedAt: serverTimestamp() });
        });
      }

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: name.trim(),
        email,
        role,

        course: role === "student" ? course.trim() : "",
        semester: role === "student" ? semester : "",
        department: role === "student" || role === "teacher" ? department : "",
        section: role === "student" ? section : "",
        rollNo: role === "student" ? rollNo.trim() : "",

        createdAt: serverTimestamp(),
      });

      // Lock admin self-signup after the first successful bootstrap admin.
      if (role === "admin") {
        await updateDoc(doc(db, "signupCodes", "access"), { adminSetupUsed: true });
      }

      navigate({ to: target });
    } catch (err: any) {
      // Roll back the Auth account if anything after it failed, so we don't
      // leave an orphaned login with no profile behind.
      if (createdUid) {
        try {
          await auth.currentUser?.delete();
        } catch {
          // best-effort cleanup; nothing more we can do client-side here
        }
      }
      if (err?.message === "ROLL_TAKEN") {
        setError(
          "That roll number was just taken by someone else. Please double-check it and try again.",
        );
      } else {
        setError(err.message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Pick your role to get a workspace built for you."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-3 gap-2">
        {roles.map((r) => {
          const Icon = r.icon;
          const active = role === r.id;
          const locked = r.id === "admin" && adminLocked;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRoleChange(r.id)}
              className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 ${
                active
                  ? "border-primary bg-primary-soft shadow-[0_0_0_4px_var(--primary-soft)]"
                  : "border-border bg-card hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-soft"
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 to-transparent"
                />
              )}
              <div
                className={`grid h-8 w-8 place-items-center rounded-lg transition ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground group-hover:text-foreground"}`}
              >
                {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <p className="mt-2 text-sm font-medium">{r.label}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                {locked ? "Signup closed — ask an admin." : r.desc}
              </p>
              {active && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
            </button>
          );
        })}
      </div>
      {loadError && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          Setup issue: {loadError}
        </p>
      )}

      <form className="space-y-4" onSubmit={handleSignup}>
        <Field
          label="Full name"
          placeholder="Aarav Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="Email"
          type="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          hint="At least 8 characters, with a letter and a number."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {(role === "student" || role === "teacher") && loadingOptions && (
          <p className="text-xs text-muted-foreground">Loading departments…</p>
        )}

        {(role === "student" || role === "teacher") &&
          !loadingOptions &&
          departments.length === 0 && (
            <p className="text-xs text-destructive">
              No departments have been set up yet. Ask your institute admin to add departments and
              classes before signing up.
            </p>
          )}

        {role === "student" && !loadingOptions && departments.length > 0 && (
          <>
            <Field
              label="Course"
              placeholder="B.Tech CSE"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />

            <label className="block text-sm">
              <span className="mb-1 block font-medium">Semester</span>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Select semester…</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium">Department</span>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium">Section</span>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                disabled={!department}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
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
            </label>

            <Field
              label="Roll Number"
              placeholder="CS21B001"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
          </>
        )}

        {role === "teacher" && !loadingOptions && departments.length > 0 && (
          <>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Department</span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Teacher access code"
              placeholder="Provided by your institute"
              hint="Ask your admin if you don't have this."
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
            />
          </>
        )}

        {role === "admin" && !adminLocked && (
          <Field
            label="Admin setup code"
            placeholder="One-time bootstrap code"
            hint="Only needed to create the first admin account."
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
          />
        )}

        {role === "admin" && adminLocked && (
          <p className="text-xs text-muted-foreground">
            Admin self-signup is closed after the first admin account. Ask an existing admin to set
            up your access.
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        <PrimaryButton type="submit" disabled={loading || (role === "admin" && adminLocked)}>
          {loading ? "Creating..." : `Create ${roles.find((r) => r.id === role)!.label} account`}
        </PrimaryButton>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our terms.
        </p>
      </form>
    </AuthShell>
  );
}

