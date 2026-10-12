import { Link } from "react-router-dom";
import {
  FiCompass,
  FiCalendar,
  FiMessageCircle,
  FiMapPin,
  FiBarChart2,
  FiUser,
  FiClock,
  FiPlay,
  FiZap,
  FiTarget,
  FiCheck,
  FiTrendingUp,
  FiAward,
} from "react-icons/fi";
import FeatureCard from "../components/FeatureCard";
import Reveal from "../components/ui/Reveal";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import ProgressRing from "../components/ui/ProgressRing";
import { useToast } from "../components/ui/useToast";
import { useInView } from "../hooks/useInView";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useStudyPlan } from "../hooks/useStudyPlan";
import { TASK_TYPES } from "../data/syllabus";
import {
  todayISO, addDaysISO, formatDate, minutesDone, streakDays, mockStats,
} from "../lib/planGenerator";
import { student, dailyGoal, achievements } from "../data/demoData";
import "./Dashboard.css";

const features = [
  { icon: <FiCompass />, title: "Career Guidance", description: "Guided quiz → careers that fit you.", to: "/career", accent: "indigo" },
  { icon: <FiCalendar />, title: "Study Planner", description: "Tasks, timers and daily focus.", to: "/planner", accent: "teal" },
  { icon: <FiMessageCircle />, title: "AI Tutor", description: "Honest chat UI — AI connects later.", to: "/tutor", accent: "green" },
  { icon: <FiMapPin />, title: "College Finder", description: "Filter demo colleges by your needs.", to: "/colleges", accent: "orange" },
  { icon: <FiBarChart2 />, title: "Progress Tracker", description: "Rings, bars and weekly trends.", to: "/progress", accent: "purple" },
  { icon: <FiUser />, title: "Profile", description: "Goals, badges and preferences.", to: "/profile", accent: "pink" },
];

const statIcons = [<FiClock />, <FiCheck />, <FiZap />, <FiTrendingUp />];

