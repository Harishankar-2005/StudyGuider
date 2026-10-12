import { useMemo, useState } from "react";
import { FiCompass, FiArrowLeft, FiArrowRight, FiRotateCcw, FiHeart, FiCheck } from "react-icons/fi";
import Reveal from "../components/ui/Reveal";
import { useToast } from "../components/ui/useToast";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { careers } from "../data/demoData";
import "./CareerGuidance.css";

const interestOptions = ["building", "design", "helping", "numbers", "logic", "biology", "people", "creativity", "machines", "society", "computers", "business"];
const strengthOptions = ["Maths", "Physics", "Chemistry", "Biology", "Computers", "Art", "Writing", "Social Science", "Psychology"];

const steps = ["Interests", "Strengths", "Results"];

// Guided 3-step quiz. Matches are computed locally from the static
// demo catalogue — labelled as such, no AI claims.
function CareerGuidance() {
  const { notify } = useToast();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [favourites, setFavourites] = useLocalStorage("sg-fav-careers", []);

  const toggleIn = (list, setList, value, max) => {
    if (list.includes(value)) setList(list.filter((v) => v !== value));
    else if (list.length < max) setList([...list, value]);
    else notify(`Pick up to ${max}`, "info", "Deselect one to choose another.");
  };

  const results = useMemo(() => {
    if (step < 2) return [];
    return careers
      .map((c) => {
        const tagHits = c.tags.filter((t) => interests.includes(t)).length;
        const strHits = c.strengths.filter((s) => strengths.includes(s)).length;
        const score = tagHits * 22 + strHits * 24 + 18;
        return { ...c, match: Math.min(96, score) };
      })
      .sort((a, b) => b.match - a.match)
      .slice(0, 3);
  }, [step, interests, strengths]);

  const canNext = step === 0 ? interests.length > 0 : step === 1 ? strengths.length > 0 : true;

  const toggleFav = (id, title) => {
    if (favourites.includes(id)) {
      setFavourites(favourites.filter((f) => f !== id));
      notify("Removed from favourites", "info", title);
    } else {
      setFavourites([...favourites, id]);
      notify("Saved to favourites", "success", title);
    }
  };

  const restart = () => {
    setStep(0);
    setInterests([]);
    setStrengths([]);
  };

  return (
    <>
      <div className="page-head">
        <h1>Career Guidance</h1>
        <p>A guided 3-step demo quiz matched against a small sample catalogue — real counselling + AI arrive later.</p>
      </div>

      <Reveal className="card wizard">
        <ol className="stepper-bar" aria-label="Quiz progress">
          {steps.map((label, i) => (
            <li key={label} className={`wizard-step ${i < step ? "done" : ""} ${i === step ? "current" : ""}`}>
              <span className="step-dot">{i < step ? <FiCheck /> : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <div className="wizard-progress">
          <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        {step === 0 && (
          <div className="wizard-body" key="s0">
            <h2>What sounds fun to you?</h2>
            <p className="section-subtitle">Pick up to 4 — there are no wrong answers.</p>
            <div className="chip-grid">
              {interestOptions.map((opt) => (
                <button
                  key={opt}
                  className={`chip ${interests.includes(opt) ? "selected" : ""}`}
                  aria-pressed={interests.includes(opt)}
                  onClick={() => toggleIn(interests, setInterests, opt, 4)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="wizard-body" key="s1">
            <h2>Where do you shine?</h2>
            <p className="section-subtitle">Choose up to 2 strongest subjects.</p>
            <div className="chip-grid">
              {strengthOptions.map((opt) => (
                <button
                  key={opt}
                  className={`chip ${strengths.includes(opt) ? "selected" : ""}`}
                  aria-pressed={strengths.includes(opt)}
                  onClick={() => toggleIn(strengths, setStrengths, opt, 2)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-body results" key="s2">
            <h2>Your demo matches</h2>
            <p className="section-subtitle">Scored from your picks against {careers.length} sample careers.</p>
            <div className="result-grid stagger">
              {results.map((c, i) => (
                <article key={c.id} className="card card-lift result-card" style={{ "--i": i }}>
                  <div className="result-top">
                    <span className="badge badge-violet">{c.match}% match</span>
                    <button
                      className={`fav-btn ${favourites.includes(c.id) ? "active" : ""}`}
                      onClick={() => toggleFav(c.id, c.title)}
                      aria-pressed={favourites.includes(c.id)}
                      aria-label={favourites.includes(c.id) ? `Remove ${c.title} from favourites` : `Save ${c.title} to favourites`}
                    >
                      <FiHeart />
                    </button>
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                  <p className="match-hint">✨ {c.matchHint}</p>
                  <div className="skill-row">
                    {c.skills.map((s) => (
                      <span key={s} className="badge">{s}</span>
                    ))}
                  </div>
                  <small className="muted">{c.outlook}</small>
                </article>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={restart}>
              <FiRotateCcw /> Retake quiz
            </button>
          </div>
        )}

        {step < 2 && (
          <div className="wizard-actions">
            <button className="btn btn-ghost btn-sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <FiArrowLeft /> Back
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={!canNext}
              onClick={() => {
                if (!canNext) {
                  notify("Pick at least one option", "info", "Your choices drive the demo matches.");
                  return;
                }
                setStep(step + 1);
              }}
            >
              {step === 1 ? "See my matches" : "Continue"} <FiArrowRight />
            </button>
          </div>
        )}
      </Reveal>

      {favourites.length > 0 && (
        <p className="fav-note">
          <FiCompass /> {favourites.length} favourite{favourites.length > 1 ? "s" : ""} saved on this device.
        </p>
      )}
    </>
  );
}

export default CareerGuidance;
