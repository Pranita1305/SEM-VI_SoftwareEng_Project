import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Heatmap from "../components/Heatmap";
import StatCard from "../components/StatCard";
import SurgeCard from "../components/SurgeCard";
import DemandChart from "../components/DemandChart";
import { zonesAPI } from "../services/api";

/* ── Constants ─────────────────────────────────── */
const CITIES = [
  "Koramangala", "Indiranagar", "Whitefield", "Shiwala",
  "Jayanagar", "Hebbal", "MG Road", "Electronic City",
  "HSR Layout", "Marathahalli", "Yeshwanthpur", "Rajajinagar",
  "Bannerghatta Road", "JP Nagar", "Malleshwaram",
];

const HOURLY_DEMAND = [
  { time: "6am", demand: 45 },
  { time: "7am", demand: 88 },
  { time: "8am", demand: 162 },
  { time: "9am", demand: 210 },
  { time: "10am", demand: 140 },
  { time: "12pm", demand: 110 },
  { time: "2pm", demand: 95 },
  { time: "4pm", demand: 130 },
  { time: "5pm", demand: 195 },
  { time: "6pm", demand: 230 },
  { time: "7pm", demand: 185 },
  { time: "9pm", demand: 105 },
  { time: "11pm", demand: 60 },
];

const ZONES = [
  { id: 1, demand: 120, surge: 1.5, name: "Koramangala" },
  { id: 2, demand: 80, surge: 1.0, name: "Indiranagar" },
  { id: 3, demand: 200, surge: 2.2, name: "Shiwala" },
  { id: 4, demand: 160, surge: 1.8, name: "Jayanagar" },
];

/* ── Time context helper ───────────────────────── */
function getTimeContext() {
  const h = new Date().getHours();
  if (h >= 7 && h <= 10) return { label: "Morning Rush 🌅", color: "#fbbf24", note: "High demand expected — surge active" };
  if (h >= 11 && h <= 15) return { label: "Midday 🌤️", color: "#34d399", note: "Moderate demand, normal pricing" };
  if (h >= 16 && h <= 20) return { label: "Evening Rush 🌆", color: "#f97454", note: "Peak demand — surge pricing active" };
  if (h >= 21 || h <= 5) return { label: "Night 🌙", color: "#7c5cfc", note: "Low demand, fast pickups" };
  return { label: "Morning 🌄", color: "#4f9cf9", note: "Demand building up" };
}

/* ── localStorage for recent searches ─────────── */
const LS_KEY = "srdapo_recent_searches";
function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}
function saveSearch(entry) {
  const prev = getRecentSearches().filter(
    s => !(s.source === entry.source && s.destination === entry.destination)
  );
  localStorage.setItem(LS_KEY, JSON.stringify([entry, ...prev].slice(0, 4)));
}

/* ════════════════════════════════════════════════
   Sub-components
═══════════════════════════════════════════════ */

