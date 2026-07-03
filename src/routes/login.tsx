import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Users, ShieldCheck, Check } from "lucide-react";
import { AuthShell, Field, PrimaryButton } from "@/components/auth-shell";
import { useNavigate } from "@tanstack/react-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Smart Campus" },
      { name: "description", content: "Welcome back to your calmer academic life." },
    ],
  }),
  component: Login,
});

type Role = "student" | "teacher" | "admin";

const roles: { id: Role; label: string; icon: any; desc: string; to: string }[] = [
  { id: "student", label: "Student", icon: GraduationCap, desc: "Classes, tasks, notes and attendance.", to: "/dashboard" },
  { id: "teacher", label: "Teacher", icon: Users, desc: "Lectures, assignments, class management.", to: "/teacher/dashboard" },
  { id: "admin", label: "Admin", icon: ShieldCheck, desc: "Institute-wide people and reports.", to: "/admin/dashboard" },
];

function Login() {const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
  const [role, setRole] = useState<Role>("student");
  const navigate = useNavigate();
  
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const userRef = doc(db, "users", userCredential.user.uid);

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User data not found.");
      }

      const userData = userSnap.data();

      if (userData.role === "student") {
        navigate({ to: "/dashboard" });
      } else if (userData.role === "teacher") {
        navigate({ to: "/teacher/dashboard" });
      } else if (userData.role === "admin") {
        navigate({ to: "/admin/dashboard" });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Choose your role and sign in to continue."
      footer={
        <>
          New to Smart Campus?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-3 gap-2">
        {roles.map((r) => {
          const Icon = r.icon;
          const active = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
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
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-sm font-medium">{r.label}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{r.desc}</p>
              {active && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
            </button>
          );
        })}
      </div>
      <form className="space-y-4" onSubmit={handleLogin}>
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
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border-border" /> Remember me
          </label>
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}