import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  estimateRealisticDistance, getFareBreakdown, getDriverForRoute,
  getWeather, getTraffic, getTollEstimate, RIDE_VEHICLES,
} from "../data/realisticData";

/* ─── Ride Type Data ────────────────────────────── */
const RIDE_OPTIONS = [
  { type: "UberGo",       icon: "🚖", capacity: "4 seats", description: "Affordable everyday rides",  color: "#4f9cf9", tag: "Most Popular" },
  { type: "Uber Premier", icon: "🚘", capacity: "4 seats", description: "Comfortable premium sedans", color: "#7c5cfc", tag: null },
  { type: "Uber XL",      icon: "🚐", capacity: "6 seats", description: "For larger groups",          color: "#fbbf24", tag: null },
  { type: "Uber Auto",    icon: "🛺", capacity: "3 seats", description: "Budget-friendly autos",      color: "#34d399", tag: "Cheapest" },
];

/* ─── Helpers ───────────────────────────────────── */
function getSurge(dt) {
  if (!dt) { const h = new Date().getHours(); return ((h>=8&&h<=10)||(h>=17&&h<=20)) ? 1.8 : (h>=22||h<=5) ? 1.4 : 1.0; }
  const h = new Date(dt).getHours();
  if ((h >= 8 && h <= 10) || (h >= 17 && h <= 20)) return 1.8;
  if (h >= 22 || h <= 5) return 1.4;
  return 1.0;
}
function formatDateTime(dt) {
  if (!dt) return "Now";
  return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
function surgeColor(v) {
  return v >= 1.8 ? "#f97454" : v >= 1.3 ? "#fbbf24" : "#34d399";
}
function surgeLabel(v) {
  return v >= 1.8 ? "High Surge" : v >= 1.3 ? "Moderate" : "Normal";
}

/* ─── Sub-components ────────────────────────────── */
function MetaPill({ icon, label, value, accent }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
      padding: "0.8rem 1.2rem", borderRadius: 14,
      background: `${accent}10`, border: `1px solid ${accent}30`,
      minWidth: 90, flex: "1 1 80px",
    }}>
      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: accent, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-1)" }}>{value}</span>
    </div>
  );
}

/* ── Driver Info Card ────────────────────────────── */
function DriverCard({ driver, vehicle, plate }) {
  return (
    <div className="glass animate-slide-up" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent-blue)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        🚗 Assigned Driver
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg, #4f9cf9, #7c5cfc)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.8rem", flexShrink: 0,
          boxShadow: "0 4px 16px rgba(79,156,249,0.3)",
        }}>{driver.photo}</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{driver.name}</div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            <span style={{ fontSize: "0.78rem", color: "#fbbf24", fontWeight: 600 }}>★ {driver.rating}</span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{driver.trips.toLocaleString()} trips</span>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{vehicle}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-2)", marginTop: "0.15rem", fontFamily: "monospace" }}>{plate}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Fare Breakdown Card ─────────────────────────── */
