import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import "./Modal.css";

// Accessible confirmation dialog: Escape closes, overlay click cancels,
// focus moves to the primary action on open.
function Modal({ title, children, confirmLabel = "Confirm", onConfirm, onClose, danger = false }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <strong>{title}</strong>
          <button className="modal-x" onClick={onClose} aria-label="Close dialog">
            <FiX />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
