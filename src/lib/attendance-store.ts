// Shared attendance data layer.
// In a real backend-connected app, these functions would be API calls.
// For now they run on localStorage so the teacher's marks and the
// student's analytics view stay in sync within the browser.

import { useEffect, useState } from "react";

import { subscribe } from "@/lib/attendance-store"; // or wherever you put it

export type AttendanceStatus = "P" | "A";

export interface Student {
  roll: string;
  name: string;
  section: string;
}

export interface LectureRecord {
  id: string;
  section: string;
  subject: string;
  date: string; // YYYY-MM-DD
  marks: Record<string, AttendanceStatus>; // roll -> status
}

export const SECTIONS = ["CS-A", "CS-B", "CS-C"] as const;
export const SUBJECTS = ["Data Structures", "Algorithms", "Databases"] as const;

const NAME_POOL = [
  "Aarav Sharma",
  "Priya Kapoor",
  "Rohit Verma",
  "Ananya Rao",
  "Vivek Singh",
  "Meera Iyer",
  "Kabir Malhotra",
  "Ishita Nair",
  "Devansh Gupta",
  "Sanya Bose",
  "Arjun Reddy",
  "Tanvi Joshi",
  "Rehan Ali",
  "Naina Chawla",
  "Yash Trivedi",
  "Diya Menon",
  "Karan Chopra",
  "Riya Deshmukh",
];

function buildStudents(section: string, count = 6): Student[] {
  const secLetter = section.split("-")[1] ?? "A";
  const secIndex = secLetter.charCodeAt(0) - 65; // A=0, B=1, C=2
  return Array.from({ length: count }).map((_, i) => {
    const nameIdx = (secIndex * count + i) % NAME_POOL.length;
    const rollNum = String(secIndex * 20 + i + 1).padStart(3, "0");
    return {
      roll: `CS21B${rollNum}`,
      name: NAME_POOL[nameIdx],
      section,
    };
  });
}

export const STUDENTS: Student[] = SECTIONS.flatMap((s) => buildStudents(s));

export function studentsInSection(section: string): Student[] {
  return STUDENTS.filter((s) => s.section === section);
}

export function findStudent(roll: string): Student | undefined {
  return STUDENTS.find((s) => s.roll === roll);
}

// ---- deterministic seed data so first-load isn't empty ----

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function seedLectures(): LectureRecord[] {
  const records: LectureRecord[] = [];
  let seed = 42;
  SECTIONS.forEach((section) => {
    const students = studentsInSection(section);
    SUBJECTS.forEach((subject) => {
      const rand = seededRandom(seed++);
      const lectureCount = 10 + Math.floor(rand() * 6);
      for (let i = 0; i < lectureCount; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (lectureCount - i) * 3);
        const marks: Record<string, AttendanceStatus> = {};
        students.forEach((st) => {
          marks[st.roll] = rand() > 0.18 ? "P" : "A";
        });
        const date = d.toISOString().slice(0, 10);
        records.push({ id: `${section}__${subject}__${date}`, section, subject, date, marks });
      }
    });
  });
  return records;
}

const STORAGE_KEY = "attendance-records-v1";

function loadRecords(): LectureRecord[] {
  if (typeof window === "undefined") return seedLectures();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LectureRecord[];
  } catch {
    // fall through to reseed
  }
  const seeded = seedLectures();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // ignore write failures (private mode etc.)
  }
  return seeded;
}

let records: LectureRecord[] = loadRecords();

type Listener = () => void;
const listeners = new Set<Listener>();

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecords(): LectureRecord[] {
  return records;
}

/** React hook: re-renders whenever attendance data changes anywhere in the app. */
// export function useAttendanceRecords(): LectureRecord[] {
//   const [, bump] = useState(0);
//   useEffect(() => subscribe(() => bump((n) => n + 1)), []);
//   return records;
// }
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLecturesFor(section: string, subject: string): LectureRecord[] {
  return records
    .filter((r) => r.section === section && r.subject === subject)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getLecture(
  section: string,
  subject: string,
  date: string,
): LectureRecord | undefined {
  return records.find((r) => r.section === section && r.subject === subject && r.date === date);
}

export function saveLecture(
  section: string,
  subject: string,
  date: string,
  marks: Record<string, AttendanceStatus>,
) {
  const id = `${section}__${subject}__${date}`;
  const idx = records.findIndex((r) => r.id === id);
  const record: LectureRecord = { id, section, subject, date, marks };
  records =
    idx >= 0 ? [...records.slice(0, idx), record, ...records.slice(idx + 1)] : [...records, record];
  persist();
}

export function deleteLecture(id: string) {
  records = records.filter((r) => r.id !== id);
  persist();
}

// ---- computed stats ----

export function studentSubjectStats(roll: string, subject: string) {
  const relevant = records.filter((r) => r.subject === subject && r.marks[roll] !== undefined);
  const total = relevant.length;
  const attended = relevant.filter((r) => r.marks[roll] === "P").length;
  return { attended, total };
}

export function studentOverallStats(roll: string) {
  return SUBJECTS.map((subject) => ({ subject, ...studentSubjectStats(roll, subject) }));
}

export function studentLectureHistory(roll: string, subject: string) {
  return records
    .filter((r) => r.subject === subject && r.marks[roll] !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((r) => ({ date: r.date, status: r.marks[roll] }));
}

export function studentWeeklyTrend(roll: string, weeks = 6) {
  const relevant = records.filter((r) => r.marks[roll] !== undefined);
  const byWeek = new Map<string, { p: number; t: number }>();
  relevant.forEach((r) => {
    const d = new Date(r.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    const cur = byWeek.get(key) ?? { p: 0, t: 0 };
    cur.t += 1;
    if (r.marks[roll] === "P") cur.p += 1;
    byWeek.set(key, cur);
  });
  return Array.from(byWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-weeks)
    .map(([week, { p, t }]) => ({ week, pct: t ? Math.round((p / t) * 100) : 0 }));
}

/** Roster of a section for a subject, each student with their attendance stats in it. */
export function sectionSubjectRoster(section: string, subject: string) {
  return studentsInSection(section).map((s) => ({ ...s, ...studentSubjectStats(s.roll, subject) }));
}
