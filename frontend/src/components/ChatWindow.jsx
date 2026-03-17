import { useEffect, useRef } from "react";

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
            Ask me anything about demand & pricing
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
              maxWidth: "72%",
              padding: "0.65rem 1rem",
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
            {msg.user || msg.bot}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}