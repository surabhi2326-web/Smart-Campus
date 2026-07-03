import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";

import { Plus, Pin, Edit3, Trash2 } from "lucide-react";

import { auth, db } from "@/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
} from "firebase/firestore";

export const Route = createFileRoute("/admin/notices")({
  head: () => ({ meta: [{ title: "Notices — Admin" }] }),
  component: AdminNotices,
});

type Notice = {
  id: string;
  title: string;
  category: string;
  pinned: boolean;
};

function AdminNotices() {
  const [items, setItems] = useState<Notice[]>([]);

  const [title, setTitle] = useState("");

  const [category, setCategory] = useState("");

  const [pinned, setPinned] = useState(false);

  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    loadNotices();
  }, []);

  async function loadNotices() {
    const snapshot = await getDocs(collection(db, "notices"));

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notice[];

    setItems(data);
  }
  async function saveNotice() {
    if (!title || !category) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "notices"), {
      title,
      category,
      pinned,
      createdAt: serverTimestamp(),
    });

    alert("Notice added!");

    setTitle("");
    setCategory("");
    setPinned(false);
    setShowModal(false);

    loadNotices();
  }
  async function deleteNotice(id: string) {
    await deleteDoc(doc(db, "notices", id));

    loadNotices();
  }
  return (
    <div className="mx-auto max-w-4xl">
      <>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold">New Notice</h2>

              <input
                className="mb-3 w-full rounded-lg border p-2"
                placeholder="Notice Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <input
                className="mb-3 w-full rounded-lg border p-2"
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />

              <label className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                />
                Pin this notice
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg bg-gray-200 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={saveNotice}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </>
      <PageHeader
        title="Notices"
        description="Broadcast announcements across the institute."
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Notice
          </button>
        }
      />
      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <button
                  className={`grid h-8 w-8 place-items-center rounded-lg border ${n.pinned ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <div className="min-w-0">
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.category}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteNotice(n.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
