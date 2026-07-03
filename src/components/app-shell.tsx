import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Megaphone,
  NotebookPen,
  User,
  Settings,
  Search,
  Bell,
  Menu,
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  School,
  LineChart,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { Button } from "./ui/button";

export type NavItem = { to: string; label: string; icon: LucideIcon };

export const studentNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/timetable", label: "Timetable", icon: Calendar },
  { to: "/attendance", label: "Attendance", icon: BarChart3 },
  { to: "/notices", label: "Notices", icon: Megaphone },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const teacherNav: NavItem[] = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/students", label: "Students", icon: Users },
  { to: "/teacher/attendance", label: "Attendance", icon: BarChart3 },
  { to: "/teacher/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/teacher/lectures", label: "Lectures", icon: BookOpen },
  { to: "/teacher/notices", label: "Notices", icon: Megaphone },
  { to: "/teacher/profile", label: "Profile", icon: User },
];

export const adminNav: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/students", label: "Students", icon: GraduationCap },
  { to: "/admin/teachers", label: "Teachers", icon: Users },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
  { to: "/admin/classes", label: "Classes", icon: School },
  { to: "/admin/notices", label: "Notices", icon: Megaphone },
  { to: "/admin/reports", label: "Reports", icon: LineChart },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  nav = studentNav,
  initials = "AR",
  roleLabel = "Student",
  accent,
}: {
  nav?: NavItem[];
  initials?: string;
  roleLabel?: string;
  accent?: string;
} = {}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient depth — soft floating orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/40 blur-3xl" />
      </div>

      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card/60 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          {accent && <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{accent}</span>}
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:translate-x-0.5 hover:bg-secondary hover:text-foreground"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />}
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="m-3 rounded-xl border border-border bg-secondary/60 p-4">
          <p className="text-xs font-medium text-foreground">{roleLabel} workspace</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Calm, focused, and always in sync.
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
        <Logo />
        <button
          aria-label="Open menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-20 border-b border-border bg-card p-3 shadow-soft lg:hidden animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = path === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    active ? "bg-primary-soft text-primary" : "hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        {/* Desktop top bar */}
        <div className="sticky top-0 z-10 hidden h-16 items-center justify-between gap-4 border-b border-border bg-background/70 px-8 backdrop-blur lg:flex">
          <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>Search classes, tasks, notes…</span>
            <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-medium text-primary ring-2 ring-background">
              {initials}
            </div>
          </div>
        </div>

        <main className="px-4 py-6 sm:px-8 sm:py-8 pb-24 lg:pb-10 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {nav.slice(0, 5).map((item) => {
            const active = path === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}