import { useEffect, useMemo, useState } from "react";
import { FiMapPin, FiBookmark, FiSearch, FiStar, FiX } from "react-icons/fi";
import Reveal from "../components/ui/Reveal";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { SkeletonCard } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/useToast";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { colleges } from "../data/demoData";
import "./CollegeFinder.css";

const courseFilters = ["All", "CSE", "IT"];
const tagFilters = ["All", "Dream", "Reach", "Safe"];

// Guided explorer over a small static sample catalogue.
// Filters + shortlist are fully local; data honesty note included.
function CollegeFinder() {
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("All");
  const [tag, setTag] = useState("All");
  const [shortlisted, setShortlisted] = useLocalStorage("sg-shortlisted", []);
  const [details, setDetails] = useState(null);
  // Skeleton shows on first paint, then re-triggers from the filter
  // handlers below (not from an effect) to demo the loading pattern.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timer callback — runs outside the render cycle.
    const timer = setTimeout(() => setLoading(false), 420);
    return () => clearTimeout(timer);
  }, [loading]);

  // Typing in search filters instantly (no skeleton flash); only the
  // course/level tabs show a brief skeleton before fresh results.
  const updateQuery = (value) => setQuery(value);
  const updateFilter = (setter) => (value) => {
    setter(value);
    setLoading(true);
  };
  const updateCourse = updateFilter(setCourse);
  const updateTag = updateFilter(setTag);

  const results = useMemo(
    () =>
      colleges.filter((c) => {
        if (course !== "All" && c.course !== course) return false;
        if (tag !== "All" && c.tag !== tag) return false;
        if (query.trim() && !`${c.name} ${c.city}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [query, course, tag]
  );

  const toggleShortlist = (college) => {
    if (shortlisted.includes(college.id)) {
      setShortlisted(shortlisted.filter((id) => id !== college.id));
      notify("Removed from shortlist", "info", college.name);
    } else {
      setShortlisted([...shortlisted, college.id]);
      notify("Shortlisted!", "success", college.name);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>College Finder</h1>
        <p>Guided demo explorer across {colleges.length} sample colleges — live data + counselling arrive later.</p>
      </div>

      <Reveal className="card finder-filters">
        <label className="finder-search">
          <FiSearch aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="Search by college or city…"
            aria-label="Search colleges"
          />
          {query && (
            <button className="clear-btn" onClick={() => updateQuery("")} aria-label="Clear search">
              <FiX />
            </button>
          )}
        </label>
        <div className="chip-lines">
          <div className="chip-line" role="group" aria-label="Filter by course">
            {courseFilters.map((c) => (
              <button key={c} className={`chip sm ${course === c ? "selected" : ""}`} onClick={() => updateCourse(c)}>
                {c === "All" ? "All courses" : c}
              </button>
            ))}
          </div>
          <div className="chip-line" role="group" aria-label="Filter by ambition">
            {tagFilters.map((t) => (
              <button key={t} className={`chip sm ${tag === t ? "selected" : ""}`} onClick={() => updateTag(t)}>
                {t === "All" ? "Any level" : t}
              </button>
            ))}
          </div>
        </div>
        {shortlisted.length > 0 && (
          <p className="shortlist-note">
            <FiBookmark /> {shortlisted.length} shortlisted — stored on this device
          </p>
        )}
      </Reveal>

      {loading ? (
        <div className="college-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<FiMapPin />}
          title="No colleges match those filters"
          hint="Loosen a filter or two — the demo catalogue is intentionally small."
          action={
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                updateQuery("");
                updateCourse("All");
                updateTag("All");
              }}
            >
              Clear all filters
            </button>
          }
        />
      ) : (
        <div className="college-grid stagger">
          {results.map((c, i) => {
            const saved = shortlisted.includes(c.id);
            return (
              <article key={c.id} className="card card-lift college-card" style={{ "--i": i }}>
                <div className="college-top">
                  <span className={`badge ${c.tag === "Dream" ? "badge-violet" : c.tag === "Reach" ? "badge-yellow" : "badge-green"}`}>
                    {c.tag}
                  </span>
                  <button
                    className={`fav-btn ${saved ? "active" : ""}`}
                    onClick={() => toggleShortlist(c)}
                    aria-pressed={saved}
                    aria-label={saved ? `Remove ${c.name} from shortlist` : `Shortlist ${c.name}`}
                  >
                    <FiBookmark />
                  </button>
                </div>
                <h3>{c.name}</h3>
                <p className="college-meta">
                  <FiMapPin /> {c.city} · {c.course}
                </p>
                <div className="college-facts">
                  <span>{c.fees}</span>
                  <span>{c.cutoff}</span>
                </div>
                <div className="college-foot">
                  <span className="rating">
                    <FiStar /> {c.rating.toFixed(1)}
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => setDetails(c)}>
                    View details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {details && (
        <Modal title={details.name} confirmLabel="Shortlist" onClose={() => setDetails(null)} onConfirm={() => {
          if (!shortlisted.includes(details.id)) {
            setShortlisted([...shortlisted, details.id]);
            notify("Shortlisted!", "success", details.name);
          }
          setDetails(null);
        }}>
          <p>{details.city} · {details.course} · Rated {details.rating.toFixed(1)} / 5 in this demo.</p>
          <p>Fees {details.fees} · Typical cutoff {details.cutoff}.</p>
          <p className="muted">Sample figures for exploration only — verify on official college sites.</p>
        </Modal>
      )}
    </>
  );
}

export default CollegeFinder;
