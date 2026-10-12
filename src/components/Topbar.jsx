import { useEffect, useRef, useState } from "react";
import { FiMenu, FiSearch, FiBell, FiZap } from "react-icons/fi";
import { student } from "../data/demoData";
import { useToast } from "./ui/useToast";
import "./Topbar.css";

function Topbar({ onMenuClick }) {
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  // The ⌘K hint is real: Cmd/Ctrl+K focuses search from anywhere.
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        // Listener callback — runs outside the render cycle.
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    // Honest feedback: global search needs real data, so say so.
    notify("Search is coming soon", "info", "It will cover subjects, colleges and careers once real data lands.");
    setQuery("");
  };

  const showNotifications = () => {
    notify("2 demo reminders", "info", "Mock test on Saturday · Chemistry revision due Wednesday.");
  };

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={onMenuClick} aria-label="Open navigation menu">
        <FiMenu />
      </button>

      <form className="search-box" onSubmit={submitSearch} role="search">
        <FiSearch className="search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search subjects, topics, colleges…"
          aria-label="Search (coming soon)"
        />
        <kbd>⌘K</kbd>
      </form>

      <div className="topbar-right">
        <span className="badge badge-yellow streak" title="Demo streak — real tracking arrives with accounts">
          <FiZap aria-hidden="true" /> {student.streakDays} day streak
        </span>
        <button className="icon-btn" aria-label="Show notifications" onClick={showNotifications}>
          <FiBell />
          <span className="dot" />
        </button>
        <div className="avatar" title={student.name} aria-label={student.name}>
          {student.firstName.charAt(0)}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