/* ── Section Header ───────────────────────────── */
function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text-1)" }}>{title}</h2>
        {sub && <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "var(--text-2)" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Quick Actions ────────────────────────────── */
function ZoneDropdown({ color }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const zones = [
    { id: 1, name: "Koramangala" },
    { id: 2, name: "Indiranagar" },
    { id: 3, name: "Shiwala" },
    { id: 4, name: "Jayanagar" },
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="glass animate-slide-up"
        style={{
          cursor: "pointer", padding: "1rem 0.5rem", width: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
          border: `1px solid ${color}25`, background: open ? `${color}18` : `${color}08`,
          borderRadius: 14, fontFamily: "inherit",
          transition: "transform 0.2s, background 0.2s, box-shadow 0.2s",
          transform: open ? "translateY(-3px)" : "translateY(0)",
          boxShadow: open ? `0 8px 24px ${color}22` : "none",
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.transform = "translateY(-3px)"; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.transform = "translateY(0)"; } }}
      >
        <span style={{ fontSize: "1.4rem", width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>🗺️</span>
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
          Zone Details <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* backdrop to close */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
            zIndex: 99, minWidth: 160,
            background: "rgba(10,17,38,0.97)", border: `1px solid ${color}40`,
            borderRadius: 12, overflow: "hidden",
            boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${color}20`,
            animation: "slideUp 0.18s ease both",
          }}>
            {zones.map(z => (
              <button key={z.id} onClick={() => { setOpen(false); navigate(`/zone/${z.id}`); }}
                style={{
                  width: "100%", padding: "0.65rem 1rem", background: "none",
                  border: "none", borderBottom: `1px solid rgba(52,211,153,0.08)`,
                  color: "var(--text-2)", fontFamily: "inherit", fontSize: "0.85rem",
                  fontWeight: 500, cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}14`; e.currentTarget.style.color = "var(--text-1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-2)"; }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                Zone {z.id} — {z.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function QuickActions() {
  const navigate = useNavigate();

  const staticActions = [
    { icon: "📈", label: "Predictions", to: "/predictions", color: "#4f9cf9" },
    { icon: "🤖", label: "AI Chatbot", to: "/chatbot", color: "#7c5cfc" },
    { icon: "🚖", label: "Book a Ride", scroll: true, color: "#fbbf24" },
  ];

  return (
    <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
      {staticActions.map(({ icon, label, to, scroll, color }) => (
        <button
          key={label}
          onClick={() => {
            if (scroll) document.getElementById("ride-search")?.scrollIntoView({ behavior: "smooth", block: "center" });
            else navigate(to);
          }}
          className="glass animate-slide-up"
          style={{ cursor: "pointer", padding: "1rem 0.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", border: `1px solid ${color}25`, background: `${color}08`, borderRadius: 14, fontFamily: "inherit", transition: "transform 0.2s, box-shadow 0.2s, background 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = `${color}18`; e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.background = `${color}08`; e.currentTarget.style.boxShadow = "none"; }}
        >
          <span style={{ fontSize: "1.4rem", width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)" }}>{label}</span>
        </button>
      ))}
      {/* Zone details with dropdown */}
      <ZoneDropdown color="#34d399" />
    </div>
  );
}

/* ── Recent Searches ──────────────────────────── */
function RecentSearches({ searches, onPick }) {
  if (!searches.length) return null;
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Recent
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {searches.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s)}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "rgba(79,156,249,0.06)",
              color: "var(--text-2)",
              fontSize: "0.78rem",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: "0.35rem",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,156,249,0.14)"; e.currentTarget.style.color = "var(--text-1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(79,156,249,0.06)"; e.currentTarget.style.color = "var(--text-2)"; }}
          >
            <span>🕐</span> {s.source} → {s.destination}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Ride Search Panel ────────────────────────── */
const selectStyle = {
  background: "rgba(6, 11, 28, 0.8)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "var(--text-1)",
  padding: "0.95rem 1.1rem",
  width: "100%",
  fontFamily: "inherit",
  fontSize: "1rem",
  outline: "none",
  cursor: "pointer",
  transition: "border-color 0.2s, box-shadow 0.2s",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238ca0c4' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 1.1rem center",
  paddingRight: "2.8rem",
};

function RideSearchPanel() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ source: "", destination: "", datetime: "" });
  const [recent, setRecent] = useState([]);

  useEffect(() => { setRecent(getRecentSearches()); }, []);

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }
  function handleSwap()    { setForm(f => ({ ...f, source: f.destination, destination: f.source })); }

  function handleSearch(e) {
    e.preventDefault();
    if (!form.source || !form.destination) return;
    saveSearch({ source: form.source, destination: form.destination });
    navigate(`/search-results?${new URLSearchParams(form).toString()}`);
  }

  function pickRecent(s) {
    setForm(f => ({ ...f, source: s.source, destination: s.destination }));
  }

  const FieldGroup = ({ label, color, dotShape, children }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: "1 1 200px", minWidth: 0 }}>
      <label style={{
        fontSize: "0.72rem", fontWeight: 800, color,
        letterSpacing: "0.1em", textTransform: "uppercase",
        display: "flex", alignItems: "center", gap: "0.4rem",
      }}>
        <span style={{ width: 7, height: 7, borderRadius: dotShape === "sq" ? "2px" : "50%", background: color, display: "inline-block", flexShrink: 0 }} />
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div
      id="ride-search"
      className="animate-slide-up"
      style={{
        marginBottom: "2rem",
        borderRadius: "22px",
        padding: "2px",
        background: "linear-gradient(120deg, #4f9cf9, #7c5cfc, #f97454, #7c5cfc, #4f9cf9)",
        backgroundSize: "300% 300%",
        animation: "shimmer 4s linear infinite",
        boxShadow: "0 16px 60px rgba(79,156,249,0.18), 0 0 0 0px transparent",
      }}
    >
    <div
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        position: "relative",
        background: "rgba(8, 14, 32, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Background orbs */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,92,252,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -50, left: 40,  width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,156,249,0.07) 0%,transparent 70%)",  pointerEvents: "none" }} />

      <div style={{ padding: "2rem 2.5rem 2.25rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: "linear-gradient(135deg,#4f9cf9,#7c5cfc)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.3rem",
              boxShadow: "0 6px 20px rgba(79,156,249,0.4)",
              flexShrink: 0,
            }}>🚖</div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Find a Ride</h2>
              <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.82rem", marginTop: "0.15rem" }}>
                Real-time fare estimates &amp; surge pricing across Bangalore
              </p>
            </div>
          </div>

          {/* Recent searches */}
          {recent.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Recent:</span>
              {recent.map((s, i) => (
                <button key={i} onClick={() => pickRecent(s)}
                  style={{
                    padding: "0.28rem 0.75rem", borderRadius: 999,
                    border: "1px solid rgba(79,156,249,0.2)",
                    background: "rgba(79,156,249,0.06)",
                    color: "var(--text-2)", fontSize: "0.75rem",
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "0.3rem",
                    transition: "background 0.15s, color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,156,249,0.15)"; e.currentTarget.style.color = "var(--text-1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(79,156,249,0.06)"; e.currentTarget.style.color = "var(--text-2)"; }}
                >
                  🕐 {s.source} → {s.destination}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSearch}>
          {/* Row 1: Pickup ⇄ Drop */}
          <div style={{
            display: "flex", alignItems: "flex-end", gap: "0.75rem",
            flexWrap: "wrap", marginBottom: "1rem",
          }}>
            <FieldGroup label="📍 Pickup Location" color="var(--accent-blue)">
              <select name="source" value={form.source} onChange={handleChange} required
                style={{ ...selectStyle, color: form.source ? "var(--text-1)" : "var(--text-2)", borderColor: "rgba(79,156,249,0.2)" }}
                onFocus={e => { e.target.style.borderColor = "var(--accent-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(79,156,249,0.18)"; }}
                onBlur={e  => { e.target.style.borderColor = "rgba(79,156,249,0.2)";  e.target.style.boxShadow = "none"; }}
              >
                <option value="" disabled>Choose pickup city…</option>
                {CITIES.map(c => <option key={c} value={c} style={{ background: "#0a1228" }}>{c}</option>)}
              </select>
            </FieldGroup>

            {/* Swap */}
            <div style={{ flexShrink: 0, paddingBottom: "0.05rem" }}>
              <button
                type="button" onClick={handleSwap} title="Swap locations"
                style={{
                  width: 44, height: 44, borderRadius: "50%",
                  border: "1px solid rgba(79,156,249,0.3)",
                  background: "rgba(79,156,249,0.08)",
                  color: "var(--accent-blue)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.1rem", transition: "background 0.2s, transform 0.3s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,156,249,0.2)"; e.currentTarget.style.transform = "rotate(180deg)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(79,156,249,0.08)"; e.currentTarget.style.transform = "rotate(0deg)"; }}
              >⇄</button>
            </div>

            <FieldGroup label="🏁 Drop Location" color="var(--accent-vio)" dotShape="sq">
              <select name="destination" value={form.destination} onChange={handleChange} required
                style={{ ...selectStyle, color: form.destination ? "var(--text-1)" : "var(--text-2)", borderColor: "rgba(124,92,252,0.2)" }}
                onFocus={e => { e.target.style.borderColor = "var(--accent-vio)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,92,252,0.18)"; }}
                onBlur={e  => { e.target.style.borderColor = "rgba(124,92,252,0.2)"; e.target.style.boxShadow = "none"; }}
              >
                <option value="" disabled>Choose drop city…</option>
                {CITIES.map(c => <option key={c} value={c} style={{ background: "#0a1228" }}>{c}</option>)}
              </select>
            </FieldGroup>
          </div>

          {/* Row 2: When + Search */}
          <div style={{
            display: "flex", alignItems: "flex-end", gap: "0.75rem",
            flexWrap: "wrap",
            padding: "1.1rem 1.4rem",
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <FieldGroup label="🕐 Date & Time" color="var(--yellow-mid)">
              <input
                className="input-dark"
                type="datetime-local"
                name="datetime"
                value={form.datetime}
                onChange={handleChange}
                style={{
                  colorScheme: "dark",
                  borderColor: "rgba(251,191,36,0.2)",
                  fontSize: "1rem",
                  padding: "0.95rem 1.1rem",
                }}
                onFocus={e => { e.target.style.borderColor = "var(--yellow-mid)"; e.target.style.boxShadow = "0 0 0 3px rgba(251,191,36,0.15)"; }}
                onBlur={e  => { e.target.style.borderColor = "rgba(251,191,36,0.2)"; e.target.style.boxShadow = "none"; }}
              />
            </FieldGroup>

            {/* Summary + Search */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: "0 0 auto" }}>
              {form.source && form.destination && (
                <div style={{ fontSize: "0.78rem", color: "var(--text-2)", textAlign: "right" }}>
                  <span style={{ color: "var(--accent-blue)", fontWeight: 600 }}>{form.source}</span>
                  {" → "}
                  <span style={{ color: "var(--accent-vio)", fontWeight: 600 }}>{form.destination}</span>
                </div>
              )}
              <button
                type="submit"
                style={{
                  padding: "0.95rem 2.5rem",
                  borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #4f9cf9, #7c5cfc)",
                  color: "#fff", fontFamily: "inherit",
                  fontSize: "1rem", fontWeight: 800,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  boxShadow: "0 6px 24px rgba(79,156,249,0.4)",
                  transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
                  whiteSpace: "nowrap", letterSpacing: "0.01em",
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(79,156,249,0.55)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1";   e.currentTarget.style.transform = "translateY(0)";   e.currentTarget.style.boxShadow = "0 6px 24px rgba(79,156,249,0.4)"; }}
              >
                Search Rides →
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}

/* ── Surge Leaderboard ────────────────────────── */
function SurgeLeaderboard({ zones }) {
  const navigate = useNavigate();
  const sorted = [...zones].sort((a, b) => b.surge - a.surge);
  const color = s => s >= 2 ? "var(--red-surge)" : s >= 1.4 ? "var(--yellow-mid)" : "var(--green-ok)";

  return (
    <div className="glass" style={{ padding: "1.25rem 1.5rem", height: "100%" }}>
      <SectionHeader title="🔥 Surge Leaderboard" sub="Ranked by multiplier" />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {sorted.map((z, i) => (
          <div
            key={z.id}
            onClick={() => navigate(`/zone/${z.id}`)}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.5rem 0.75rem", borderRadius: 10,
              cursor: "pointer", transition: "background 0.15s",
              background: i === 0 ? "rgba(249,116,84,0.06)" : "transparent",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(79,156,249,0.07)"}
            onMouseLeave={e => e.currentTarget.style.background = i === 0 ? "rgba(249,116,84,0.06)" : "transparent"}
          >
            <span style={{ width: 22, fontSize: "0.78rem", fontWeight: 700, color: "var(--text-2)", textAlign: "center" }}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{z.name}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-2)" }}>{z.demand} rides</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: color(z.surge) }}>{z.surge}x</span>
            </div>
            <div style={{ width: 60, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(z.surge / 2.5) * 100}%`, background: color(z.surge), borderRadius: 999, transition: "width 0.6s ease" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Main Dashboard
═══════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const timeCtx  = getTimeContext();

  const [zones, setZones]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    zonesAPI.list()
      .then((res) => setZones(res.data))
      .catch(() => setError("Could not load zone data. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  // Adapt backend shape { zone_id, zone_name, current_demand, surge_multiplier } → { id, name, demand, surge }
  const adaptedZones = zones.map((z) => ({
    id:     z.zone_id,
    name:   z.zone_name,
    demand: z.current_demand ?? 0,
    surge:  z.surge_multiplier ?? 1.0,
    trend:  z.trend ?? "normal",
  }));

  const totalDemand  = adaptedZones.reduce((s, z) => s + z.demand, 0);
  const avgSurge     = adaptedZones.length
    ? (adaptedZones.reduce((s, z) => s + z.surge, 0) / adaptedZones.length).toFixed(2)
    : "—";
  const hotspotZone  = adaptedZones.reduce((a, z) => (z.demand > (a?.demand ?? 0) ? z : a), null);

  // Build hourly-like chart from top zone forecast if available
  const topZone = zones.find((z) => z.zone_id === hotspotZone?.id);
  const hourlyData = topZone?.forecast?.length
    ? topZone.forecast.map((pt) => ({ time: `+${pt.hour_offset}h`, demand: pt.predicted_demand }))
    : HOURLY_DEMAND;

  return (
    <div style={{ padding: "1.75rem", maxWidth: 1400, margin: "0 auto" }}>

      {/* ── Page Header ───────────────────────────── */}
      <div className="animate-fade-in" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Live Dashboard</h1>
          <p style={{ margin: "0.2rem 0 0", color: "var(--text-2)", fontSize: "0.88rem" }}>Real-time ride demand across Bangalore</p>
        </div>
        {/* Time Context Pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.4rem 1rem", borderRadius: 999,
          border: `1px solid ${timeCtx.color}40`,
          background: `${timeCtx.color}12`,
          fontSize: "0.82rem", fontWeight: 600, color: timeCtx.color,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: timeCtx.color, display: "inline-block", animation: "pulseRing 1.6s ease-out infinite" }} />
          {timeCtx.label}
          <span style={{ fontWeight: 400, color: "var(--text-2)", marginLeft: 4 }}>— {timeCtx.note}</span>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.85rem 1.2rem", borderRadius: 12, background: "rgba(249,116,84,0.1)", border: "1px solid rgba(249,116,84,0.3)", color: "#f97454", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────── */}
      <QuickActions />

      {/* ── Stat Cards ────────────────────────────── */}
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard title="Active Zones"  value={loading ? "…" : adaptedZones.length}          icon="🗺️" color="var(--accent-blue)"  trend={{ up: true,  label: "All online" }} />
        <StatCard title="Total Demand"  value={loading ? "…" : totalDemand}                  icon="🚖" color="var(--accent-vio)"  trend={{ up: true,  label: "+live data" }} />
        <StatCard title="Avg Surge"     value={loading ? "…" : `${avgSurge}x`}               icon="⚡" color="var(--yellow-mid)" trend={{ up: false, label: "Moderate pressure" }} />
        <StatCard title="Hotspot"       value={loading ? "…" : (hotspotZone?.name ?? "—")}  icon="🔥" color="var(--red-surge)"  trend={{ up: true,  label: `${hotspotZone?.demand ?? 0} rides` }} />
      </div>

      {/* ── Ride Search ───────────────────────────── */}
      <RideSearchPanel />

      {/* ── Demand Chart + Leaderboard (side by side) */}
      <style>{`
        .chart-row { display: grid; grid-template-columns: 1fr 300px; gap: 1rem; margin-bottom: 2rem; align-items: start; }
        @media (max-width: 860px) { .chart-row { grid-template-columns: 1fr; } }
      `}</style>
      <div className="chart-row">
        <div className="glass" style={{ padding: "1.25rem 1.5rem" }}>
          <SectionHeader title="📊 Demand Trend" sub={topZone ? `Forecast for ${hotspotZone?.name}` : "Hourly ride requests"} />
          <DemandChart data={hourlyData} />
        </div>
        <SurgeLeaderboard zones={adaptedZones} />
      </div>


      {/* ── Zone Overview (4 zones) ───────────────── */}
      <div style={{ marginBottom: "2rem" }}>
        <SectionHeader
          title="Zone Overview"
          sub={loading ? "Loading…" : `${adaptedZones.length} active zones`}
          action={<span style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>Click a card for details</span>}
        />
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
          {adaptedZones.map((zone) => (
            <SurgeCard key={zone.id} zone={zone} onClick={() => navigate(`/zone/${zone.id}`)} />
          ))}
        </div>
      </div>

      {/* ── Heatmap ───────────────────────────────── */}
      <div>
        <SectionHeader title="Demand Heatmap" sub="Bangalore — live intensity" />
        <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
          <Heatmap />
        </div>
      </div>

    </div>
  );
}