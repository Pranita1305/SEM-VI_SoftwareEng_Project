import { useState } from "react";
import ChatWindow from "../components/ChatWindow";
import { chatbotAPI } from "../services/api";

const SUGGESTIONS = [
  "Which zones are in high demand?",
  "Is surge active in Koramangala?",
  "Predicted demand for Zone 3 in 2 hours?",
  "What's the current hotspot?",
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { bot: "Hi! I'm your SRDAPO assistant. Ask me about ride demand, surge pricing, or zone insights." },
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;

    setMessages((prev) => [...prev, { user: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await chatbotAPI.query(msg);
      const { answer, supporting_points = [], insights = [] } = res.data;

      // Build a rich bot reply
      let richAnswer = answer;
      if (supporting_points.length)
        richAnswer += "\n\n" + supporting_points.map((p) => `• ${p}`).join("\n");
      if (insights.length)
        richAnswer += "\n\n" + insights.map((c) => `${c.label}: ${c.value}`).join("  |  ");

      setMessages((prev) => [...prev, { bot: richAnswer }]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessages((prev) => [
        ...prev,
        { bot: detail || "⚠️ Could not reach the server. Please check if the backend is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", maxWidth: 780, margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>AI Chatbot</h1>
        <p style={{ margin: "0.2rem 0 0", color: "var(--text-2)", fontSize: "0.875rem" }}>
          Query demand forecasts, surge alerts &amp; zone insights
        </p>
      </div>

      {/* Chat Window */}
      <div className="glass animate-slide-up" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", marginBottom: "1rem" }}>
        <ChatWindow messages={messages} />
        {loading && (
          <div style={{ padding: "0 1.25rem 0.5rem", display: "flex", gap: "4px", alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-blue)", animation: `spin 1s ease-in-out ${i * 0.2}s infinite`, opacity: 0.7 }} />
            ))}
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => sendMessage(s)}
            style={{ background: "rgba(79,156,249,0.1)", border: "1px solid rgba(79,156,249,0.25)", borderRadius: 999, color: "var(--accent-blue)", fontSize: "0.78rem", fontFamily: "Inter, sans-serif", fontWeight: 500, padding: "4px 12px", cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(79,156,249,0.2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(79,156,249,0.1)"}>
            {s}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input id="chatbot-input" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown} className="input-dark"
          placeholder="Ask about demand, pricing, or zones…" style={{ flex: 1 }} />
        <button id="chatbot-send" onClick={() => sendMessage()} className="btn-grad"
          style={{ padding: "0 1.5rem", flexShrink: 0, fontSize: "0.95rem" }}>
          Send
        </button>
      </div>
    </div>
  );
}