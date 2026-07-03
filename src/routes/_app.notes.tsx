import { createFileRoute } from "@tanstack/react-router";

import { Folder, Plus, Pin, Search, Paperclip, Bold, Italic, List, Heading1 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

export const Route = createFileRoute("/_app/notes")({
  head: () => ({ meta: [{ title: "Notes — Smart Campus" }, { name: "description", content: "Capture, organize and find your notes." }] }),
  component: Notes,
});



function Notes() { type Note = {
  id: string;
  title: string;
  content: string;
};

const [notes, setNotes] = useState<Note[]>([]);
const [title, setTitle] = useState("");
const [content, setContent] = useState("");
const [showModal, setShowModal] = useState(false);
const [userId, setUserId] = useState("");

  
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        loadNotes(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);
  async function loadNotes(uid: string) {
    const q = query(collection(db, "notes"), where("userId", "==", uid));

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Note[];

    setNotes(data);
  }
  async function saveNote() {
    if (!title || !content) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "notes"), {
      userId,
      title,
      content,
      createdAt: serverTimestamp(),
    });

    alert("Note saved!");

    setTitle("");
    setContent("");
    setShowModal(false);

    loadNotes(userId);
  }
  async function deleteNote(id: string) {
    await deleteDoc(doc(db, "notes", id));
    loadNotes(userId);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Notes"
        description="Your second brain. Organized."
        action={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        }
      />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">New Note</h2>

            <input
              className="mb-3 w-full rounded-lg border p-2"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="mb-4 h-40 w-full rounded-lg border p-2"
              placeholder="Write note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                className="flex-1 rounded-lg bg-gray-200 py-2"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button className="flex-1 rounded-lg bg-blue-600 py-2 text-white" onClick={saveNote}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <h3 className="text-lg font-semibold">{note.title}</h3>

            <p className="mt-2 text-sm">{note.content}</p>

            <button
              onClick={() => deleteNote(note.id)}
              className="mt-4 rounded-lg bg-red-500 px-3 py-2 text-white"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}