function FareBreakdownCard({ breakdown, rideType }) {
  const items = [
    { label: "Base fare", value: `₹${breakdown.baseFare}`, color: "var(--text-1)" },
    { label: `Distance charge (per km)`, value: `₹${breakdown.distFare}`, color: "var(--text-1)" },
    { label: "Surge premium", value: breakdown.surgeAmt > 0 ? `+₹${breakdown.surgeAmt}` : "₹0", color: breakdown.surgeAmt > 0 ? "#f97454" : "var(--green-ok)" },
    { label: "GST (5%)", value: `₹${breakdown.gst}`, color: "var(--text-2)" },
    { label: "Platform fee", value: `₹${breakdown.platformFee}`, color: "var(--text-2)" },
  ];

  return (
    <div className="glass animate-slide-up" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent-vio)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        💰 Fare Breakdown — {rideType}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        {items.map(item => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-2)" }}>{item.label}</span>
            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: item.color }}>{item.value}</span>
          </div>
        ))}
        <div style={{ height: 1, background: "var(--border)", margin: "0.3rem 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>Total</span>
          <span style={{ fontSize: "1.2rem", fontWeight: 800 }} className="grad-text">₹{breakdown.total}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Weather & Traffic Card ──────────────────────── */
function ConditionsCard({ weather, traffic, toll }) {
  return (
    <div className="glass animate-slide-up" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#34d399", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        🌤️ Conditions & Route Info
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        {/* Weather */}
        <div style={{ padding: "0.75rem", borderRadius: 12, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem" }}>{weather.icon}</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: "0.2rem" }}>{weather.label}</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-blue)" }}>{weather.temp}</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-2)", marginTop: "0.15rem" }}>{weather.impact}</div>
        </div>

        {/* Traffic */}
        <div style={{ padding: "0.75rem", borderRadius: 12, background: `${traffic.color}08`, border: `1px solid ${traffic.color}20`, textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem" }}>🚦</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: "0.2rem", color: traffic.color }}>{traffic.level}</div>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)" }}>+{Math.round((traffic.etaMultiplier - 1) * 100)}% ETA</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-2)", marginTop: "0.15rem" }}>{traffic.desc}</div>
        </div>

        {/* Toll */}
        <div style={{ padding: "0.75rem", borderRadius: 12, background: "rgba(124,92,252,0.06)", border: "1px solid rgba(124,92,252,0.15)", textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem" }}>🛣️</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: "0.2rem" }}>Toll</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: toll > 0 ? "#fbbf24" : "var(--green-ok)" }}>
            {toll > 0 ? `₹${toll}` : "Free"}
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-2)", marginTop: "0.15rem" }}>
            {toll > 0 ? "Toll charges apply" : "No tolls on route"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Payment Method Selector ─────────────────────── */
function PaymentSelector({ selected, onSelect }) {
  const methods = [
    { key: "upi", label: "UPI", icon: "📱", desc: "Google Pay / PhonePe" },
    { key: "card", label: "Card", icon: "💳", desc: "Credit / Debit" },
    { key: "cash", label: "Cash", icon: "💵", desc: "Pay in cash" },
  ];

  return (
    <div className="glass animate-slide-up" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fbbf24", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        💳 Payment Method
      </div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        {methods.map(m => (
          <button key={m.key} onClick={() => onSelect(m.key)}
            style={{
              flex: 1, padding: "0.75rem 0.5rem", borderRadius: 12,
              border: `1px solid ${selected === m.key ? "#4f9cf9" : "rgba(255,255,255,0.08)"}`,
              background: selected === m.key ? "rgba(79,156,249,0.1)" : "rgba(255,255,255,0.02)",
              cursor: "pointer", fontFamily: "inherit", textAlign: "center",
              transition: "all 0.2s",
              boxShadow: selected === m.key ? "0 0 0 2px rgba(79,156,249,0.3)" : "none",
            }}
          >
            <div style={{ fontSize: "1.3rem" }}>{m.icon}</div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, marginTop: "0.2rem", color: selected === m.key ? "var(--accent-blue)" : "var(--text-1)" }}>{m.label}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-2)", marginTop: "0.1rem" }}>{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Savings Comparison ──────────────────────────── */
function SavingsRow({ rideOptions, distance, surge, selectedType }) {
  if (!selectedType) return null;
  const cheapest = rideOptions.reduce((min, opt) => {
    const fb = getFareBreakdown(opt.type, distance, surge);
    return fb.total < min.total ? { type: opt.type, total: fb.total, icon: opt.icon } : min;
  }, { total: Infinity });

  const selectedFare = getFareBreakdown(selectedType, distance, surge);
  const savings = selectedFare.total - cheapest.total;

  if (savings <= 0 || selectedType === cheapest.type) return null;

  return (
    <div className="animate-fade-in" style={{
      padding: "0.7rem 1.1rem", borderRadius: 12, marginBottom: "1.25rem",
      background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)",
      display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.82rem",
    }}>
      <span style={{ fontSize: "1.1rem" }}>💡</span>
      <span style={{ color: "var(--text-2)" }}>
        Save <span style={{ color: "#34d399", fontWeight: 700 }}>₹{savings}</span> by choosing{" "}
        <span style={{ fontWeight: 600, color: "var(--text-1)" }}>{cheapest.icon} {cheapest.type}</span>
      </span>
    </div>
  );
}

/* ── Ride Card ───────────────────────────────────── */
function RideCard({ opt, distance, surge, eta, isSelected, onClick }) {
  const breakdown = getFareBreakdown(opt.type, distance, surge);
  const sc = surgeColor(surge);

  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderRadius: 16, overflow: "hidden",
        border: `1px solid ${isSelected ? opt.color : "rgba(255,255,255,0.07)"}`,
        background: isSelected
          ? `linear-gradient(135deg, ${opt.color}14, ${opt.color}06)`
          : "rgba(12,20,44,0.7)",
        backdropFilter: "blur(10px)",
        boxShadow: isSelected ? `0 0 0 2px ${opt.color}50, 0 8px 32px ${opt.color}22` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s, transform 0.15s",
        transform: isSelected ? "scale(1.01)" : "scale(1)",
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.border = `1px solid ${opt.color}50`; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; }}
    >
      <div style={{ height: 3, background: isSelected ? opt.color : "transparent", transition: "background 0.2s" }} />

      <div style={{ padding: "1rem 1.25rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, flexShrink: 0,
          background: `${opt.color}18`, border: `1px solid ${opt.color}40`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem",
          boxShadow: isSelected ? `0 4px 16px ${opt.color}30` : "none",
          transition: "box-shadow 0.2s",
        }}>
          {opt.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "1rem", whiteSpace: "nowrap" }}>{opt.type}</span>
            {opt.tag && (
              <span style={{
                padding: "0.15rem 0.5rem", borderRadius: 999,
                background: `${opt.color}22`, border: `1px solid ${opt.color}50`,
                fontSize: "0.65rem", fontWeight: 700, color: opt.color, letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}>{opt.tag}</span>
            )}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {opt.description} · {opt.capacity}
          </div>
          <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "var(--text-2)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span>⏱ ~{eta} min</span>
            <span style={{ color: sc }}>⚡ {surge}x</span>
            <span>📏 {distance} km</span>
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "1.3rem", color: opt.color, letterSpacing: "-0.02em" }}>₹{breakdown.total}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-2)", marginTop: 2 }}>/trip</div>
          {isSelected
            ? <div style={{ marginTop: "0.4rem", width: 24, height: 24, borderRadius: "50%", background: opt.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "#fff", fontWeight: 800, marginLeft: "auto" }}>✓</div>
            : <div style={{ marginTop: "0.4rem", fontSize: "0.72rem", color: `${opt.color}90` }}>Tap to select</div>
          }
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────── */
export default function SearchResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const source      = params.get("source") || "";
  const destination = params.get("destination") || "";
  const datetime    = params.get("datetime") || "";

  const hour     = datetime ? new Date(datetime).getHours() : new Date().getHours();
  const surge    = getSurge(datetime);
  const distance = estimateRealisticDistance(source, destination);
  const traffic  = getTraffic(hour);
  const eta      = Math.round(distance * 2.5 * traffic.etaMultiplier);
  const weather  = getWeather(hour);
  const toll     = getTollEstimate(distance);
  const sc       = surgeColor(surge);

  const [selected, setSelected] = useState(null);
  const [payMethod, setPayMethod] = useState("upi");
  const selectedOpt = RIDE_OPTIONS.find(o => o.type === selected);
  const selectedBreakdown = selectedOpt ? getFareBreakdown(selectedOpt.type, distance, surge) : null;
  const driver = selected ? getDriverForRoute(source, destination, selected) : null;
  const vehicleList = selected ? (RIDE_VEHICLES[selected] || []) : [];
  const assignedVehicle = vehicleList.length > 0 ? vehicleList[(source.length + destination.length) % vehicleList.length] : driver?.vehicle;

  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1.5rem", maxWidth: 860, margin: "0 auto" }}>

      {/* ── Hero Header ─────────────────────────── */}
      <div className="animate-fade-in" style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", padding: "0.3rem 0.6rem", borderRadius: 8, marginBottom: "1.25rem", transition: "background 0.15s, color 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-2)"; }}
        >← Back to Dashboard</button>

        {/* Route display */}
        <div style={{
          padding: "1.5rem 2rem", borderRadius: 18,
          background: "linear-gradient(135deg, rgba(79,156,249,0.08) 0%, rgba(124,92,252,0.08) 100%)",
          border: "1px solid rgba(79,156,249,0.2)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", position: "relative" }}>
            <div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent-blue)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.2rem" }}>From</div>
              <div style={{ fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.02em" }}>{source || "—"}</div>
            </div>

            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 60 }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--accent-blue), var(--accent-vio))", opacity: 0.4 }} />
              <div style={{ padding: "0.3rem 0.7rem", borderRadius: 999, background: "rgba(79,156,249,0.12)", border: "1px solid rgba(79,156,249,0.3)", fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-blue)", whiteSpace: "nowrap" }}>
                {distance} km
              </div>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--accent-vio), var(--accent-blue))", opacity: 0.4 }} />
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent-vio)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.2rem" }}>To</div>
              <div style={{ fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.02em" }}>{destination || "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trip Meta Pills ──────────────────────── */}
      <div className="animate-slide-up" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        <MetaPill icon="🕐" label="When"     value={formatDateTime(datetime)} accent="#7c5cfc" />
        <MetaPill icon="⏱" label="ETA"      value={`~${eta} min`}           accent="#4f9cf9" />
        <MetaPill icon="📏" label="Distance" value={`${distance} km`}        accent="#34d399" />
        <MetaPill icon="⚡" label="Surge"    value={`${surge}x`}             accent={sc} />
        <MetaPill icon={weather.icon} label="Weather" value={weather.temp}    accent="#34d399" />
      </div>

      {/* ── Conditions Card ──────────────────────── */}
      <ConditionsCard weather={weather} traffic={traffic} toll={toll} />

      {/* ── Surge Alert ──────────────────────────── */}
      {surge >= 1.5 && (
        <div className="animate-fade-in" style={{
          marginBottom: "1.5rem", padding: "0.9rem 1.25rem", borderRadius: 12,
          background: "rgba(249,116,84,0.08)", border: "1px solid rgba(249,116,84,0.25)",
          display: "flex", alignItems: "flex-start", gap: "0.75rem",
        }}>
          <span style={{ fontSize: "1.2rem", marginTop: 1 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: "#f97454", fontSize: "0.88rem", marginBottom: "0.15rem" }}>Surge Pricing Active — {surge}x</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-2)" }}>High demand in your area. Fares include the surge multiplier. Prices drop after rush hour.</div>
          </div>
        </div>
      )}

      {/* ── Ride Options ─────────────────────────── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Choose a Ride</h2>
          <span style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>Tap to select</span>
        </div>
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {RIDE_OPTIONS.map(opt => (
            <RideCard
              key={opt.type} opt={opt}
              distance={distance} surge={surge} eta={eta}
              isSelected={selected === opt.type}
              onClick={() => setSelected(opt.type)}
            />
          ))}
        </div>
      </div>

      {/* ── Savings Comparison ───────────────────── */}
      <SavingsRow rideOptions={RIDE_OPTIONS} distance={distance} surge={surge} selectedType={selected} />

      {/* ── Fare Breakdown (when selected) ────────── */}
      {selectedBreakdown && (
        <FareBreakdownCard breakdown={selectedBreakdown} rideType={selected} />
      )}

      {/* ── Driver Card (when selected) ──────────── */}
      {driver && (
        <DriverCard driver={driver} vehicle={assignedVehicle} plate={driver.plate} />
      )}

      {/* ── Payment Method ───────────────────────── */}
      {selected && (
        <PaymentSelector selected={payMethod} onSelect={setPayMethod} />
      )}

      {/* ── Booking CTA ──────────────────────────── */}
      {selectedOpt && (
        <div className="animate-slide-up" style={{
          position: "sticky", bottom: "1.5rem",
          borderRadius: 18,
          background: "rgba(8,13,26,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${selectedOpt.color}40`,
          boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${selectedOpt.color}20`,
          padding: "1.1rem 1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${selectedOpt.color}20`, border: `1px solid ${selectedOpt.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
              {selectedOpt.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{selectedOpt.type}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>
                ₹{selectedBreakdown.total} &nbsp;·&nbsp; ~{eta} min &nbsp;·&nbsp; {payMethod.toUpperCase()}
              </div>
            </div>
          </div>
          <button
            onClick={() => alert(`Booking confirmed for ${selectedOpt.type}! 🎉\nDriver: ${driver?.name}\nFare: ₹${selectedBreakdown.total}\nPayment: ${payMethod.toUpperCase()}`)}
            style={{
              padding: "0.75rem 2.25rem", borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${selectedOpt.color}, ${selectedOpt.color}bb)`,
              color: "#fff", fontFamily: "inherit", fontSize: "0.95rem", fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
              boxShadow: `0 4px 20px ${selectedOpt.color}44`,
              transition: "opacity 0.2s, transform 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Confirm Booking ●
          </button>
        </div>
      )}
    </div>
  );
}
