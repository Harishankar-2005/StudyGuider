import { useMemo } from "react";
import { upcomingTasks } from "../data/demoData";
import { useLocalStorage } from "./useLocalStorage";
import { todayISO, addDaysISO } from "../lib/planGenerator";

// Single source of truth for every study record in the app.
// Dashboard, Study Planner and Progress Tracker all read from here —
// no separate copies of progress data.
//
// Task shape: { id, title, exam, subject, chapter, chapterId, date (ISO),
//   minutes, type, status: 'todo'|'done', completedAt, notes, planId,
//   requires: [ids], pinned, attempts: [{ score, weakTopics, date }] }

const TASKS_KEY = "sg-plan-tasks-v1";
const META_KEY = "sg-plan-meta-v1";

const LEGACY_DONE = "sg-completed-tasks";
const LEGACY_CUSTOM = "sg-custom-tasks";
const LEGACY_MIGRATED = "sg-store-v1-migrated";

// Demo seed offsets (days from today) for the original milestone-1 tasks.
const SEED_OFFSETS = [0, 1, 3, 5];

const minutesFrom = (duration) => {
  const match = String(duration || "").match(/(\d+)/);
  return match ? Number(match[1]) : 45;
};

const seedTypeFor = (task) => {
  if (/mock test/i.test(task.title)) return "full-mock";
  if (/practice/i.test(task.title)) return "practice";
  if (/revision/i.test(task.title)) return "revision";
  return "chapter-study";
};

// One-time migration: legacy demo lists + ticks become structured records.
// Runs lazily as the initial state (no effect needed).
const migrateLegacy = () => {
  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const doneIds = new Set(read(LEGACY_DONE, []));
  const custom = read(LEGACY_CUSTOM, []);
  const now = todayISO();

  const tasks = upcomingTasks.map((t, i) => {
    const done = doneIds.has(t.id);
    return {
      id: `seed-${t.id}`,
      title: t.title,
      exam: "General (Demo)",
      subject: t.subject,
      chapter: t.title,
      chapterId: null,
      date: addDaysISO(now, SEED_OFFSETS[i] ?? i),
      minutes: minutesFrom(t.duration),
      type: seedTypeFor(t),
      status: done ? "done" : "todo",
      completedAt: done ? now : null,
      notes: "Demo task from the original planner.",
      planId: null,
      requires: [],
      attempts: [],
    };
  });

  custom.forEach((t) => {
    const done = doneIds.has(t.id);
    tasks.push({
      id: String(t.id).startsWith("custom-") ? t.id : `custom-${t.id}`,
      title: t.title,
      exam: "General (Demo)",
      subject: t.subject || "General",
      chapter: t.title,
      chapterId: null,
      date: now,
      minutes: minutesFrom(t.duration),
      type: "custom",
      status: done ? "done" : "todo",
      completedAt: done ? now : null,
      notes: "Task you added yourself.",
      planId: null,
      requires: [],
      attempts: [],
    });
  });

  return tasks;
};

const loadInitialTasks = () => {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (raw !== null) return JSON.parse(raw);
    if (localStorage.getItem(LEGACY_MIGRATED)) return [];
    const tasks = migrateLegacy();
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    localStorage.setItem(LEGACY_MIGRATED, "1");
    localStorage.removeItem(LEGACY_DONE);
    localStorage.removeItem(LEGACY_CUSTOM);
    return tasks;
  } catch {
    return [];
  }
};

export function useStudyPlan() {
  // Evaluated during render (pure localStorage reads); useLocalStorage
  // persists the result. Each route mounts its own instance, so pages
  // always read the latest stored records on navigation.
  const initialTasks = loadInitialTasks();
  const [tasks, setTasks] = useLocalStorage(TASKS_KEY, initialTasks);
  const [planMeta, setPlanMeta] = useLocalStorage(META_KEY, null);

  const byId = useMemo(() => Object.fromEntries(tasks.map((t) => [t.id, t])), [tasks]);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "todo" : "done", completedAt: t.status === "done" ? null : todayISO() }
          : t
      )
    );
  };

  const rescheduleTask = (id, isoDate) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, date: isoDate } : t)));
  };

  const addCustomTask = ({ title, subject, date, minutes, notes }) => {
    const task = {
      id: `custom-${Date.now()}`,
      title,
      exam: "General",
      subject: subject || "General",
      chapter: title,
      chapterId: null,
      date: date || todayISO(),
      minutes: Number(minutes) || 45,
      type: "custom",
      status: "todo",
      completedAt: null,
      notes: notes || "",
      planId: null,
      requires: [],
      attempts: [],
    };
    setTasks((prev) => [task, ...prev]);
    return task;
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const recordAttempt = (id, { score, weakTopics, date }) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, attempts: [...(t.attempts || []), { score, weakTopics: weakTopics || "", date: date || todayISO() }] }
          : t
      )
    );
  };

  // Regeneration: keeps everything completed + everything with attempts.
  // Only future, untouched plan tasks are replaced by the fresh schedule.
  const replacePlanTasks = (newTasks, meta) => {
    const preserved = tasks.filter(
      (t) => t.status === "done" || (t.attempts && t.attempts.length > 0) || !t.planId
    );
    const preservedIds = new Set(preserved.map((t) => t.id));
    const fresh = newTasks.filter((t) => !preservedIds.has(t.id));
    setTasks([...preserved, ...fresh]);
    setPlanMeta(meta);
    return { preserved: preserved.filter((t) => t.planId).length, replaced: fresh.length };
  };

  const applyReplannedDates = (updatedTasks) => {
    setTasks(updatedTasks);
  };

  const resetDemo = () => {
    setTasks([]);
    setPlanMeta(null);
  };

  return {
    tasks,
    byId,
    planMeta,
    setPlanMeta,
    toggleTask,
    rescheduleTask,
    addCustomTask,
    removeTask,
    recordAttempt,
    replacePlanTasks,
    applyReplannedDates,
    resetDemo,
  };
}
