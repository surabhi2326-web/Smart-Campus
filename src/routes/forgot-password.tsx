import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryButton } from "@/components/auth-shell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Smart Campus" },
      { name: "description", content: "We'll send you a reset link." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send a reset link."
      footer={<>Remembered it? <Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Email" type="email" placeholder="you@college.edu" />
        <PrimaryButton>Send reset link</PrimaryButton>
      </form>
    </AuthShell>
  );
}