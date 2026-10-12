import { useState } from "react";
import { FiUser, FiTarget, FiBell, FiMail, FiTrash2, FiEdit3, FiMinus, FiPlus } from "react-icons/fi";
import Reveal from "../components/ui/Reveal";
import Modal from "../components/ui/Modal";
import { useToast } from "../components/ui/useToast";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { student, achievements, dailyGoal } from "../data/demoData";
import "./Profile.css";

// Demo profile: everything persists locally until Firebase auth arrives.
function Profile() {
  const { notify } = useToast();
  const [goal, setGoal] = useLocalStorage("sg-goal", student.goal);
  const [target, setTarget] = useLocalStorage("sg-daily-target", dailyGoal.targetMinutes);
  const [reminders, setReminders] = useLocalStorage("sg-reminders", true);
  const [weeklyReport, setWeeklyReport] = useLocalStorage("sg-weekly-report", false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(goal);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const saveGoal = () => {
    if (!goalDraft.trim()) {
      notify("Goal can't be empty", "error", "Try something like “JEE 2027 · IIT CSE”.");
      return;
    }
    setGoal(goalDraft.trim());
    setEditingGoal(false);
    notify("Goal updated", "success", goalDraft.trim());
  };

  const bumpTarget = (delta) => {
    const next = Math.max(30, Math.min(360, target + delta));
    setTarget(next);
  };

  const wipeDemo = () => {
    ["sg-goal", "sg-daily-target", "sg-reminders", "sg-weekly-report", "sg-completed-tasks", "sg-custom-tasks", "sg-focus-minutes"].forEach((k) => localStorage.removeItem(k));
    // Reset in-memory state too, so the UI matches storage immediately.
    setGoal(student.goal);
    setTarget(dailyGoal.targetMinutes);
    setReminders(true);
    setWeeklyReport(false);
    setConfirmWipe(false);
    notify("Demo data reset", "info", "Fresh demo state restored.");
  };

  return (
    <>
      <div className="page-head">
        <h1>Profile</h1>
        <p>Demo profile stored on this device — sign-in and cloud sync arrive with Firebase.</p>
      </div>

      <Reveal className="card profile-hero">
        <span className="profile-avatar large">
          <FiUser />
        </span>
        <div className="profile-info">
          <span className="badge badge-violet">{student.grade}</span>
          <h2>{student.name}</h2>
          <p className="profile-goal-text">🎯 {goal}</p>
          <div className="profile-badges">
            <span className="badge badge-yellow">🔥 {student.streakDays} day streak</span>
            <span className="badge badge-green">{student.averageScore}% avg score</span>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setGoalDraft(goal);
            setEditingGoal(true);
          }}
        >
          <FiEdit3 /> Edit goal
        </button>
      </Reveal>

      <div className="profile-grid">
        <Reveal className="card panel">
          <h3><FiTarget /> Daily focus target</h3>
          <p className="section-subtitle">Used by the dashboard goal ring</p>
          <div className="stepper">
            <button onClick={() => bumpTarget(-15)} aria-label="Decrease daily target by 15 minutes">
              <FiMinus />
            </button>
            <strong>{target} min</strong>
            <button onClick={() => bumpTarget(15)} aria-label="Increase daily target by 15 minutes">
              <FiPlus />
            </button>
          </div>
          <div className="toggle-row">
            <span>
              <FiBell /> Study reminders
              <small>Demo switch — real push alerts later</small>
            </span>
            <button
              role="switch"
              aria-checked={reminders}
              aria-label="Toggle study reminders"
              className={`toggle ${reminders ? "on" : ""}`}
              onClick={() => {
                setReminders(!reminders);
                notify(!reminders ? "Reminders on" : "Reminders off", "info", "Demo preference saved.");
              }}
            >
              <span className="knob" />
            </button>
          </div>
          <div className="toggle-row">
            <span>
              <FiMail /> Weekly report email
              <small>Demo switch — no emails are sent</small>
            </span>
            <button
              role="switch"
              aria-checked={weeklyReport}
              aria-label="Toggle weekly report email"
              className={`toggle ${weeklyReport ? "on" : ""}`}
              onClick={() => {
                setWeeklyReport(!weeklyReport);
                notify(!weeklyReport ? "Weekly report on" : "Weekly report off", "info", "Demo preference saved.");
              }}
            >
              <span className="knob" />
            </button>
          </div>
        </Reveal>

        <Reveal delay={90} className="card panel">
          <h3>🏅 Achievements</h3>
          <p className="section-subtitle">Demo badges preview the rewards system</p>
          <div className="mini-badges">
            {achievements.map((a) => (
              <div key={a.id} className={`mini-badge ${a.unlocked ? "" : "locked"}`}>
                <span>{a.unlocked ? a.icon : "🔒"}</span>
                <div>
                  <strong>{a.title}</strong>
                  <small>{a.unlocked ? a.detail : "Locked"}</small>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm danger-link" onClick={() => setConfirmWipe(true)}>
            <FiTrash2 /> Reset all demo data
          </button>
        </Reveal>
      </div>

      {editingGoal && (
        <Modal title="Edit your goal" confirmLabel="Save goal" onConfirm={saveGoal} onClose={() => setEditingGoal(false)}>
          <div className="field">
            <label htmlFor="goal-input">Where are you headed?</label>
            <input
              id="goal-input"
              className="input"
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              maxLength={60}
              placeholder="e.g. JEE 2027 · Target IIT Bombay CSE"
            />
          </div>
        </Modal>
      )}

      {confirmWipe && (
        <Modal
          title="Reset all demo data?"
          confirmLabel="Reset everything"
          danger
          onClose={() => setConfirmWipe(false)}
          onConfirm={wipeDemo}
        >
          <p>Clears tasks, goals, focus minutes and preferences stored on this device.</p>
        </Modal>
      )}
    </>
  );
}

export default Profile;
