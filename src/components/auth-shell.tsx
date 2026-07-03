// import { Link } from "@tanstack/react-router";
// import { Logo } from "./logo";
// import type { ReactNode } from "react";

// export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
//   return (
//     <div className="relative grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
//       <div className="relative hidden bg-hero p-12 lg:flex lg:flex-col lg:justify-between">
//         <Logo />
//         <div className="max-w-md">
//           <h2 className="font-display text-5xl leading-tight">
//             Your calmer<br/>academic life.
//           </h2>
//           <p className="mt-4 text-muted-foreground">
//             Classes, tasks, attendance, notices and notes — in one beautifully organized place.
//           </p>
//         </div>
//         <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Smart Campus</p>
//       </div>
//       <div className="flex flex-col px-6 py-10 sm:px-12">
//         <div className="lg:hidden"><Logo /></div>
//         <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
//           <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
//             <h1 className="font-display text-3xl">{title}</h1>
//             <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
//             <div className="mt-6">{children}</div>
//           </div>
//           {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
//           <p className="mt-8 text-center text-xs text-muted-foreground">
//             <Link to="/" className="hover:text-foreground">← Back to home</Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export function Field({
//   label,
//   type = "text",
//   placeholder,
//   hint,
//   value,
//   onChange,
// }: {
//   label: string;
//   type?: string;
//   placeholder?: string;
//   hint?: string;
//   value?: string;
//   onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
// }) {
//   return (
//     <label className="block">
//       <span className="text-sm font-medium">{label}</span>

//       <input
//         type={type}
//         placeholder={placeholder}
//         value={value}
//         onChange={onChange}
//         className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
//       />

//       {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
//     </label>
//   );
// }

// export function PrimaryButton({ children }: { children: ReactNode }) {
//   return (
//     <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
//       {children}
//     </button>
//   );
// }
import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <div className="relative hidden bg-hero p-12 lg:flex lg:flex-col lg:justify-between">
        <Logo />
        <div className="max-w-md">
          <h2 className="font-display text-5xl leading-tight">
            Your calmer
            <br />
            academic life.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Classes, tasks, attendance, notices and notes — in one beautifully organized place.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Smart Campus</p>
      </div>
      <div className="flex flex-col px-6 py-10 sm:px-12">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <h1 className="font-display text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  hint,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}