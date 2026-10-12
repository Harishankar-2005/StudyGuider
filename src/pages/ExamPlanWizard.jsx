import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiCalendar, FiCheck, FiMinus, FiPlus, FiRotateCcw } from "react-icons/fi";
import Reveal from "../components/ui/Reveal";
import Modal from "../components/ui/Modal";
import { useToast } from "../components/ui/useToast";
import { useStudyPlan } from "../hooks/useStudyPlan";
import { SAMPLE_EXAM, SAMPLE_SYLLABUS } from "../data/syllabus";
import { generatePlan, todayISO, addDaysISO, formatDate } from "../lib/planGenerator";
import "./ExamPlanWizard.css";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAILY_OPTIONS = [60, 90, 120, 150, 180, 240];

const subjectsOf = [...new Set(SAMPLE_SYLLABUS.map((c) => c.subject))];

/* Guided exam-plan builder. The deterministic engine in
   lib/planGenerator.js does all scheduling; this wizard only collects
   inputs and confirms destructive replacements. */
function ExamPlanWizard() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { tasks, replacePlanTasks } = useStudyPlan();

  const [step, setStep] = useState(0);
  const [examName, setExamName] = useState(SAMPLE_EXAM.name);
  const [selected, setSelected] = useState(SAMPLE_SYLLABUS.map((c) => c.id));
  const [startISO, setStartISO] = useState(todayISO());
  const [examISO, setExamISO] = useState(addDaysISO(todayISO(), 45));
  const [dailyMinutes, setDailyMinutes] = useState(150);
  const [offDays, setOffDays] = useState([]);
  const [confirmGenerate, setConfirmGenerate] = useState(false);

  const chapters = useMemo(() => SAMPLE_SYLLABUS.filter((c) => selected.includes(c.id)), [selected]);

  const preview = useMemo(
    () => generatePlan({ exam: examName.trim() || SAMPLE_EXAM.name, chapters, startISO, examISO, dailyMinutes, offDays }),
    [examName, chapters, startISO, examISO, dailyMinutes, offDays]
  );

  const existingFuture = tasks.filter((t) => t.planId && t.status === "todo" && !(t.attempts && t.attempts.length > 0));
  const preservedCount = tasks.filter((t) => t.planId && (t.status === "done" || (t.attempts && t.attempts.length > 0))).length;

  const toggleChapter = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const toggleSubject = (subject) => {
    const ids = SAMPLE_SYLLABUS.filter((c) => c.subject === subject).map((c) => c.id);
    const allIn = ids.every((id) => selected.includes(id));
    setSelected((prev) => (allIn ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };

  const stepValid = () => {
    if (step === 0) return selected.length > 0;
    if (step === 1) return examISO > startISO && dailyMinutes >= 30;
    return !preview.error;
  };

  const doGenerate = () => {
    if (preview.error) {
      notify("Can't generate yet", "error", preview.error);
      return;
    }
    const { planId, tasks: fresh, summary } = preview;
    const result = replacePlanTasks(fresh, {
      planId,
      exam: summary.exam,
      examDate: examISO,
      dailyMinutes,
      offDays,
      chapterIds: chapters.map((c) => c.id),
      createdAt: todayISO(),
    });
    setConfirmGenerate(false);
    notify("Exam plan added to your planner", "success", `${result.replaced} tasks scheduled · ${result.preserved} completed records kept.`);
    navigate("/planner");
  };

  const askGenerate = () => {
    if (!stepValid()) {
      notify("Check this step", "info", step === 0 ? "Select at least one chapter." : "Exam date must be after the start date.");
      return;
    }
    if (existingFuture.length > 0) setConfirmGenerate(true);
    else doGenerate();
  };

  const estHours = Math.round(chapters.reduce((s, c) => s + c.minutes + 45, 0) / 60);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Create exam plan</h1>
          <p>Built from the labelled sample syllabus with fixed scheduling rules — every session lands in your Study Planner.</p>
        </div>
        <span className="badge badge-violet">Sample syllabus · local only</span>
      </div>

      <Reveal className="card wizard">
        <ol className="stepper-bar" aria-label="Plan builder progress">
          {["Syllabus", "Schedule", "Review"].map((label, i) => (
            <li key={label} className={`wizard-step ${i < step ? "done" : ""} ${i === step ? "current" : ""}`}>
              <span className="step-dot">{i < step ? <FiCheck /> : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <div className="wizard-progress">
          <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>

        {step === 0 && (
          <div className="wizard-body" key="w0">
            <h2>Which chapters are in scope?</h2>
            <p className="section-subtitle">
              {selected.length} of {SAMPLE_SYLLABUS.length} selected · ≈{estHours} hrs of study + practice. {SAMPLE_EXAM.note}
            </p>
            {subjectsOf.map((subject) => {
              const list = SAMPLE_SYLLABUS.filter((c) => c.subject === subject);
              const allIn = list.every((c) => selected.includes(c.id));
              return (
                <div key={subject} className="subject-block">
                  <div className="subject-head">
                    <strong>{subject}</strong>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleSubject(subject)}>
                      {allIn ? "Clear" : "Select all"}
                    </button>
                  </div>
                  <div className="chapter-grid">
                    {list.map((c) => (
                      <button
                        key={c.id}
                        className={`chapter-chip ${selected.includes(c.id) ? "selected" : ""}`}
                        aria-pressed={selected.includes(c.id)}
                        onClick={() => toggleChapter(c.id)}
                      >
                        <span className="chapter-check">{selected.includes(c.id) && <FiCheck />}</span>
                        <span>
                          <strong>{c.chapter}</strong>
                          <small>{Math.round(c.minutes / 60 * 10) / 10}h · weight {c.weightage}/5</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="wizard-body" key="w1">
            <h2>When is the exam?</h2>
            <p className="section-subtitle">Dates and daily capacity drive the whole schedule.</p>
            <div className="field">
              <label htmlFor="exam-name">Exam name</label>
              <input id="exam-name" className="input" value={examName} onChange={(e) => setExamName(e.target.value)} maxLength={60} />
            </div>
            <div className="modal-row">
              <div className="field">
                <label htmlFor="start-date">Start date</label>
                <input id="start-date" type="date" className="input" value={startISO} min={todayISO()} onChange={(e) => setStartISO(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="exam-date">Exam date</label>
                <input id="exam-date" type="date" className="input" value={examISO} min={addDaysISO(startISO, 1)} onChange={(e) => setExamISO(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Daily study time: {dailyMinutes} min</label>
              <div className="stepper slim">
                <button onClick={() => setDailyMinutes(Math.max(30, dailyMinutes - 30))} aria-label="Decrease daily minutes"><FiMinus /></button>
                <div className="chip-line">
                  {DAILY_OPTIONS.map((m) => (
                    <button key={m} className={`chip sm ${dailyMinutes === m ? "selected" : ""}`} onClick={() => setDailyMinutes(m)}>{m}m</button>
                  ))}
                </div>
                <button onClick={() => setDailyMinutes(Math.min(480, dailyMinutes + 30))} aria-label="Increase daily minutes"><FiPlus /></button>
              </div>
            </div>
            <div className="field">
              <label>Weekly off days (skipped by the scheduler)</label>
              <div className="chip-line">
                {DAY_NAMES.map((d, i) => (
                  <button key={d} className={`chip sm ${offDays.includes(i) ? "selected" : ""}`} aria-pressed={offDays.includes(i)} onClick={() => setOffDays(offDays.includes(i) ? offDays.filter((x) => x !== i) : [...offDays, i])}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-body" key="w2">
            <h2>Review the schedule</h2>
            {preview.error ? (
              <p className="review-error">{preview.error}</p>
            ) : (
              <>
                <div className="review-grid">
                  <div className="review-stat"><small>Study days</small><strong>{preview.summary.studyDays}</strong></div>
                  <div className="review-stat"><small>Total tasks</small><strong>{preview.summary.totalTasks}</strong></div>
                  <div className="review-stat"><small>Full mocks</small><strong>{preview.summary.fullMocks}</strong></div>
                  <div className="review-stat"><small>Planned hours</small><strong>{Math.round(preview.summary.totalMinutes / 60)}h</strong></div>
                </div>
                <ul className="review-rules">
                  <li><FiCheck /> Chapter study + practice for each of the {preview.summary.chapters} chapters</li>
                  <li><FiCheck /> Cumulative tests after every 3–4 chapters (unlock as you finish groups)</li>
                  <li><FiCheck /> {preview.summary.fullMocks} full mocks pinned near {formatDate(examISO)}</li>
                  <li><FiCheck /> Spaced revision ~6 days after each study session</li>
                </ul>
                {preview.summary.tight && (
                  <p className="review-warn">
                    Tight fit: {preview.summary.unplacedSessions} session(s) and {preview.summary.droppedRevisions} revision(s) didn't fit — add days, raise daily minutes, or drop low-weightage chapters.
                  </p>
                )}
                {preservedCount > 0 && (
                  <p className="muted-note">Your {preservedCount} completed / attempted record(s) are always preserved on regenerate.</p>
                )}
              </>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(0)}>
              <FiRotateCcw /> Adjust selection
            </button>
          </div>
        )}

        <div className="wizard-actions">
          <button className="btn btn-ghost btn-sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
            <FiArrowLeft /> Back
          </button>
          {step < 2 ? (
            <button className="btn btn-primary btn-sm" disabled={!stepValid()} onClick={() => setStep(step + 1)}>
              Continue <FiArrowRight />
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" disabled={!!preview.error} onClick={askGenerate}>
              <FiCalendar /> Generate my plan
            </button>
          )}
        </div>
      </Reveal>

      {confirmGenerate && (
        <Modal
          title="Replace upcoming plan tasks?"
          confirmLabel="Replace & generate"
          onClose={() => setConfirmGenerate(false)}
          onConfirm={doGenerate}
        >
          <p>
            This replaces <strong>{existingFuture.length} upcoming plan task(s)</strong> with the fresh schedule.
          </p>
          <p>
            Kept safe: {preservedCount} completed record(s), every test attempt, and all your custom tasks.
          </p>
        </Modal>
      )}
    </>
  );
}

export default ExamPlanWizard;
