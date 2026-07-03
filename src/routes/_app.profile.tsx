
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Field, PrimaryButton } from "@/components/auth-shell";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/firebase";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Smart Campus" },
      { name: "description", content: "Your personal and academic details." },
    ],
  }),
  component: Profile,
});

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  dob: string;
  institute: string;
  rollNo: string;
  branch: string;
  year: string;
};

const EMPTY_PROFILE: ProfileData = {
  name: "",
  email: "",
  phone: "",
  dob: "",
  institute: "",
  rollNo: "",
  branch: "",
  year: "",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Profile() {
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);

  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setUid(user.uid);

      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data() || {};

      setProfile({
        name: data.name ?? user.displayName ?? "",
        email: data.email ?? user.email ?? "",
        phone: data.phone ?? "",
        dob: data.dob ?? "",
        institute: data.institute ?? "",
        rollNo: data.rollNo ?? "",
        branch: data.branch ?? "",
        year: data.year ?? "",
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function updateField<K extends keyof ProfileData>(key: K, value: string) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function savePersonalDetails() {
    if (!uid) return;
    setSavingPersonal(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        dob: profile.dob,
      });
      alert("Personal details updated.");
    } catch (err) {
      console.error(err);
      alert("Could not save your changes. Please try again.");
    } finally {
      setSavingPersonal(false);
    }
  }

  async function saveAcademicDetails() {
    if (!uid) return;
    setSavingAcademic(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        institute: profile.institute,
        rollNo: profile.rollNo,
        branch: profile.branch,
        year: profile.year,
      });
      alert("Academic details updated.");
    } catch (err) {
      console.error(err);
      alert("Could not save your changes. Please try again.");
    } finally {
      setSavingAcademic(false);
    }
  }

  async function changePassword() {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }

    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      alert("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      alert(
        err?.message ?? "Could not update password. Check your current password and try again.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Profile" description="Manage your personal and academic information." />
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Profile" description="Manage your personal and academic information." />

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 font-display text-2xl text-primary">
            {getInitials(profile.name)}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-2xl">{profile.name || "Unnamed student"}</h2>
            <p className="text-sm text-muted-foreground">
              {[profile.branch, profile.year].filter(Boolean).join(" · ") ||
                "Academic details not set yet"}
            </p>
          </div>
          <button className="ml-auto rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
            Change avatar
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-semibold">Personal details</h3>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Full name"
            placeholder="Aarav Sharma"
            value={profile.name}
            onChange={(e: any) => updateField("name", e.target.value)}
          />
          <Field
            label="Email"
            type="email"
            placeholder="aarav@college.edu"
            value={profile.email}
            onChange={(e: any) => updateField("email", e.target.value)}
          />
          <Field
            label="Phone"
            placeholder="+91 98765 43210"
            value={profile.phone}
            onChange={(e: any) => updateField("phone", e.target.value)}
          />
          <Field
            label="Date of birth"
            type="date"
            value={profile.dob}
            onChange={(e: any) => updateField("dob", e.target.value)}
          />
        </div>
        <div className="mt-5 w-fit">
          <PrimaryButton onClick={savePersonalDetails} disabled={savingPersonal}>
            {savingPersonal ? "Saving…" : "Save Changes"}
          </PrimaryButton>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-semibold">Academic details</h3>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Institute"
            placeholder="ABC College of Engineering"
            value={profile.institute}
            onChange={(e: any) => updateField("institute", e.target.value)}
          />
          <Field
            label="Roll number"
            placeholder="22CS1023"
            value={profile.rollNo}
            onChange={(e: any) => updateField("rollNo", e.target.value)}
          />
          <Field
            label="Branch"
            placeholder="Computer Science"
            value={profile.branch}
            onChange={(e: any) => updateField("branch", e.target.value)}
          />
          <Field
            label="Year"
            placeholder="3rd year"
            value={profile.year}
            onChange={(e: any) => updateField("year", e.target.value)}
          />
        </div>
        <div className="mt-5 w-fit">
          <PrimaryButton onClick={saveAcademicDetails} disabled={savingAcademic}>
            {savingAcademic ? "Saving…" : "Save Changes"}
          </PrimaryButton>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-semibold">Change password</h3>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e: any) => setCurrentPassword(e.target.value)}
          />
          <div />
          <Field
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e: any) => setNewPassword(e.target.value)}
          />
          <Field
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e: any) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div className="mt-5 w-fit">
          <PrimaryButton onClick={changePassword} disabled={savingPassword}>
            {savingPassword ? "Updating…" : "Update password"}
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
