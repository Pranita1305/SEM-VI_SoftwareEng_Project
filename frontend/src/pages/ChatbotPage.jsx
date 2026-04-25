import { useState, useRef } from "react";
import ChatWindow from "../components/ChatWindow";
import { chatbotAPI } from "../services/api";
import { getZoneSnapshot, getWeather, getTraffic } from "../data/realisticData";

/* ── Client-side fallback intent matcher ─────────── */
function offlineAnswer(message) {
  const normalized = message.toLowerCase().trim();
  const snapshot = getZoneSnapshot();
  const sorted = [...snapshot].sort((a, b) => b.demand - a.demand);
  const weather = getWeather();
  const traffic = getTraffic();

  // High demand query
  if (["high demand", "hotspot", "highest demand", "busy"].some(k => normalized.includes(k))) {
    const top3 = sorted.slice(0, 3);
    return {
      text: `Based on local simulation data, the current hotspot is **${top3[0].name}** with ${top3[0].demand} estimated rides.`,
      points: top3.map(z => `• ${z.name}: ${z.demand} rides, ${z.surge}x surge`),
      insights: [
        { label: "Hotspot", value: top3[0].name },
        { label: "Peak Demand", value: `${top3[0].demand}` },
        { label: "Source", value: "Local Sim" },
      ],
    };
  }

  // Surge query
  if (["surge", "pricing", "price", "expensive", "cheap"].some(k => normalized.includes(k))) {
    // Check for specific zone
    const zone = snapshot.find(z => normalized.includes(z.name.toLowerCase()));
    if (zone) {
      const active = zone.surge > 1.0;
      return {
        text: `Surge pricing is ${active ? "**active**" : "**not active**"} in ${zone.name}. Current multiplier: **${zone.surge}x** with ${zone.demand} estimated rides.`,
        points: [
          `• Demand status: ${zone.trend}`,
          `• Current demand: ${zone.demand} rides`,
          `• Weather: ${weather.label} (${weather.temp})`,
        ],
        insights: [
          { label: "Zone", value: zone.name },
          { label: "Surge", value: `${zone.surge}x` },
          { label: "Trend", value: zone.trend },
        ],
      };
    }
    const maxSurge = snapshot.reduce((a, z) => z.surge > a.surge ? z : a, snapshot[0]);
    return {
      text: `The strongest surge right now is in **${maxSurge.name}** at **${maxSurge.surge}x**. Ask about a specific zone for zone-wise details.`,
      points: sorted.slice(0, 3).map(z => `• ${z.name}: ${z.surge}x surge, ${z.demand} rides`),
      insights: [
        { label: "Highest Surge", value: `${maxSurge.name} — ${maxSurge.surge}x` },
        { label: "Traffic", value: traffic.level },
      ],
    };
  }

  // Forecast / demand / predict query
  if (["forecast", "predict", "demand", "next", "expect", "how many"].some(k => normalized.includes(k))) {
    const zone = snapshot.find(z => normalized.includes(z.name.toLowerCase())) || sorted[0];
    const h = new Date().getHours();
    const nextH = (h + 1) % 24;
    const estNext = Math.round(zone.demand * (0.9 + Math.random() * 0.2));
    return {
      text: `For **${zone.name}**, current estimated demand is **${zone.demand} rides**. In ~1 hour (${nextH}:00), we estimate **${estNext} rides**.`,
      points: [
        `• Current demand: ${zone.demand}`,
        `• Surge: ${zone.surge}x`,
        `• Trend: ${zone.trend}`,
        `• Weather impact: ${weather.impact}`,
      ],
      insights: [
        { label: "Zone", value: zone.name },
        { label: "Now", value: `${zone.demand}` },
        { label: "+1h Est.", value: `${estNext}` },
      ],
    };
  }

  // Weather query
  if (["weather", "rain", "sun", "temperature", "temp"].some(k => normalized.includes(k))) {
    return {
      text: `Current Bangalore weather: **${weather.label}** at **${weather.temp}**. ${weather.impact}.`,
      points: [
        `• Condition: ${weather.icon} ${weather.label}`,
        `• Temperature: ${weather.temp}`,
        `• Traffic impact: ${traffic.desc}`,
      ],
      insights: [
        { label: "Weather", value: `${weather.icon} ${weather.label}` },
        { label: "Traffic", value: traffic.level },
      ],
    };
  }

  // Default summary
  const avgSurge = (snapshot.reduce((s, z) => s + z.surge, 0) / snapshot.length).toFixed(2);
  return {
    text: `I can answer questions about demand, surge, and forecasts using local simulation data. The current hotspot is **${sorted[0].name}** and avg surge is **${avgSurge}x**.`,
    points: [
      "• Try: Which zones are in high demand?",
      "• Try: Is surge active in Koramangala?",
      "• Try: What's the predicted demand for Whitefield?",
      "• Try: What's the weather like?",
    ],
    insights: [
      { label: "Hotspot", value: sorted[0].name },
      { label: "Avg Surge", value: `${avgSurge}x` },
      { label: "Zones", value: `${snapshot.length}` },
    ],
  };
}

