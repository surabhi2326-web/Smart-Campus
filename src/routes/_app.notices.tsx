import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Pin, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { db } from "@/firebase/firebase";

import { collection, getDocs } from "firebase/firestore";

export const Route = createFileRoute("/_app/notices")({
  head: () => ({
    meta: [
      { title: "Notices — Smart Campus" },
      { name: "description", content: "Important updates from your institute." },
    ],
  }),
  component: Notices,
});

const cats = ["All", "Exam", "Event", "Admin", "Sports", "Academic"] as const;
type Notice = {
  id: string;
  title: string;
  category: string;
  pinned: boolean;
};

function Notices() {
  const [items, setItems] = useState<Notice[]>([]);
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
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const list = items.filter((i) => cat === "All" || i.category === cat);
  const pinned = list.filter((i) => i.pinned);
  const rest = list.filter((i) => !i.pinned);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Notice Board" description="The latest from your institute." />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search notices"
            className="w-full bg-transparent placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-md px-3 py-1.5 text-sm ${cat === c ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {pinned.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground inline-flex items-center gap-1.5">
            <Pin className="h-3.5 w-3.5" /> Pinned
          </h2>
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {pinned.map((n) => (
              <Card key={n.id} n={n} />
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Latest</h2>
      <div className="space-y-3">
        {rest.map((n) => (
          <Card key={n.id} n={n} />
        ))}
      </div>
    </div>
  );
}

function Card({ n }: { n: Notice }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:shadow-lift">
      <div className="flex items-center justify-between">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] uppercase">
          {n.category}
        </span>

        {n.pinned && <Pin className="h-4 w-4 text-primary" />}
      </div>

      <h3 className="mt-3 font-medium">{n.title}</h3>
    </article>
  );
}
