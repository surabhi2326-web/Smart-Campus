
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { auth, db } from "@/firebase/firebase";
import { onAuthStateChanged, deleteUser } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Smart Campus" },
      { name: "description", content: "Tune appearance, notifications and privacy." },
    ],
  }),
  component: Settings,
});

type ThemeOption = "light" | "dark" | "system";

type NotificationSettings = {
  classReminders: boolean;
  taskDueAlerts: boolean;
  noticeUpdates: boolean;
  weeklyDigest: boolean;
};

type PrivacySettings = {
  shareStats: boolean;
  personalizedSuggestions: boolean;
};

type AppSettings = {
  theme: ThemeOption;
  accent: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  accent: "blue",
  notifications: {
    classReminders: true,
    taskDueAlerts: true,
    noticeUpdates: true,
    weeklyDigest: false,
  },
  privacy: {
    shareStats: false,
    personalizedSuggestions: true,
  },
};

const ACCENTS: { key: string; className: string; hex: string }[] = [
  { key: "blue", className: "bg-blue-500", hex: "#3b82f6" },
  { key: "emerald", className: "bg-emerald-500", hex: "#10b981" },
  { key: "violet", className: "bg-violet-500", hex: "#8b5cf6" },
  { key: "rose", className: "bg-rose-500", hex: "#f43f5e" },
  { key: "amber", className: "bg-amber-500", hex: "#f59e0b" },
];

const STORAGE_KEY = "smart-campus-settings";

// Assumes Tailwind's dark mode strategy is "class" (a `dark` class on <html>).
function applyTheme(theme: ThemeOption) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
}

// Assumes your global CSS defines colors like `bg-primary` off a `--primary`
// custom property. If your theme is set up differently, this line is the one
// to change.
function applyAccent(accentKey: string) {
  const accent = ACCENTS.find((a) => a.key === accentKey) ?? ACCENTS[0];
  document.documentElement.style.setProperty("--primary", accent.hex);
}

function mergeSettings(saved: Partial<AppSettings> | undefined): AppSettings {
  if (!saved) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...saved.notifications },
    privacy: { ...DEFAULT_SETTINGS.privacy, ...saved.privacy },
  };
}

function Settings() {
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setUid(user.uid);

      // Apply a cached copy immediately so the UI doesn't flash back to
      // defaults while Firestore loads.
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = mergeSettings(JSON.parse(cached));
          setSettings(parsed);
          applyTheme(parsed.theme);
          applyAccent(parsed.accent);
        } catch {
          // ignore malformed cache
        }
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      const merged = mergeSettings(snap.data()?.settings);

      setSettings(merged);
      applyTheme(merged.theme);
      applyAccent(merged.accent);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Keep "system" theme correct if the OS preference changes mid-session
  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  async function persist(next: AppSettings) {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (!uid) return;
    try {
      await setDoc(doc(db, "users", uid), { settings: next }, { merge: true });
    } catch (err) {
      console.error("Failed to save settings", err);
    }
  }

  function setTheme(theme: ThemeOption) {
    applyTheme(theme);
    persist({ ...settings, theme });
  }

  function setAccent(accent: string) {
    applyAccent(accent);
    persist({ ...settings, accent });
  }

  function setNotification<K extends keyof NotificationSettings>(key: K, value: boolean) {
    persist({ ...settings, notifications: { ...settings.notifications, [key]: value } });
  }

  function setPrivacy<K extends keyof PrivacySettings>(key: K, value: boolean) {
    persist({ ...settings, privacy: { ...settings.privacy, [key]: value } });
  }

  async function deleteAccount() {
    if (!auth.currentUser) return;
    const confirmed = window.confirm(
      "This will permanently delete your account and data. This cannot be undone. Continue?",
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid));
      await deleteUser(auth.currentUser);
      alert("Your account has been deleted.");
    } catch (err: any) {
      console.error(err);
      if (err?.code === "auth/requires-recent-login") {
        alert(
          "For security, please log out and log back in, then try deleting your account again.",
        );
      } else {
        alert(err?.message ?? "Could not delete account.");
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader title="Settings" description="Make Smart Campus yours." />
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Settings" description="Make Smart Campus yours." />

      <Card title="Appearance" description="Theme and visual density.">
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "light" as const, label: "Light", icon: Sun },
            { id: "dark" as const, label: "Dark", icon: Moon },
            { id: "system" as const, label: "System", icon: Monitor },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm ${
                settings.theme === t.id
                  ? "border-primary bg-primary-soft/50 text-primary"
                  : "border-border hover:bg-secondary"
              }`}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Notifications" description="Choose what reaches you.">
        <Toggle
          label="Class reminders"
          on={settings.notifications.classReminders}
          onToggle={(v) => setNotification("classReminders", v)}
        />
        <Toggle
          label="Task due alerts"
          on={settings.notifications.taskDueAlerts}
          onToggle={(v) => setNotification("taskDueAlerts", v)}
        />
        <Toggle
          label="Notice updates"
          on={settings.notifications.noticeUpdates}
          onToggle={(v) => setNotification("noticeUpdates", v)}
        />
        <Toggle
          label="Weekly digest"
          on={settings.notifications.weeklyDigest}
          onToggle={(v) => setNotification("weeklyDigest", v)}
        />
      </Card>

      <Card title="Privacy" description="Control your data.">
        <Toggle
          label="Share productivity stats anonymously"
          on={settings.privacy.shareStats}
          onToggle={(v) => setPrivacy("shareStats", v)}
        />
        <Toggle
          label="Allow personalized suggestions"
          on={settings.privacy.personalizedSuggestions}
          onToggle={(v) => setPrivacy("personalizedSuggestions", v)}
        />
        <button
          onClick={deleteAccount}
          disabled={deleting}
          className="mt-3 text-sm text-destructive hover:underline disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete my account"}
        </button>
      </Card>

      <Card title="Theme accent" description="Pick a color that fits your mood.">
        <div className="flex gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAccent(a.key)}
              className={`h-9 w-9 rounded-full ${a.className} ${
                settings.accent === a.key ? "ring-2 ring-offset-2 ring-ring" : ""
              }`}
              aria-label={`accent ${a.key}`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 space-y-2">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-1 py-2">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onToggle(!on)}
        className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-secondary"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-5" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}