const SUGGESTIONS = [
  "Which zones are in high demand?",
  "Is surge active in Koramangala?",
  "Predicted demand for Whitefield?",
  "What's the current hotspot?",
  "What's the weather impact on rides?",
  "Show all zone surge levels",
];

/* ════════════════════════════════════════════════
   Main ChatbotPage
═══════════════════════════════════════════════ */
export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      bot: "Hi! I'm your SRDAPO assistant. Ask me about ride demand, surge pricing, zone insights, or weather conditions.",
      insights: [
        { label: "Status", value: "Ready" },
        { label: "Zones", value: "15 active" },
      ],
    },
  ]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [isOnline, setIsOnline]   = useState(true);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;

    setMessages((prev) => [...prev, { user: msg }]);
    setInput("");
    setLoading(true);

    // Always try the backend first
    let usedFallback = false;
    try {
      const res = await chatbotAPI.query(msg);
      const data = res.data;

      // If the backend has no data, force fallback to our local simulation
      if (data.intent === "no_data") {
        throw new Error("Backend has no prediction data");
      }

      setIsOnline(true);
      setMessages((prev) => [...prev, {
        bot: data.answer,
        points: (data.supporting_points || []).map(p => `• ${p}`),
        insights: data.insights || [],
      }]);
    } catch (err) {
      // Any error (network, 401, 500) → use local fallback
      usedFallback = true;
      setIsOnline(false);
      const fallback = offlineAnswer(msg);
      setMessages((prev) => [...prev, {
        bot: fallback.text,
        points: fallback.points,
        insights: fallback.insights,
        isOffline: true,
      }]);
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>AI Chatbot</h1>
            <p style={{ margin: "0.2rem 0 0", color: "var(--text-2)", fontSize: "0.875rem" }}>
              Query demand forecasts, surge alerts &amp; zone insights
            </p>
          </div>

          {/* Connection status */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.3rem 0.85rem", borderRadius: 999,
            background: isOnline ? "rgba(52,211,153,0.08)" : "rgba(249,116,84,0.08)",
            border: `1px solid ${isOnline ? "rgba(52,211,153,0.25)" : "rgba(249,116,84,0.25)"}`,
            fontSize: "0.72rem", fontWeight: 600,
            color: isOnline ? "#34d399" : "#f97454",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isOnline ? "#34d399" : "#f97454",
              display: "inline-block",
              animation: "pulseRing 1.6s ease-out infinite",
            }} />
            {isOnline ? "Connected to Backend" : "Offline — Local Data Mode"}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="glass animate-slide-up" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", marginBottom: "1rem" }}>
        <ChatWindow messages={messages} />
        {loading && (
          <div style={{ padding: "0 1.25rem 0.75rem", display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-2)", marginRight: "0.3rem" }}>Thinking</span>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "var(--accent-blue)",
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                opacity: 0.8,
              }} />
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
          placeholder="Ask about demand, pricing, zones, or weather…" style={{ flex: 1 }} />
        <button id="chatbot-send" onClick={() => sendMessage()} className="btn-grad"
          style={{ padding: "0 1.5rem", flexShrink: 0, fontSize: "0.95rem" }}>
          Send →
        </button>
      </div>

      {/* Bounce keyframe */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}