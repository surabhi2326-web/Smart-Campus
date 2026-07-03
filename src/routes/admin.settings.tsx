// import { createFileRoute } from "@tanstack/react-router";
// import { PageHeader } from "@/components/page-header";

// export const Route = createFileRoute("/admin/settings")({
//   head: () => ({ meta: [{ title: "Settings — Admin" }] }),
//   component: AdminSettings,
// });

// function Toggle({ label, hint, on }: { label: string; hint?: string; on?: boolean }) {
//   return (
//     <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
//       <div><p className="font-medium">{label}</p>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
//       <span className={`inline-flex h-6 w-11 items-center rounded-full transition ${on?"bg-primary":"bg-secondary"}`}>
//         <span className={`h-5 w-5 rounded-full bg-background shadow transition ${on?"translate-x-5":"translate-x-0.5"}`} />
//       </span>
//     </div>
//   );
// }

// function AdminSettings() {
//   return (
//     <div className="mx-auto max-w-3xl space-y-4">
//       <PageHeader title="Settings" description="Institute-wide preferences." />
//       <Toggle label="Allow teacher-created notices" hint="Faculty can post to their departments" on />
//       <Toggle label="Enable public course catalog" hint="Show programs on the public site" on />
//       <Toggle label="Require 2FA for staff" hint="Applies to teachers and admins" />
//       <Toggle label="Send weekly attendance reports" hint="Every Monday 9 AM" on />
//     </div>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Copy, Check, RefreshCw, Lock, Unlock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: AdminSettings,
});

type SignupConfig = {
  teacherCode: string;
  adminSetupCode: string;
  adminSetupUsed: boolean;
  allowedEmailDomain: string;
};

const CONFIG_REF = ["signupCodes", "access"] as const;

function generateCode(prefix: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${code}`;
}

function CodeField({
  label,
  hint,
  value,
  onChange,
  onRegenerate,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Not set"
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Regenerate
        </button>
      </div>
    </div>
  );
}

function AdminSettings() {
  const [config, setConfig] = useState<SignupConfig>({
    teacherCode: "",
    adminSetupCode: "",
    adminSetupUsed: false,
    allowedEmailDomain: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, ...CONFIG_REF));
      if (snap.exists()) {
        const data = snap.data() as Partial<SignupConfig>;
        setConfig({
          teacherCode: data.teacherCode ?? "",
          adminSetupCode: data.adminSetupCode ?? "",
          adminSetupUsed: data.adminSetupUsed ?? false,
          allowedEmailDomain: data.allowedEmailDomain ?? "",
        });
        setExists(true);
      } else {
        setExists(false);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  function update<K extends keyof SignupConfig>(key: K, value: SignupConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
    setSaved(false);
  }

  async function saveConfig() {
    setSaving(true);
    try {
      await setDoc(doc(db, ...CONFIG_REF), config, { merge: true });
      setExists(true);
      setSaved(true);
    } catch (error) {
      console.error(error);
      alert("Failed to save settings.");
    }
    setSaving(false);
  }

  async function reopenAdminSignup() {
    if (
      !confirm(
        "This reopens admin self-signup — anyone with the admin setup code below will be able to create a full admin account until it's used once. Only do this if you specifically need to add another admin. Continue?",
      )
    ) {
      return;
    }
    update("adminSetupUsed", false);
    await setDoc(doc(db, ...CONFIG_REF), { adminSetupUsed: false }, { merge: true });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Settings"
        description="Manage signup access codes for teachers and admins."
      />

      {loading && <p className="text-sm text-muted-foreground">Loading settings…</p>}

      {!loading && (
        <>
          {!exists && (
            <p className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
              No signup codes configured yet. Fill these in and save to set them up for the first
              time.
            </p>
          )}

          <CodeField
            label="Teacher access code"
            hint="Required for anyone signing up as a teacher. Share this only with verified staff."
            value={config.teacherCode}
            onChange={(v) => update("teacherCode", v)}
            onRegenerate={() => update("teacherCode", generateCode("TEACH"))}
          />

          <CodeField
            label="Admin setup code"
            hint="Used once to bootstrap the first admin account."
            value={config.adminSetupCode}
            onChange={(v) => update("adminSetupCode", v)}
            onRegenerate={() => update("adminSetupCode", generateCode("ADMIN"))}
          />

          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-9 w-9 place-items-center rounded-lg ${config.adminSetupUsed ? "bg-secondary text-muted-foreground" : "bg-primary-soft text-primary"}`}
              >
                {config.adminSetupUsed ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="font-medium">Admin self-signup</p>
                <p className="text-xs text-muted-foreground">
                  {config.adminSetupUsed
                    ? "Closed — the bootstrap admin account has already been created."
                    : "Open — the admin setup code above will work until first used."}
                </p>
              </div>
            </div>
            {config.adminSetupUsed && (
              <button
                type="button"
                onClick={reopenAdminSignup}
                className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
              >
                Reopen
              </button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium">Allowed email domain</p>
            <p className="text-xs text-muted-foreground">
              If set, signup is restricted to emails ending in this domain. Leave blank to allow any
              email.
            </p>
            <input
              value={config.allowedEmailDomain}
              onChange={(e) => update("allowedEmailDomain", e.target.value.trim())}
              placeholder="e.g. yourcollege.edu"
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && <span className="text-xs text-success">Saved!</span>}
            <button
              onClick={saveConfig}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
