
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const Route = createFileRoute("/teacher/profile")({
  head: () => ({ meta: [{ title: "Profile — Teacher" }] }),
  component: TeacherProfile,
});

type Profile = {
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  phone: string;
};

const emptyProfile: Profile = {
  name: "",
  employeeId: "",
  department: "",
  designation: "",
  phone: "",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block rounded-xl border border-border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent font-medium focus:outline-none"
      />
    </label>
  );
}

function TeacherProfile() {
  const [userId, setUserId] = useState("");
  const [authEmail, setAuthEmail] = useState(""); // the email currently on the Auth account
  const [emailDraft, setEmailDraft] = useState(""); // editable field
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showReauth, setShowReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [reauthError, setReauthError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setAuthEmail(user.email ?? "");
        setEmailDraft(user.email ?? "");
        loadProfile(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function loadProfile(uid: string) {
    setLoading(true);
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      setProfile({
        name: data.name ?? "",
        employeeId: data.employeeId ?? "",
        department: data.department ?? "",
        designation: data.designation ?? "",
        phone: data.phone ?? "",
      });
    }
    setLoading(false);
  }

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function saveChanges() {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", userId),
        {
          ...profile,
          role: "teacher",
        },
        { merge: true },
      );

      if (emailDraft.trim() && emailDraft.trim() !== authEmail) {
        await updateAuthEmail(emailDraft.trim());
      }

      setSaved(true);
    } catch (error) {
      console.error(error);
      alert("Failed to save changes.");
    }
    setSaving(false);
  }

  async function updateAuthEmail(newEmail: string) {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await verifyBeforeUpdateEmail(user, newEmail);
      alert(
        `We sent a verification link to ${newEmail}. Your login email will switch over once you click that link — until then, keep signing in with ${authEmail}.`,
      );
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        setPendingEmail(newEmail);
        setReauthError("");
        setShowReauth(true);
      } else if (error.code === "auth/email-already-in-use") {
        alert("That email is already in use by another account.");
        setEmailDraft(authEmail);
      } else {
        console.error(error);
        alert("Couldn't update email: " + (error.message ?? "unknown error"));
        setEmailDraft(authEmail);
      }
    }
  }

  async function confirmReauth() {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    try {
      const credential = EmailAuthProvider.credential(user.email, reauthPassword);
      await reauthenticateWithCredential(user, credential);
      setShowReauth(false);
      setReauthPassword("");
      if (pendingEmail) await updateAuthEmail(pendingEmail);
    } catch (error) {
      setReauthError("That password didn't work. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile" description="Manage your personal and professional details." />

      {showReauth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h2 className="mb-2 text-lg font-semibold">Confirm your password</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              For security, changing your login email requires you to re-enter your current
              password.
            </p>
            <input
              type="password"
              placeholder="Current password"
              value={reauthPassword}
              onChange={(e) => setReauthPassword(e.target.value)}
              className="mb-2 w-full rounded-lg border p-2"
            />
            {reauthError && <p className="mb-2 text-xs text-destructive">{reauthError}</p>}
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => {
                  setShowReauth(false);
                  setReauthPassword("");
                  setEmailDraft(authEmail);
                }}
                className="flex-1 rounded-lg bg-gray-200 py-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmReauth}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-lg font-medium text-primary">
              {initials(profile.name)}
            </div>
            <div>
              <p className="font-medium">{profile.name || "Unnamed teacher"}</p>
              <p className="text-sm text-muted-foreground">
                {profile.department || "Department not set"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Row label="Full name" value={profile.name} onChange={(v) => update("name", v)} />
            <Row label="Email (used to sign in)" value={emailDraft} onChange={setEmailDraft} />
            <Row
              label="Employee ID"
              value={profile.employeeId}
              onChange={(v) => update("employeeId", v)}
            />
            <Row
              label="Department"
              value={profile.department}
              onChange={(v) => update("department", v)}
            />
            <Row
              label="Designation"
              value={profile.designation}
              onChange={(v) => update("designation", v)}
            />
            <Row label="Phone" value={profile.phone} onChange={(v) => update("phone", v)} />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {saved && <span className="text-xs text-success">Saved!</span>}
            <button
              onClick={saveChanges}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
