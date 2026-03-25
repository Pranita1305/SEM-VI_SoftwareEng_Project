import { useParams, Link, useNavigate } from "react-router-dom";
import DemandChart from "../components/DemandChart";
import StatCard from "../components/StatCard";

const ZONE_DATA = {
  1: { name: "Koramangala", demand: 120, surge: 1.5, status: "High"     },
  2: { name: "Indiranagar",  demand: 80,  surge: 1.0, status: "Normal"   },
  3: { name: "Shiwala",      demand: 200, surge: 2.2, status: "Critical" },
  4: { name: "Jayanagar",    demand: 160, surge: 1.8, status: "High"     },
};

const HISTORY = [
  { time: "10AM", demand: 50  },
  { time: "11AM", demand: 80  },
  { time: "12PM", demand: 120 },
  { time: "1PM",  demand: 150 },
  { time: "2PM",  demand: 135 },
  { time: "3PM",  demand: 160 },
];

export default function ZoneDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const zone = ZONE_DATA[id] ?? { name: `Zone ${id}`, demand: 150, surge: 2.0, status: "Unknown" };

  const statusColors = {
    Normal:   "var(--green-ok)",
    Moderate: "var(--yellow-mid)",
    High:     "var(--accent-blue)",
    Critical: "var(--red-surge)",
    Unknown:  "var(--text-2)",
  };
  const statusColor = statusColors[zone.status] ?? "var(--text-2)";

  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header row */}
      <div className="animate-fade-in" style={{ marginBottom: "1.5rem" }}>
        {/* Back link */}
        <Link
          to="/dashboard"
          style={{ color: "var(--text-2)", textDecoration: "none", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", transition: "color 0.2s" }}
          onMouseEnter={e => e.target.style.color = "var(--accent-blue)"}
          onMouseLeave={e => e.target.style.color = "var(--text-2)"}
        >
          ← Dashboard
        </Link>

        {/* Title + Zone picker */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.85rem", marginTop: "0.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, flex: "0 0 auto" }}>
            Zone Details
          </h1>

          {/* Dropdown */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <select
              value={id}
              onChange={e => navigate(`/zone/${e.target.value}`)}
              style={{
                background: "rgba(8,13,30,0.85)",
                border: "1px solid rgba(79,156,249,0.3)",
                borderRadius: 10,
                color: "var(--text-1)",
                padding: "0.45rem 2.2rem 0.45rem 0.9rem",
                fontFamily: "inherit",
                fontSize: "0.92rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234f9cf9' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.7rem center",
              }}
              onFocus={e => { e.target.style.borderColor = "var(--accent-blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(79,156,249,0.18)"; }}
              onBlur={e  => { e.target.style.borderColor = "rgba(79,156,249,0.3)"; e.target.style.boxShadow = "none"; }}
            >
              {Object.entries(ZONE_DATA).map(([zid, z]) => (
                <option key={zid} value={zid} style={{ background: "#0a1228" }}>
                  Zone {zid} — {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status badge */}
          <span style={{
            padding: "0.3rem 0.85rem", borderRadius: 999,
            fontSize: "0.78rem", fontWeight: 600,
            color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}40`,
          }}>
            {zone.status} Demand
          </span>
        </div>
      </div>


      {/* Stat Cards */}
      <div
        className="stagger"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          title="Current Demand"
          value={zone.demand}
          icon="🚖"
          color="var(--accent-blue)"
        />
        <StatCard
          title="Surge Multiplier"
          value={`${zone.surge}x`}
          icon="⚡"
          color={statusColor}
        />
        <StatCard
          title="Status"
          value={zone.status}
          icon="📍"
          color={statusColor}
        />
      </div>

      {/* Demand Trend Chart */}
      <div className="glass animate-slide-up" style={{ padding: "1.75rem" }}>
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 600 }}>
          Demand Trend — Today
        </h2>
        <DemandChart data={HISTORY} />
      </div>
    </div>
  );
}