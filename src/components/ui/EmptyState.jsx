import "./EmptyState.css";

// Friendly empty state: icon, title, hint + optional action button.
function EmptyState({ icon, title, hint, action }) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <strong>{title}</strong>
      <p>{hint}</p>
      {action}
    </div>
  );
}

export default EmptyState;
