import { useEffect, useState } from "react";
import { FiTrendingUp, FiZap, FiTarget } from "react-icons/fi";
import Reveal from "../components/ui/Reveal";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import ProgressRing from "../components/ui/ProgressRing";
import { Skeleton } from "../components/ui/Skeleton";
import { useInView } from "../hooks/useInView";
import { useStudyPlan } from "../hooks/useStudyPlan";
import {
  todayISO, addDaysISO, minutesDone, streakDays, mockStats, isOverdue,
} from "../lib/planGenerator";
import "./ProgressTracker.css";

const ranges = ["This week", "This month"];

// All figures are computed from the shared task records (same store as
// Dashboard + Planner). Range switches briefly show skeletons to
// demonstrate the loading pattern.
function ProgressTracker() {
  const { tasks } = useStudyPlan();
  const [range, setRange] = useState(ranges[0]);
  const [loading, setLoading] = useState(true);
  const [barsRef, barsInView] = useInView({ threshold: 0.25 });

  useEffect(() => {
    // Timer callback — runs outside the render cycle.
    const timer = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(timer);
  }, [loading]);

  const switchRange = (r) => {
    if (r === range) return;
    setRange(r);
    setLoading(true);
  };

  const now = todayISO();
  const doneTasks = tasks.filter((t) => t.status === "done");
  const hours = minutesDone(tasks) / 60;
  const completion = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const streak = streakDays(tasks, now);
  const mocks = mockStats(tasks);
  const overdueCount = tasks.filter((t) => isOverdue(t, now)).length;

  // Week: completed minutes per day for the last 7 days.
  const weekBars = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysISO(now, i - 6);
    const minutes = doneTasks
      .filter((t) => (t.completedAt || t.date) === date)
      .reduce((sum, t) => sum + (t.minutes || 0), 0);
    return {
      key: date,
      label: i === 6 ? "Today" : new Date(`${date}T00:00`).toLocaleDateString("en-IN", { weekday: "short" }),
      hours: Math.round((minutes / 60) * 10) / 10,
    };
  });

  // Month: completed minutes per 6-day bucket across the last 30 days.
  const monthBars = Array.from({ length: 5 }, (_, b) => {
    const start = addDaysISO(now, -29 + b * 6);
    const end = addDaysISO(now, -29 + b * 6 + 5);
    const minutes = doneTasks
      .filter((t) => {
        const d = t.completedAt || t.date;
        return d && d >= start && d <= end;
      })
      .reduce((sum, t) => sum + (t.minutes || 0), 0);
    return { key: `w${b}`, label: `W${b + 1}`, hours: Math.round((minutes / 60) * 10) / 10 };
  });

  const bars = range === "This month" ? monthBars : weekBars;
  const max = Math.max(1, ...bars.map((d) => d.hours));
  const total = bars.reduce((sum, d) => sum + d.hours, 0);

  const subjects = Object.values(
    tasks.reduce((acc, t) => {
      acc[t.subject] = acc[t.subject] || { subject: t.subject, total: 0, done: 0 };
      acc[t.subject].total += 1;
      if (t.status === "done") acc[t.subject].done += 1;
      return acc;
    }, {})
  )
    .map((g) => ({ ...g, percent: g.total ? Math.round((g.done / g.total) * 100) : 0 }))
    .sort((a, b) => b.percent - a.percent);

  const highlights = [
    { label: "Plan completion", text: `${completion}% · ${doneTasks.length} of ${tasks.length} tasks` },
    { label: "Mock tests", text: mocks.attempted > 0 ? `${mocks.attempted}/${mocks.total} attempted · avg ${mocks.avg}%` : `${mocks.total} scheduled · no attempts yet` },
    { label: "Day streak", text: streak > 0 ? `${streak} day(s) — keep it going` : "Complete a task to start one" },
    { label: "Needs attention", text: overdueCount > 0 ? `${overdueCount} overdue task(s) — Replan in the planner` : "Nothing overdue. On track." },
  ];

  return (
    <>
      <div className="page-head split">
        <div>
          <h1>Progress Tracker</h1>
          <p>Live analytics from your planner records — same data as the dashboard.</p>
        </div>
        <div className="filter-tabs" role="tablist" aria-label="Time range">
          {ranges.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              className={`filter-tab ${range === r ? "active" : ""}`}
              onClick={() => switchRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="progress-grid">
          <div className="card skeleton-card"><Skeleton lines={4} /></div>
          <div className="card skeleton-card"><Skeleton lines={5} /></div>
          <div className="card skeleton-card"><Skeleton lines={3} /></div>
        </div>
      ) : (
        <div className="progress-grid" key={range}>
          <Reveal className="card ring-panel">
            <ProgressRing percent={completion} size={150} label={`${completion}%`} sublabel="tasks done" />
            <div className="ring-facts">
              <div>
                <strong>
                  <AnimatedNumber value={hours} decimals={1} suffix=" hrs" />
                </strong>
                <small>logged in records</small>
              </div>
              <div>
                <strong>
                  <FiZap /> {streak} day(s)
                </strong>
                <small>current streak</small>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80} className="card panel">
            <div className="panel-head">
              <div>
                <h3><FiTrendingUp /> Activity trend</h3>
                <p className="section-subtitle">{range} · completed hours</p>
              </div>
            </div>
            <div className="bars compact" ref={barsRef}>
              {bars.map((d, i) => (
                <div
                  key={d.key}
                  className="bar-col"
                  title={`${d.label}: ${d.hours} hours`}
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.label}: ${d.hours} hours completed`}
                >
                  <span className="bar-value">{d.hours}h</span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${barsInView ? "grown" : ""}`}
                      style={{ "--h": `${(d.hours / max) * 100}%`, "--d": `${i * 70}ms` }}
                    />
                  </div>
                  <small>{d.label}</small>
                </div>
              ))}
            </div>
            <p className="panel-total">Total <strong>{Math.round(total * 10) / 10} hrs</strong> in view</p>
          </Reveal>

          <Reveal delay={150} className="card panel">
            <div className="panel-head">
              <div>
                <h3><FiTarget /> Subject mastery</h3>
                <p className="section-subtitle">Task completion per subject</p>
              </div>
              {mocks.avg !== null && (
                <span className="badge badge-green">
                  <AnimatedNumber value={mocks.avg} suffix="%" /> mock avg
                </span>
              )}
            </div>
            {subjects.length === 0 ? (
              <p className="section-subtitle" style={{ marginTop: 12 }}>No tasks yet — generate an exam plan to start tracking.</p>
            ) : (
              <div className="mastery-list">
                {subjects.map((p) => (
                  <div key={p.subject} className="mastery-row">
                    <div className="progress-head">
                      <strong>{p.subject}</strong>
                      <small>{p.done} / {p.total} tasks</small>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill animate-width" style={{ "--w": `${p.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="highlight-list">
              {highlights.map((h) => (
                <div key={h.label} className="simple-row">
                  <strong>{h.label}</strong>
                  <p>{h.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      )}
    </>
  );
}

export default ProgressTracker;
