import { createFileRoute } from "@tanstack/react-router";
import { AppShell, teacherNav } from "@/components/app-shell";

export const Route = createFileRoute("/teacher")({
  component: () => <AppShell nav={teacherNav} initials="MS" roleLabel="Teacher" accent="Teacher" />,
});