import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiCompass,
  FiCalendar,
  FiMessageCircle,
  FiMapPin,
  FiBarChart2,
  FiUser,
  FiBookOpen,
  FiX,
  FiZap,
} from "react-icons/fi";
import { student } from "../data/demoData";
import "./Sidebar.css";

// Sidebar navigation. New page = one entry here + one route in App.jsx.
const navItems = [
  { to: "/", label: "Dashboard", icon: <FiHome />, end: true },
  { to: "/career", label: "Career Guidance", icon: <FiCompass /> },
  { to: "/planner", label: "Study Planner", icon: <FiCalendar /> },
  { to: "/tutor", label: "AI Tutor", icon: <FiMessageCircle />, badge: "Soon" },
  { to: "/colleges", label: "College Finder", icon: <FiMapPin /> },
  { to: "/progress", label: "Progress Tracker", icon: <FiBarChart2 /> },
  { to: "/profile", label: "Profile", icon: <FiUser /> },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Primary">
        <div className="sidebar-glow" aria-hidden="true" />

        <div className="sidebar-brand">
          <span className="brand-icon">
            <FiBookOpen />
          </span>
          <span className="brand-text">
            <strong>
              Study<span className="gradient-text">Guider</span>
            </strong>
            <small>Learn smarter</small>
          </span>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <FiX />
          </button>
        </div>

        <div className="streak-card">
          <span className="streak-flame">
            <FiZap />
          </span>
          <div>
            <strong>{student.streakDays}-day streak</strong>
            <small>Demo data · keeps you going</small>
          </div>
          <span className="streak-bar">
            <span style={{ width: `${Math.min(student.streakDays * 6, 100)}%` }} />
          </span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              style={{ "--i": i }}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="upgrade-card">
            <strong>Premium demo</strong>
            <p>Sample data only. Real AI + Firebase land in later milestones.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
