import { useParams, Link } from "react-router-dom";
import DemandChart from "../components/DemandChart";
import StatCard from "../components/StatCard";

const ZONE_DATA = {
  1: { name: "Koramangala", demand: 120, surge: 1.5,  status: "High" },
  2: { name: "Indiranagar",     demand: 80,  surge: 1.0,  status: "Normal" },
  3: { name: "Sadashivanagar",  demand: 200, surge: 2.2,  status: "Critical" },
  4: { name: "Jayanagar",       demand: 160, surge: 1.8,  status: "High" },
  5: { name: "Hebbal",          demand: 45,  surge: 1.0,  status: "Normal" },
  6: { name: "Whitefield",      demand: 95,  surge: 1.3,  status: "Moderate" },
};

const HISTORY = [
  { time: "10AM", demand: 50 },
  { time: "11AM", demand: 80 },
  { time: "12PM", demand: 120 },
  { time: "1PM",  demand: 150 },
  { time: "2PM",  demand: 135 },
  { time: "3PM",  demand: 160 },
];

export default function ZoneDetails() {
  const { id } = useParams();
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
      {/* Breadcrumb */}
      <div className="animate-fade-in" style={{ marginBottom: "1.5rem" }}>
        <Link
          to="/"
          style={{
            color: "var(--text-2)",
            textDecoration: "none",
            fontSize: "0.875rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.color = "var(--accent-blue)"}
          onMouseLeave={(e) => e.target.style.color = "var(--text-2)"}
        >
          ← Dashboard
        </Link>
        <h1 style={{ margin: "0.4rem 0 0", fontSize: "1.6rem", fontWeight: 700 }}>
          Zone {id}{zone.name ? ` — ${zone.name}` : ""}
        </h1>
        <span
          style={{
            display: "inline-block",
            marginTop: "0.4rem",
            padding: "2px 12px",
            borderRadius: 999,
            fontSize: "0.78rem",
            fontWeight: 600,
            color: statusColor,
            background: `${statusColor}18`,
            border: `1px solid ${statusColor}40`,
          }}
        >
          {zone.status} Demand
        </span>
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