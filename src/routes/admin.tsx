import { createFileRoute } from "@tanstack/react-router";
import { AppShell, adminNav } from "@/components/app-shell";

export const Route = createFileRoute("/admin")({
  component: () => <AppShell nav={adminNav} initials="AD" roleLabel="Admin" accent="Admin" />,
});