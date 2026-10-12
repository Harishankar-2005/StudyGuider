// Deterministic exam-plan scheduling engine.
// Pure functions over plain task records — no AI, no network.
// The LLM layer (later) may personalise notes, but dates, dependencies
// and time allocation always come from these rules.

import { isMockType } from "../data/syllabus";

// ---------- date helpers (local calendar days, YYYY-MM-DD) ----------

export const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const todayISO = () => toISODate(new Date());

export const parseISODate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDaysISO = (iso, n) => {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + n);
  return toISODate(date);
};

export const diffDays = (fromISO, toISO) => {
  const ms = parseISODate(toISO) - parseISODate(fromISO);
  return Math.round(ms / 86400000);
};

export const formatDate = (iso) => {
  if (!iso) return "No date";
  return parseISODate(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

// ---------- task-shape ----------
// { id, title, exam, subject, chapter, date (ISO|null), minutes,
//   type, status: 'todo'|'done', notes, planId, requires: [ids],
//   attempts: [{ score, weakTopics, date }] }

// ---------- plan generation ----------

const PRACTICE_MINUTES = 45;
const REVISION_MINUTES = 30;
const CUMULATIVE_MINUTES = 60;
const FULL_MOCK_MINUTES = 180;

const fullMockCountFor = (availableDays) => {
  if (availableDays >= 28) return 5;
  if (availableDays >= 18) return 4;
  if (availableDays >= 10) return 3;
  if (availableDays >= 5) return 2;
  return 1;
};

const listAvailableDays = (startISO, examISO, offDays) => {
  const days = [];
  for (let iso = startISO; diffDays(iso, examISO) > 0; iso = addDaysISO(iso, 1)) {
    if (!offDays.includes(parseISODate(iso).getDay())) days.push(iso);
  }
  return days;
};

// Greedily packs sessions into day capacities. Sessions larger than a
// full day are split into labelled parts. Returns { placed, unplaced }.
const packSessions = (sessions, dayISOs, dailyMinutes) => {
  const remaining = new Map(dayISOs.map((d) => [d, dailyMinutes]));
  const placed = [];
  const unplaced = [];
  for (const session of sessions) {
    let minutesLeft = session.minutes;
    let part = 1;
    let cursor = 0;
    // Find first day with any room, starting after the previous placement.
    while (minutesLeft > 0 && cursor < dayISOs.length) {
      const day = dayISOs[cursor];
      const room = remaining.get(day);
      if (room <= 0) {
        cursor += 1;
        continue;
      }
      const take = Math.min(room, minutesLeft);
      remaining.set(day, room - take);
      placed.push({
        ...session,
        minutes: take,
        date: day,
        part: session.minutes > take || minutesLeft - take > 0 ? part : null,
      });
      minutesLeft -= take;
      part += 1;
      if (remaining.get(day) <= 0) cursor += 1;
    }
    if (minutesLeft > 0) unplaced.push({ ...session, minutes: minutesLeft });
  }
  return { placed, unplaced, remaining };
};

export function generatePlan({ exam, chapters, startISO, examISO, dailyMinutes, offDays = [] }) {
  const planId = `plan-${Date.now()}`;
  const available = listAvailableDays(startISO, examISO, offDays);
  if (available.length < 1) {
    return { error: "Exam date must be after the start date with at least one study day." };
  }

  // Reserve the final days for full-syllabus mocks near the exam.
  const fullCount = Math.min(fullMockCountFor(available.length), available.length);
  const fullDays = available.slice(-fullCount);
  const studyDays = available.slice(0, -fullCount || undefined);

  // Core sessions in syllabus order: study, then practice per chapter.
  const sessions = [];
  chapters.forEach((ch, index) => {
    sessions.push({
      kind: "study",
      chapterId: ch.id,
      subject: ch.subject,
      chapter: ch.chapter,
      minutes: ch.minutes,
      order: index * 2,
    });
    sessions.push({
      kind: "practice",
      chapterId: ch.id,
      subject: ch.subject,
      chapter: ch.chapter,
      minutes: PRACTICE_MINUTES,
      order: index * 2 + 1,
    });
  });
  sessions.sort((a, b) => a.order - b.order);

  const { placed, unplaced } = packSessions(sessions, studyDays, dailyMinutes);

  // Map study placements back to chapter ids for dependency wiring.
  const studyTaskIdByChapter = {};
  const tasks = [];
  let counter = 0;
  const nextId = () => `${planId}-t${counter++}`;

  // Group placed study sessions into cumulative-test groups of ~4 chapters.
  const studyPlacements = placed.filter((p) => p.kind === "study");
  const groupSize = studyPlacements.length > 12 ? 4 : 3;

  placed.forEach((p) => {
    const id = nextId();
    if (p.kind === "study") studyTaskIdByChapter[p.chapterId] = id;
    tasks.push({
      id,
      title: p.kind === "study" ? `${p.subject}: ${p.chapter}` : `${p.subject}: ${p.chapter} — practice set`,
      exam,
      subject: p.subject,
      chapter: p.chapter,
      chapterId: p.chapterId,
      date: p.date,
      minutes: p.minutes,
      type: p.kind === "study" ? "chapter-study" : "practice",
      status: "todo",
      notes:
        p.part != null
          ? `Part ${p.part} of a longer session. Same rules, fresh sitting.`
          : p.kind === "study"
            ? "Read theory, solve examples, note formulas."
            : "Timed mixed questions from this chapter.",
      planId,
      requires: [],
      attempts: [],
    });
  });

  // Cumulative tests after each group of ~3–4 chapters (unlock when group done).
  const groupIds = [];
  for (let i = 0; i < studyPlacements.length; i += groupSize) {
    groupIds.push(studyPlacements.slice(i, i + groupSize).map((p) => p.chapterId));
  }
  groupIds.forEach((group, gi) => {
    const requires = group.map((cid) => studyTaskIdByChapter[cid]).filter(Boolean);
    if (requires.length === 0) return;
    const lastStudy = tasks.find((t) => t.id === requires[requires.length - 1]);
    tasks.push({
      id: nextId(),
      title: `Cumulative test ${gi + 1}: ${group.length} chapters`,
      exam,
      subject: requires.length > 0 ? lastStudy.subject : "Mixed",
      chapter: `Chapters ${gi * groupSize + 1}–${gi * groupSize + group.length}`,
      date: addDaysISO(lastStudy.date, 1),
      minutes: CUMULATIVE_MINUTES,
      type: "cumulative-mock",
      status: "todo",
      notes: "Mixed paper across the recent chapter group. Record score + weak topics.",
      planId,
      requires,
      attempts: [],
      pinned: false,
    });
  });

  // Spaced revision (~6 days after each study session) if capacity remains.
  let droppedRevisions = 0;
  studyPlacements.forEach((p) => {
    tasks.push({
      id: nextId(),
      title: `${p.subject}: ${p.chapter} — revision`,
      exam,
      subject: p.subject,
      chapter: p.chapter,
      chapterId: p.chapterId,
      date: addDaysISO(p.date, 6),
      minutes: REVISION_MINUTES,
      type: "revision",
      status: "todo",
      notes: "Formula sheet + mistakes notebook. Prioritise flagged weak topics.",
      planId,
      requires: [studyTaskIdByChapter[p.chapterId]],
      attempts: [],
    });
  });
  // Revisions landing on/after the exam are dropped (reported, not silent).
  for (const t of tasks) {
    if (t.type === "revision" && diffDays(t.date, examISO) <= 0) {
      t.dropped = true;
      droppedRevisions += 1;
    }
  }
  const keptTasks = tasks.filter((t) => !t.dropped);

  // Full-syllabus mocks on the reserved final days (pinned near the exam).
  fullDays.forEach((day, i) => {
    keptTasks.push({
      id: nextId(),
      title: `Full mock ${i + 1} of ${fullDays.length}: ${exam}`,
      exam,
      subject: "Mixed",
      chapter: "Full syllabus",
      date: day,
      minutes: FULL_MOCK_MINUTES,
      type: "full-mock",
      status: "todo",
      notes: "Exam-hall conditions: 3 hrs, no breaks, OMR-style discipline.",
      planId,
      requires: [],
      attempts: [],
      pinned: true,
    });
  });

  keptTasks.sort((a, b) => (a.date < b.date ? -1 : 1));

  const totalMinutes = keptTasks.reduce((sum, t) => sum + t.minutes, 0);
  const tight = unplaced.length > 0 || droppedRevisions > 0;

  return {
    planId,
    tasks: keptTasks,
    summary: {
      exam,
      chapters: chapters.length,
      studyDays: available.length,
      fullMocks: fullDays.length,
      totalTasks: keptTasks.length,
      totalMinutes,
      tight,
      unplacedSessions: unplaced.length,
      droppedRevisions,
    },
  };
}

// ---------- unlocking ----------
// Cumulative/chapter tests unlock when prerequisites are done.
// Full mocks unlock at 70% chapter-study completion or within 14 days
// of the exam — so falling behind never hard-locks the final mocks.

export function unlockInfo(task, tasksById, examISO) {
  if (!isMockType(task.type)) return { unlocked: true, pending: 0 };
  if (task.type === "full-mock") {
    const studies = Object.values(tasksById).filter(
      (t) => t.type === "chapter-study" && t.planId === task.planId
    );
    const done = studies.filter((t) => t.status === "done").length;
    const ratio = studies.length === 0 ? 1 : done / studies.length;
    const daysLeft = diffDays(todayISO(), examISO);
    const unlocked = ratio >= 0.7 || daysLeft <= 14;
    return { unlocked, pending: unlocked ? 0 : Math.ceil(studies.length * 0.7) - done };
  }
  const pending = (task.requires || []).filter((id) => tasksById[id]?.status !== "done");
  return { unlocked: pending.length === 0, pending: pending.length };
}

// ---------- replanning (falling behind) ----------
// Keeps completed tasks, attempts and pinned full mocks in place.
// Redistributes remaining plan-generated todo tasks over leftover capacity.

export function replanRemaining({ tasks, examISO, dailyMinutes, offDays = [] }) {
  const startISO = todayISO();
  const movable = tasks.filter(
    (t) => t.status === "todo" && t.planId && !t.pinned && t.type !== "custom"
  );
  const pinnedDays = new Set(
    tasks.filter((t) => t.status === "todo" && t.pinned).map((t) => t.date)
  );
  const openDays = listAvailableDays(addDaysISO(startISO, 1), examISO, offDays).filter(
    (d) => !pinnedDays.has(d)
  );

  const sessions = movable
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((t) => ({ taskId: t.id, minutes: t.minutes }));
  const { placed, unplaced } = packSessions(sessions, openDays, dailyMinutes);

  const dateById = new Map(placed.map((p) => [p.taskId, p.date]));
  const updated = tasks.map((t) =>
    dateById.has(t.id) ? { ...t, date: dateById.get(t.id), rescheduled: true } : t
  );
  return { tasks: updated, moved: dateById.size, unfit: unplaced.length };
}

// ---------- shared selectors (single source of truth) ----------

export const isOverdue = (task, nowISO = todayISO()) =>
  task.status === "todo" && task.date && task.date < nowISO;

export function streakDays(tasks, nowISO = todayISO()) {
  const doneDays = new Set(
    tasks.filter((t) => t.status === "done").map((t) => t.completedAt || t.date).filter(Boolean)
  );
  let streak = 0;
  let cursor = doneDays.has(nowISO) ? nowISO : addDaysISO(nowISO, -1);
  if (!doneDays.has(cursor)) return 0;
  while (doneDays.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}

export function mockStats(tasks) {
  const mocks = tasks.filter((t) => isMockType(t.type));
  const attempted = mocks.filter((t) => t.attempts && t.attempts.length > 0);
  const scores = attempted.flatMap((t) => t.attempts.map((a) => a.score));
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const weakTopics = [];
  attempted.forEach((t) =>
    (t.attempts || []).forEach((a) =>
      (a.weakTopics || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((w) => {
        if (!weakTopics.includes(w)) weakTopics.push(w);
      })
    )
  );
  return { total: mocks.length, attempted: attempted.length, avg, weakTopics: weakTopics.slice(0, 8) };
}

export function minutesDone(tasks) {
  return tasks.filter((t) => t.status === "done").reduce((sum, t) => sum + (t.minutes || 0), 0);
}