function Dashboard() {
  const { notify } = useToast();
  // Same records as Planner + Progress — stats always agree.
  const { tasks, toggleTask } = useStudyPlan();
  const [focusDone, setFocusDone] = useLocalStorage("sg-focus-minutes", dailyGoal.doneMinutes);
  const [goal] = useLocalStorage("sg-goal", student.goal);
  const [barsRef, barsInView] = useInView({ threshold: 0.25 });
  const [progressRef, progressInView] = useInView({ threshold: 0.25 });

  const now = todayISO();
  const doneTasks = tasks.filter((t) => t.status === "done");
  const hoursDone = minutesDone(tasks) / 60;
  const completion = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const streak = streakDays(tasks, now);
  const mocks = mockStats(tasks);

  // Last 7 days of REAL completions (minutes per day).
  const weekActivity = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysISO(now, i - 6);
    const minutes = tasks
      .filter((t) => t.status === "done" && (t.completedAt || t.date) === date)
      .reduce((sum, t) => sum + (t.minutes || 0), 0);
    return {
      date,
      day: i === 6 ? "Today" : new Date(`${date}T00:00`).toLocaleDateString("en-IN", { weekday: "short" }),
      hours: Math.round((minutes / 60) * 10) / 10,
    };
  });
  const maxHours = Math.max(1, ...weekActivity.map((d) => d.hours));
  const bestDay = weekActivity.reduce((a, b) => (b.hours > a.hours ? b : a), weekActivity[0]);

  const stats = [
    { label: "Hours logged", value: hoursDone, decimals: 1, suffix: " hrs", hint: `${doneTasks.length} tasks completed` },
    { label: "Plan completion", value: completion, decimals: 0, suffix: "%", hint: `${doneTasks.length} of ${tasks.length} tasks` },
    { label: "Day streak", value: streak, decimals: 0, suffix: streak === 1 ? " day" : " days", hint: streak > 0 ? "Keep it burning!" : "Complete a task today" },
    { label: "Mock average", value: mocks.avg ?? 0, decimals: 0, suffix: "%", hint: mocks.attempted > 0 ? `${mocks.attempted}/${mocks.total} mocks attempted` : "No attempts yet" },
  ];

  // Subjects derived from the same task records.
  const subjects = Object.values(
    tasks.reduce((acc, t) => {
      acc[t.subject] = acc[t.subject] || { subject: t.subject, total: 0, done: 0 };
      acc[t.subject].total += 1;
      if (t.status === "done") acc[t.subject].done += 1;
      return acc;
    }, {})
  )
    .map((g) => ({ ...g, percent: g.total ? Math.round((g.done / g.total) * 100) : 0 }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);

  const upcoming = tasks
    .filter((t) => t.status === "todo" && t.date)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 4);
  const previewTasks = upcoming.length > 0 ? upcoming : tasks.filter((t) => t.status === "todo").slice(0, 4);

  const focusPct = Math.min(100, Math.round((focusDone / dailyGoal.targetMinutes) * 100));

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handleToggle = (task) => {
    const done = task.status === "done";
    toggleTask(task.id);
    if (!done) notify("Task complete — nice work!", "success", task.title);
    else notify("Moved back to to-do", "info", task.title);
  };

  const logFocus = () => {
    if (focusDone >= dailyGoal.targetMinutes) {
      notify("Daily goal already smashed", "info", "Come back tomorrow for a fresh goal.");
      return;
    }
    const next = Math.min(dailyGoal.targetMinutes, focusDone + 25);
    setFocusDone(next);
    if (next >= dailyGoal.targetMinutes) {
      notify("Daily goal complete! 🎉", "success", `${dailyGoal.targetMinutes} focused minutes done.`);
    } else {
      notify("+25 focused minutes logged", "success", `${next} of ${dailyGoal.targetMinutes} min`);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="card hero">
        <div className="hero-orbs" aria-hidden="true">
          <span className="hero-orb hero-orb-a" />
          <span className="hero-orb hero-orb-b" />
        </div>
        <div className="hero-main">
          <p className="hero-date">{today} · Your live records</p>
          <h1>
            Welcome back, <span className="gradient-text">{student.firstName}</span>
          </h1>
          <p className="hero-sub">
            <strong>{hoursDone.toFixed(1)} hrs</strong> logged ·{" "}
            <strong>{streak}-day streak</strong> · next up:{" "}
            {previewTasks[0] ? previewTasks[0].title : "generate an exam plan to begin"}.
          </p>
          <div className="hero-actions">
            <Link to="/planner" className="btn btn-primary">
              <FiPlay /> Continue studying
            </Link>
            <Link to="/career" className="btn btn-secondary">
              Explore careers
            </Link>
          </div>
          <p className="hero-goal-line">🎯 {goal}</p>
        </div>
        <div className="hero-side">
          <ProgressRing percent={focusPct} label={`${focusPct}%`} sublabel="daily goal" />
          <div className="hero-goal">
            <small>
              <FiTarget /> {dailyGoal.label}
            </small>
            <strong>
              {focusDone} / {dailyGoal.targetMinutes} min
            </strong>
            <button className="btn btn-secondary btn-sm" onClick={logFocus}>
              + Log 25 min
            </button>
          </div>
        </div>
      </section>

      {/* Animated stats — computed from the shared task records */}
      <section className="stats-grid stagger">
        {stats.map((s, i) => (
          <div key={s.label} className="card card-lift stat" style={{ "--i": i }}>
            <span className="stat-icon">{statIcons[i]}</span>
            <small>{s.label}</small>
            <strong>
              <AnimatedNumber value={s.value} decimals={s.decimals} suffix={s.suffix} />
            </strong>
            <span className="stat-hint">{s.hint}</span>
          </div>
        ))}
      </section>

      {/* Feature grid */}
      <section>
        <Reveal>
          <h2 className="section-title">Explore StudyGuider</h2>
          <p className="section-subtitle">Every tool opens a real, working page — no dead ends.</p>
        </Reveal>
        <div className="features-grid stagger">
          {features.map((f, i) => (
            <FeatureCard key={f.to} {...f} index={i} />
          ))}
        </div>
      </section>

      {/* Activity + tasks + progress */}
      <section className="dashboard-grid">
        <Reveal className="card panel">
          <div className="panel-head">
            <div>
              <h3>Weekly activity</h3>
              <p className="section-subtitle">Hours completed per day · from your records</p>
            </div>
            <span className="badge badge-violet">
              <FiAward /> Best: {bestDay.day}
            </span>
          </div>
          <div className="bars" ref={barsRef}>
            {weekActivity.map((d, i) => (
              <div
                key={d.date}
                className="bar-col"
                title={`${d.day}: ${d.hours} hours`}
                tabIndex={0}
                role="img"
                aria-label={`${d.day}: ${d.hours} hours completed`}
              >
                <span className="bar-value">{d.hours}h</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${barsInView ? "grown" : ""}`}
                    style={{ "--h": `${(d.hours / maxHours) * 100}%`, "--d": `${i * 80}ms` }}
                  />
                </div>
                <small>{d.day}</small>
              </div>
            ))}
          </div>
          <p className="panel-total">
            Total <strong>{hoursDone.toFixed(1)} hrs</strong> logged · {doneTasks.length} tasks done
          </p>
        </Reveal>

        <Reveal delay={90} className="card panel">
          <div className="panel-head">
            <div>
              <h3>Up next</h3>
              <p className="section-subtitle">Tap a task to mark it done</p>
            </div>
          </div>
          <ul className="task-list">
            {previewTasks.map((task) => {
              const done = task.status === "done";
              return (
                <li key={task.id} className={`task ${done ? "done" : ""}`}>
                  <button
                    className="task-check"
                    onClick={() => handleToggle(task)}
                    aria-pressed={done}
                    aria-label={done ? `Mark ${task.title} as not done` : `Mark ${task.title} as done`}
                  >
                    {done && <FiCheck />}
                  </button>
                  <div className="task-body">
                    <strong>{task.title}</strong>
                    <small>
                      <FiClock /> {formatDate(task.date)} · {task.minutes} min · {TASK_TYPES[task.type] || task.type}
                    </small>
                  </div>
                  <span className="badge badge-blue">
                    {task.subject}
                  </span>
                </li>
              );
            })}
          </ul>
          <Link to="/planner" className="panel-link">
            Open full planner →
          </Link>
        </Reveal>

        <Reveal delay={160} className="card panel">
          <div className="panel-head">
            <div>
              <h3>Syllabus pulse</h3>
              <p className="section-subtitle">Completion per subject</p>
            </div>
          </div>
          <div className="progress-list" ref={progressRef}>
            {subjects.length === 0 && (
              <p className="section-subtitle">No tasks yet — generate an exam plan to start tracking.</p>
            )}
            {subjects.map((p) => (
              <div key={p.subject} className="progress-row">
                <div className="progress-head">
                  <strong>{p.subject}</strong>
                  <small>{p.done} / {p.total} tasks</small>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: progressInView ? `${p.percent}%` : "0%" }}
                  />
                </div>
                <span className="progress-pct">{p.percent}%</span>
              </div>
            ))}
          </div>
          <Link to="/progress" className="panel-link">
            View detailed analytics →
          </Link>
        </Reveal>
      </section>

      {/* Achievements */}
      <Reveal>
        <section className="card achievements">
          <div className="panel-head">
            <div>
              <h3>Achievements</h3>
              <p className="section-subtitle">Demo badges — real unlocks arrive with accounts</p>
            </div>
          </div>
          <div className="badge-row">
            {achievements.map((a) => (
              <div key={a.id} className={`achievement ${a.unlocked ? "" : "locked"}`} title={a.detail}>
                <span className="achievement-icon">{a.unlocked ? a.icon : "🔒"}</span>
                <strong>{a.title}</strong>
                <small>{a.unlocked ? a.detail : "Locked · keep going"}</small>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </>
  );
}

export default Dashboard;
