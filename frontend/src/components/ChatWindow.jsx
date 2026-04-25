import { useEffect, useRef } from "react";

/* ── Parse bold markdown ─────────────────────── */
function renderText(text) {
  if (!text) return null;
  // Split by **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "var(--accent-blue)", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatWindow({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {messages.length === 0 && (
        <div style={{ textAlign: "center", margin: "auto", color: "var(--text-2)" }}>
          <span style={{ fontSize: "2.5rem" }}>🤖</span>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Ask me anything about demand &amp; pricing
          </p>
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className="animate-fade-in"
          style={{
            display: "flex",
            justifyContent: msg.user ? "flex-end" : "flex-start",
            alignItems: "flex-end",
            gap: "0.5rem",
          }}
        >
          {/* Bot Avatar */}
          {msg.bot && (
            <div
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "var(--accent-grad)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.85rem", flexShrink: 0,
              }}
            >
              🤖
            </div>
          )}

          {/* Bubble */}
          <div
            style={{
              maxWidth: "78%",
              padding: "0.75rem 1rem",
              borderRadius: msg.user ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.user
                ? "linear-gradient(135deg, #4f9cf9, #7c5cfc)"
                : "rgba(15,23,42,0.85)",
              border: msg.bot ? "1px solid var(--border)" : "none",
              fontSize: "0.9rem",
              lineHeight: 1.5,
              color: "#f0f4ff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {/* User message */}
            {msg.user && msg.user}

            {/* Bot message with rich formatting */}
            {msg.bot && (
              <div>
                {/* Main text */}
                <div style={{ marginBottom: msg.points?.length || msg.insights?.length ? "0.6rem" : 0 }}>
                  {renderText(msg.bot)}
                </div>

                {/* Bullet points */}
                {msg.points && msg.points.length > 0 && (
                  <div style={{
                    padding: "0.5rem 0.65rem",
                    borderRadius: 8,
                    background: "rgba(79,156,249,0.06)",
                    border: "1px solid rgba(79,156,249,0.12)",
                    marginBottom: msg.insights?.length ? "0.5rem" : 0,
                  }}>
                    {msg.points.map((p, j) => (
                      <div key={j} style={{
                        fontSize: "0.82rem",
                        color: "var(--text-2)",
                        padding: "0.15rem 0",
                        lineHeight: 1.5,
                      }}>
                        {renderText(p)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Insight cards */}
                {msg.insights && msg.insights.length > 0 && (
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {msg.insights.map((ins, j) => (
                      <div key={j} style={{
                        padding: "0.3rem 0.6rem",
                        borderRadius: 8,
                        background: "rgba(124,92,252,0.1)",
                        border: "1px solid rgba(124,92,252,0.2)",
                        fontSize: "0.72rem",
                        display: "flex", alignItems: "center", gap: "0.3rem",
                      }}>
                        <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{ins.label}:</span>
                        <span style={{ color: "var(--accent-blue)", fontWeight: 700 }}>{ins.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Offline badge */}
                {msg.isOffline && (
                  <div style={{
                    marginTop: "0.5rem",
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.2rem 0.5rem", borderRadius: 6,
                    background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
                    fontSize: "0.65rem", color: "#fbbf24", fontWeight: 600,
                  }}>
                    📡 Local simulation data
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}