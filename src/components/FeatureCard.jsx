import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import "./FeatureCard.css";

// Reusable feature card. style={{--i}} staggers entrance from the parent.
function FeatureCard({ icon, title, description, to, accent, index = 0 }) {
  return (
    <Link to={to} className="card card-lift feature-card" style={{ "--i": index }}>
      <span className={`feature-icon ${accent}`} aria-hidden="true">
        {icon}
      </span>
      <span className="feature-text">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="feature-arrow" aria-hidden="true">
        <FiArrowRight />
      </span>
      <span className="feature-shine" aria-hidden="true" />
    </Link>
  );
}

export default FeatureCard;
