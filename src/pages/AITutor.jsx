import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiSend, FiTrash2, FiCpu, FiUser, FiAlertTriangle } from "react-icons/fi";
import Reveal from "../components/ui/Reveal";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { useToast } from "../components/ui/useToast";
import { tutorSuggestions } from "../data/demoData";
import "./AITutor.css";

let messageId = 0;
const nextId = () => ++messageId;

// Honest tutor preview: full chat chrome (typing indicator, animated
// messages, empty/error states) but zero fake AI answers. Every assistant
// message clearly states the AI backend is not connected yet.
function AITutor() {
  const { notify } = useToast();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const bottomRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const pushOfflineReply = (question) => {
    setTyping(true);
    timer.current = setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          kind: "offline",
          text: `I can't properly answer “${question}” yet — the AI backend isn't connected in this demo, and I won't guess.`,
        },
      ]);
    }, 1100);
  };

  const send = (text) => {
    const question = (text ?? draft).trim();
    if (!question || typing) return;
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text: question }]);
    setDraft("");
    pushOfflineReply(question.length > 90 ? `${question.slice(0, 90)}…` : question);
  };

  const clearChat = () => {
    setMessages([]);
    setConfirmClear(false);
    notify("Chat cleared", "info", "Fresh session started.");
  };

  return (
    <>
      <div className="page-head split">
        <div>
          <h1>AI Tutor</h1>
          <p>Premium chat experience, honest demo behaviour — real tutoring models plug in later.</p>
        </div>
        <span className="badge badge-rose conn-badge">
          <span className="conn-dot" /> Offline · demo mode
        </span>
      </div>

      <Reveal className="card chat-shell">
        <div className="chat-head">
          <span className="tutor-avatar">
            <FiCpu />
          </span>
          <div>
            <strong>StudyGuider Tutor</strong>
            <small>Typing, loading + error states preview · no fake answers</small>
          </div>
          {messages.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmClear(true)}>
              <FiTrash2 /> Clear
            </button>
          )}
        </div>

        <div className="chat-body" role="log" aria-live="polite" aria-label="Tutor conversation">
          {messages.length === 0 && !typing && (
            <EmptyState
              icon={<FiCpu />}
              title="Ask anything — I'll be honest about limits"
              hint="Try a suggestion below. You'll get a clear offline notice instead of a made-up answer."
            />
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="msg-row me">
                <div className="bubble me-bubble">{m.text}</div>
                <span className="msg-avatar me-avatar">
                  <FiUser />
                </span>
              </div>
            ) : (
              <div key={m.id} className="msg-row tutor">
                <span className="msg-avatar tutor-avatar sm">
                  <FiCpu />
                </span>
                <div className="bubble tutor-bubble offline">
                  <p className="offline-title">
                    <FiAlertTriangle /> AI not connected yet
                  </p>
                  <p>{m.text}</p>
                  <div className="offline-links">
                    <Link to="/planner" className="btn btn-secondary btn-sm">Plan study time</Link>
                    <Link to="/career" className="btn btn-secondary btn-sm">Explore careers</Link>
                  </div>
                  <small>Coming later: step-by-step explanations · practice questions · quizzes</small>
                </div>
              </div>
            )
          )}

          {typing && (
            <div className="msg-row tutor">
              <span className="msg-avatar tutor-avatar sm">
                <FiCpu />
              </span>
              <div className="bubble tutor-bubble typing" aria-label="Tutor is preparing a response">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="suggestions">
          {tutorSuggestions.map((s) => (
            <button key={s} className="chip sm" onClick={() => send(s)} disabled={typing}>
              {s}
            </button>
          ))}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a question… (Enter to send)"
            aria-label="Type your question"
            maxLength={300}
          />
          <button type="submit" className="btn btn-primary send-btn" disabled={!draft.trim() || typing} aria-label="Send message">
            <FiSend />
          </button>
        </form>
      </Reveal>

      {confirmClear && (
        <Modal title="Clear this chat?" confirmLabel="Clear chat" onClose={() => setConfirmClear(false)} onConfirm={clearChat}>
          <p>All messages in this demo session will be removed.</p>
        </Modal>
      )}
    </>
  );
}

export default AITutor;
