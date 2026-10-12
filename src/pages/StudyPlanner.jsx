import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus, FiTrash2, FiRotateCcw, FiClock, FiCheck, FiSearch, FiCalendar,
  FiLock, FiTarget, FiAlertTriangle, FiAward, FiEdit3,
} from "react-icons/fi";
import Reveal from "../components/ui/Reveal";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { useToast } from "../components/ui/useToast";
import { useStudyPlan } from "../hooks/useStudyPlan";
import { TASK_TYPES, isMockType } from "../data/syllabus";
import {
  todayISO, addDaysISO, formatDate, diffDays, unlockInfo, isOverdue,
  replanRemaining, mockStats,
} from "../lib/planGenerator";
import "./StudyPlanner.css";

const FILTERS = ["Today", "Upcoming", "Completed", "All Tasks", "Mock Tests"];

const TYPE_BADGE = {
  "chapter-study": "badge-violet",
  practice: "badge-blue",
  revision: "badge-green",
  "chapter-mock": "badge-yellow",
  "cumulative-mock": "badge-yellow",
  "full-mock": "badge-rose",
  custom: "badge",
};

// Study Planner renders the SAME task records as the dashboard and
// progress pages: plan-generated sessions + mocks, plus custom tasks.
function StudyPlanner() {
  const {
    tasks, byId, planMeta, toggleTask, rescheduleTask, addCustomTask,
    removeTask, recordAttempt, applyReplannedDates, resetDemo,
  } = useStudyPlan();
  const { notify } = useToast();

  const [filter, setFilter] = useState("Today");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmReplan, setConfirmReplan] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [newDate, setNewDate] = useState(todayISO());
  const [mockDetails, setMockDetails] = useState(null);
  const [attempt, setAttempt] = useState({ score: "", weakTopics: "" });
  const [draft, setDraft] = useState({ title: "", subject: "Physics", date: todayISO(), minutes: "45" });

  const now = todayISO();
  const stats = mockStats(tasks);
  const overdue = tasks.filter((t) => isOverdue(t, now));
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const daysLeft = planMeta ? diffDays(now, planMeta.examDate) : null;

  const visible = useMemo(() => {
    const today = todayISO();
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (filter === "Today") return t.status === "todo" && t.date === today;
        if (filter === "Upcoming") return t.status === "todo" && t.date && t.date >= today;
        if (filter === "Completed") return t.status === "done";
        if (filter === "Mock Tests") return isMockType(t.type);
        return true;
      })
      .filter((t) => !q || `${t.title} ${t.subject} ${t.chapter || ""}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "done" ? 1 : -1;
        return (a.date || "") < (b.date || "") ? -1 : 1;
      });
  }, [tasks, filter, search]);

  const handleToggle = (task, lock) => {
    if (task.status === "todo" && lock && !lock.unlocked) {
      notify("Test is still locked", "info", `Finish ${lock.pending} prerequisite task(s) first.`);
      return;
    }
    const done = task.status === "done";
    toggleTask(task.id);
    notify(!done ? "Task complete — nice work!" : "Moved back to to-do", !done ? "success" : "info", task.title);
  };

  const handleAdd = (event) => {
    event?.preventDefault();
    if (!draft.title.trim()) {
      notify("Give your task a title", "error", "A short name like “Revise thermodynamics” works best.");
      return;
    }
    addCustomTask({ ...draft, title: draft.title.trim(), minutes: Number(draft.minutes) || 45 });
    setDraft({ title: "", subject: "Physics", date: todayISO(), minutes: "45" });
    setShowAdd(false);
    setFilter("All Tasks");
    notify("Task added to your plan", "success", draft.title.trim());
  };

  const openReschedule = (task) => {
    setRescheduling(task);
    setNewDate(task.date || now);
  };

  const confirmReschedule = () => {
    rescheduleTask(rescheduling.id, newDate);
    notify("Task rescheduled", "success", `${rescheduling.title} → ${formatDate(newDate)}`);
    setRescheduling(null);
  };

  const submitAttempt = (event) => {
    event.preventDefault();
    const score = Number(attempt.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      notify("Enter a score from 0–100", "error", "Percentages only, e.g. 72.");
      return;
    }
    recordAttempt(mockDetails.id, { score, weakTopics: attempt.weakTopics.trim() });
    setAttempt({ score: "", weakTopics: "" });
    notify("Result recorded", "success", `${mockDetails.title}: ${score}%`);
  };

  const askReplan = () => {
    if (overdue.length === 0) {
      notify("Nothing overdue", "info", "Your schedule is on track.");
      return;
    }
    setConfirmReplan(true);
  };

  const doReplan = () => {
    const result = replanRemaining({ tasks, examISO: planMeta?.examDate || addDaysISO(now, 30), dailyMinutes: planMeta?.dailyMinutes || 150, offDays: planMeta?.offDays || [] });
    applyReplannedDates(result.tasks);
    setConfirmReplan(false);
    setFilter("Upcoming");
    notify("Schedule revised", "success", `${result.moved} task(s) moved to open days${result.unfit > 0 ? ` · ${result.unfit} still don't fit` : ""}.`);
  };

  const refreshMock = mockDetails ? byId[mockDetails.id] : null;

  return (
    <>
      <div className="page-head split">
        <div>
          <h1>Study Planner</h1>
          <p>
            {planMeta
              ? `${planMeta.exam} · exam ${formatDate(planMeta.examDate)}${daysLeft !== null ? ` · ${daysLeft} day(s) left` : ""}`
              : "Demo tasks + anything you add. Generate an exam plan to fill this with structured sessions and mocks."}
          </p>
        </div>
        <div className="planner-head-actions">
          {overdue.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={askReplan}>
              <FiRotateCcw /> Replan ({overdue.length} overdue)
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(true)}>
            <FiPlus /> Add task
          </button>
          <Link to="/planner/new" className="btn btn-primary btn-sm">
            <FiCalendar /> {planMeta ? "Regenerate plan" : "Create exam plan"}
          </Link>
        </div>
      </div>

      <Reveal className="card planner-progress">
        <div className="planner-progress-text">
          <strong>{doneCount} of {tasks.length} done</strong>
          <span>
            {pct}% complete
            {stats.attempted > 0 && ` · ${stats.attempted}/${stats.total} mocks attempted${stats.avg !== null ? ` · avg ${stats.avg}%` : ""}`}
          </span>
        </div>
        <div className="progress-track big">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </Reveal>

      {(stats.weakTopics.length > 0 || overdue.length > 0) && (
        <Reveal className="card focus-panel">
          <div>
            <h3><FiTarget /> Revision focus</h3>
            <p className="section-subtitle">Weak topics from your test attempts — revise these first</p>
          </div>
          <div className="focus-chips">
            {stats.weakTopics.map((w) => (
              <span key={w} className="badge badge-rose"><FiAlertTriangle /> {w}</span>
            ))}
            {overdue.length > 0 && (
              <span className="badge badge-yellow">{overdue.length} overdue task(s) — use Replan</span>
            )}
            {stats.weakTopics.length === 0 && (
              <span className="badge badge-green"><FiAward /> Nothing overdue in tests — keep going</span>
            )}
          </div>
        </Reveal>
      )}

      <div className="planner-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
          {FILTERS.map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <label className="planner-search">
          <FiSearch aria-hidden="true" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter tasks…" aria-label="Filter tasks by keyword" />
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<FiCalendar />}
          title={filter === "Completed" ? "Nothing done yet — yet." : filter === "Today" ? "Today is clear" : "No tasks match"}
          hint={filter === "Today" ? "All of today's sessions are done, or nothing is scheduled. Enjoy it." : "Try another filter — or generate an exam plan to fill this up."}
          action={
            <Link to="/planner/new" className="btn btn-primary btn-sm"><FiCalendar /> Create exam plan</Link>
          }
        />
      ) : (
        <div className="task-grid stagger">
          {visible.map((task, i) => {
            const done = task.status === "done";
            const lock = isMockType(task.type) ? unlockInfo(task, byId, planMeta?.examDate || addDaysISO(now, 30)) : null;
            const locked = lock && !lock.unlocked && !done;
            const attempts = task.attempts || [];
            return (
              <div key={task.id} className={`card card-lift plan-card ${done ? "done" : ""} ${locked ? "locked" : ""}`} style={{ "--i": Math.min(i, 8) }}>
                <button
                  className="task-check large"
                  onClick={() => handleToggle(task, lock)}
                  aria-pressed={done}
                  disabled={!!locked}
                  title={locked ? `Locked — finish ${lock.pending} prerequisite(s)` : undefined}
                  aria-label={done ? `Mark ${task.title} as not done` : locked ? `${task.title} is locked` : `Mark ${task.title} as done`}
                >
                  {done ? <FiCheck /> : locked ? <FiLock /> : null}
                </button>
                <div className="plan-body">
                  <strong>{task.title}</strong>
                  <small><FiClock /> {formatDate(task.date)} · {task.minutes} min · {TASK_TYPES[task.type] || task.type}</small>
                  <small className="plan-crumb">{task.exam} · {task.subject}{task.chapter && task.chapter !== task.title ? ` · ${task.chapter}` : ""}</small>
                  {locked && <small className="lock-note"><FiLock /> Unlocks after {lock.pending} more task(s)</small>}
                  {attempts.length > 0 && (
                    <small className="attempt-note"><FiAward /> {attempts.length} attempt(s) · avg {Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)}%</small>
                  )}
                  <div className="plan-tags">
                    <span className={`badge ${TYPE_BADGE[task.type] || "badge"}`}>{TASK_TYPES[task.type] || task.type}</span>
                    {task.date === now && task.status === "todo" && <span className="badge badge-green">Today</span>}
                    {isOverdue(task, now) && <span className="badge badge-rose">Overdue</span>}
                    {task.pinned && <span className="badge badge-violet">Pinned</span>}
                  </div>
                  <div className="plan-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openReschedule(task)}><FiEdit3 /> Reschedule</button>
                    {isMockType(task.type) && (
                      <button className="btn btn-ghost btn-sm" onClick={() => { setMockDetails(task); setAttempt({ score: "", weakTopics: "" }); }}>
                        <FiAward /> {attempts.length > 0 ? "Results" : "Details"}
                      </button>
                    )}
                    {(task.type === "custom" || (!task.pinned && task.planId)) && (
                      <button className="delete-btn" onClick={() => setPendingDelete(task)} aria-label={`Delete ${task.title}`}>
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="btn btn-ghost btn-sm danger-link" onClick={() => setConfirmReset(true)}>
        <FiTrash2 /> Reset all planner data
      </button>

      {showAdd && (
        <Modal title="Add a study task" confirmLabel="Add task" onConfirm={handleAdd} onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="modal-form">
            <div className="field">
              <label htmlFor="task-title">Title</label>
              <input id="task-title" className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Revise thermodynamics formulas" maxLength={80} />
            </div>
            <div className="modal-row">
              <div className="field">
                <label htmlFor="task-subject">Subject</label>
                <select id="task-subject" className="input" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })}>
                  {["Physics", "Chemistry", "Maths", "Biology", "Mock Test", "General"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="task-minutes">Minutes</label>
                <input id="task-minutes" type="number" min="10" max="480" className="input" value={draft.minutes} onChange={(e) => setDraft({ ...draft, minutes: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="task-date">Scheduled date</label>
              <input id="task-date" type="date" className="input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </div>
          </form>
        </Modal>
      )}

      {rescheduling && (
        <Modal title="Reschedule task" confirmLabel="Move task" onConfirm={confirmReschedule} onClose={() => setRescheduling(null)}>
          <p>“{rescheduling.title}”</p>
          <div className="field">
            <label htmlFor="new-date">New date</label>
            <input id="new-date" type="date" className="input" value={newDate} min={todayISO()} onChange={(e) => setNewDate(e.target.value)} />
          </div>
        </Modal>
      )}

      {refreshMock && (
        <Modal title={refreshMock.title} confirmLabel="Done" onConfirm={() => setMockDetails(null)} onClose={() => setMockDetails(null)}>
          <p>{refreshMock.exam} · {refreshMock.subject} · {refreshMock.minutes} min · scheduled {formatDate(refreshMock.date)}</p>
          <p className="muted">{refreshMock.notes}</p>
          {(refreshMock.attempts || []).length > 0 ? (
            <div className="attempt-list">
              {refreshMock.attempts.map((a, i) => (
                <div key={i} className="attempt-row">
                  <strong>{a.score}%</strong>
                  <span>{formatDate(a.date)}{a.weakTopics ? ` · weak: ${a.weakTopics}` : ""}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-note">No attempts recorded yet — scores and weak topics will appear here.</p>
          )}
          <form onSubmit={submitAttempt} className="attempt-form">
            <div className="modal-row">
              <div className="field">
                <label htmlFor="attempt-score">Score (%)</label>
                <input id="attempt-score" type="number" min="0" max="100" className="input" value={attempt.score} onChange={(e) => setAttempt({ ...attempt, score: e.target.value })} placeholder="e.g. 72" />
              </div>
              <div className="field">
                <label htmlFor="attempt-weak">Weak topics</label>
                <input id="attempt-weak" className="input" value={attempt.weakTopics} onChange={(e) => setAttempt({ ...attempt, weakTopics: e.target.value })} placeholder="e.g. friction, GOC" maxLength={120} />
              </div>
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">Record result</button>
          </form>
        </Modal>
      )}

      {pendingDelete && (
        <Modal title="Delete this task?" confirmLabel="Delete" danger onClose={() => setPendingDelete(null)} onConfirm={() => {
          removeTask(pendingDelete.id);
          notify("Task deleted", "info", pendingDelete.title);
          setPendingDelete(null);
        }}>
          <p>“{pendingDelete.title}” will be removed permanently.</p>
        </Modal>
      )}

      {confirmReplan && (
        <Modal title="Revise the schedule?" confirmLabel="Replan now" onClose={() => setConfirmReplan(false)} onConfirm={doReplan}>
          <p>{overdue.length} overdue task(s) will move into open days before {planMeta ? formatDate(planMeta.examDate) : "the exam"}.</p>
          <p>Completed tasks, test attempts and pinned full mocks stay exactly where they are.</p>
        </Modal>
      )}

      {confirmReset && (
        <Modal title="Reset all planner data?" confirmLabel="Reset" danger onClose={() => setConfirmReset(false)} onConfirm={() => {
          resetDemo();
          setFilter("All Tasks");
          setConfirmReset(false);
          notify("Planner cleared", "info", "Generate an exam plan to start fresh.");
        }}>
          <p>Clears every task, attempt and plan on this device.</p>
        </Modal>
      )}
    </>
  );
}

export default StudyPlanner;
