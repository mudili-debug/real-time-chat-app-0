// src/components/ChatBot.js
import React, { useState, useEffect, useRef } from "react";

const STORAGE_FAQ = "chatbot_faq_v2";
const STORAGE_MESSAGES = "chatbot_messages_v2";

// Expanded FAQ for more queries
const defaultFaq = {
  "forgot password": "Use the 'Forgot Password' link on the login page — you'll get an email with reset steps.",
  "invalid email or password": "Check your email/password. If you registered with a different email, use that or try reset password.",
  "login issue": "Ensure your credentials are correct. Try reset password if login fails.",
  "register issue": "Make sure your email isn't already registered. Password should be at least 8 characters.",
  "email already exists": "That email is already registered. Try logging in or use another email to register.",
  "password too short": "Password must be at least 8 characters long.",
  "messages not sending": "Check your internet connection and ensure the backend/socket server is running (e.g., http://localhost:5000).",
  "not receiving messages": "Refresh the page and verify the other user is online. Also confirm socket connection.",
  "logout not working": "Clear localStorage and refresh. If persists, check frontend logout code and backend session handling.",
  "socket disconnected": "Try reconnecting. Ensure backend socket server is running and accessible from your frontend origin.",
  "file upload issue": "Check file size and type. Ensure backend file upload endpoint is running.",
  "group creation issue": "Select a group name and at least one user. Make sure backend is running.",
  "private chat not starting": "Select a user from the list. Ensure backend is running.",
};

function safeLoadJson(key, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [faq, setFaq] = useState(() => safeLoadJson(STORAGE_FAQ, defaultFaq));
  const [messages, setMessages] = useState(() =>
    safeLoadJson(STORAGE_MESSAGES, [{ from: "bot", text: "Hi 👋 I'm Help Assistant. Ask about login/register/chat issues." }])
  );
  const [input, setInput] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [pendingSolution, setPendingSolution] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_FAQ, JSON.stringify(faq)); } catch {}
  }, [faq]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages)); } catch {}
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  // Improved fuzzy match
  const findAnswer = (text) => {
    const q = normalize(text);
    let bestMatch = null;
    let highestScore = 0;

    for (const key of Object.keys(faq)) {
      const k = normalize(key);
      let score = 0;
      q.split(/\s+/).forEach(word => {
        if (k.includes(word)) score += 1;
      });
      if (score > highestScore) {
        highestScore = score;
        bestMatch = key;
      }
    }

    return bestMatch ? faq[bestMatch] : null;
  };

  const pushMsg = (m) => setMessages((prev) => [...prev, m]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    pushMsg({ from: "user", text });
    setInput("");

    const answer = findAnswer(text);
    if (answer) {
      setTimeout(() => pushMsg({ from: "bot", text: answer }), 250);
      setPendingQuestion(null);
      setPendingSolution("");
    } else {
      setTimeout(() => pushMsg({ from: "bot", text: "I don't have an answer yet. You can add a solution below to save it for next time." }), 250);
      setPendingQuestion(normalize(text));
      setPendingSolution("");
    }
  };

  const handleSaveSolution = () => {
    if (!pendingQuestion || !pendingSolution.trim()) return;
    setFaq((prev) => ({ ...prev, [pendingQuestion]: pendingSolution.trim() }));
    pushMsg({ from: "bot", text: "✅ Solution saved — I'll answer this next time." });
    setPendingQuestion(null);
    setPendingSolution("");
  };

  const handleResetFaq = () => {
    if (!window.confirm("Reset FAQ to defaults?")) return;
    setFaq(defaultFaq);
    pushMsg({ from: "bot", text: "FAQ reset to defaults." });
  };

  // Styles (inline for simplicity)
  const styles = {
    fab: { position: "fixed", bottom: 20, right: 20, zIndex: 2000, width: 60, height: 60, borderRadius: "50%", border: "none", background: "#007bff", color: "#fff", fontSize: 22, cursor: "pointer", boxShadow: "0 6px 18px rgba(0,0,0,0.25)" },
    card: { position: "fixed", bottom: 90, right: 20, zIndex: 2000, width: 340, height: 460, display: "flex", flexDirection: "column", background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,0.25)" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#007bff", color: "#fff" },
    title: { fontWeight: 600, fontSize: 15 },
    body: { flex: 1, padding: 12, overflowY: "auto", background: "#f6f7f8", display: "flex", flexDirection: "column", gap: 8 },
    bubbleUser: { alignSelf: "flex-end", background: "#dcf8c6", padding: "8px 12px", borderRadius: 14, maxWidth: "78%" },
    bubbleBot: { alignSelf: "flex-start", background: "#fff", border: "1px solid #e6e6e6", padding: "8px 12px", borderRadius: 14, maxWidth: "78%" },
    footer: { display: "flex", gap: 8, padding: 10, borderTop: "1px solid #eee", background: "#fff" },
    input: { flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", outline: "none" },
    sendBtn: { background: "#007bff", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
    pendingBox: { padding: 8, borderTop: "1px solid #eee", background: "#fff", display: "flex", flexDirection: "column", gap: 8 },
    btnRow: { display: "flex", gap: 8, marginTop: 6 },
    smallBtn: { padding: "6px 10px", borderRadius: 6, border: "none", background: "#007bff", color: "#fff", cursor: "pointer" },
  };

  return (
    <div>
      {!open && <button aria-label="Open help" style={styles.fab} onClick={() => setOpen(true)}>💬</button>}
      {open && (
        <div style={styles.card} role="dialog" aria-label="Help assistant">
          <div style={styles.header}>
            <div style={styles.title}>Help Assistant 🤖</div>
            <div>
              <button onClick={handleResetFaq} style={{ marginRight: 8, background: "transparent", border: "none", color: "#fff", cursor: "pointer" }} title="Reset FAQ">♻</button>
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }} title="Close">✖</button>
            </div>
          </div>
          <div style={styles.body} aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} style={m.from === "user" ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }}>
                <div style={m.from === "user" ? styles.bubbleUser : styles.bubbleBot}>{m.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {pendingQuestion && (
            <div style={styles.pendingBox}>
              <div style={{ fontSize: 13 }}>Save solution for: <strong>{pendingQuestion}</strong></div>
              <input
                value={pendingSolution}
                onChange={(e) => setPendingSolution(e.target.value)}
                placeholder="Type solution to save"
                style={styles.input}
                onKeyDown={(e) => e.key === "Enter" && handleSaveSolution()}
              />
              <div style={styles.btnRow}>
                <button style={styles.smallBtn} onClick={handleSaveSolution}>Save</button>
                <button style={{ ...styles.smallBtn, background: "#6c757d" }} onClick={() => { setPendingQuestion(null); setPendingSolution(""); }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={styles.footer}>
            <input
              aria-label="Type your issue"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Describe your issue (e.g. 'forgot password')"
              style={styles.input}
            />
            <button style={styles.sendBtn} onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
