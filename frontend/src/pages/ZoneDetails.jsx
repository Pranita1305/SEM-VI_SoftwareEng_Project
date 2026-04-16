import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DemandChart from "../components/DemandChart";
import StatCard from "../components/StatCard";
import { zonesAPI } from "../services/api";

export default function ZoneDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [zone, setZone]     = useState(null);
  const [allZones, setAll]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([zonesAPI.getById(id), zonesAPI.list()])
      .then(([zRes, allRes]) => {
        setZone(zRes.data);
        setAll(allRes.data);
      })
      .catch(() => setError("Failed to load zone data. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-2)" }}>
      Loading zone {id}…
    </div>
  );

  if (error) return (
    <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ padding: "1rem 1.25rem", borderRadius: 12, background: "rgba(249,116,84,0.1)", border: "1px solid rgba(249,116,84,0.3)", color: "#f97454" }}>
        ⚠️ {error}
      </div>
    </div>
  );

  const statusColors = {
    normal:   "var(--green-ok)",
    moderate: "var(--yellow-mid)",
    high:     "var(--accent-blue)",
    critical: "var(--red-surge)",
  };
  const trend = zone.trend ?? "normal";
  const statusColor = statusColors[trend.toLowerCase()] ?? "var(--text-2)";

  // Build chart data from forecast array
  const chartData = (zone.forecast ?? []).map((pt) => ({
    time: `+${pt.hour_offset}h`,
    demand: pt.predicted_demand,
  }));

  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: "1.5rem" }}>
        <Link to="/dashboard"
          style={{ color: "var(--text-2)", textDecoration: "none", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", transition: "color 0.2s" }}
          onMouseEnter={(e) => e.target.style.color = "var(--accent-blue)"}
          onMouseLeave={(e) => e.target.style.color = "var(--text-2)"}>
          ← Dashboard
        </Link>

        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.85rem", marginTop: "0.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, flex: "0 0 auto" }}>
            {zone.zone_name} — Zone {zone.zone_id}
          </h1>

          {/* Zone switcher */}
          {allZones.length > 0 && (
            <select value={id} onChange={(e) => navigate(`/zone/${e.target.value}`)}
              style={{ background: "rgba(8,13,30,0.85)", border: "1px solid rgba(79,156,249,0.3)", borderRadius: 10, color: "var(--text-1)", padding: "0.45rem 2.2rem 0.45rem 0.9rem", fontFamily: "inherit", fontSize: "0.92rem", fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none" }}>
              {allZones.map((z) => (
                <option key={z.zone_id} value={z.zone_id} style={{ background: "#0a1228" }}>
                  Zone {z.zone_id} — {z.zone_name}
                </option>
              ))}
            </select>
          )}

          <span style={{ padding: "0.3rem 0.85rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600, color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}40` }}>
            {trend.charAt(0).toUpperCase() + trend.slice(1)} Demand
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard title="Current Demand"  value={zone.current_demand ?? "—"} icon="🚖" color="var(--accent-blue)" />
        <StatCard title="Surge Multiplier" value={zone.surge_multiplier != null ? `${zone.surge_multiplier}x` : "—"} icon="⚡" color={statusColor} />
        <StatCard title="Avg Daily Demand" value={zone.avg_demand != null ? Math.round(zone.avg_demand) : "—"} icon="📊" color="var(--accent-vio)" />
        <StatCard title="Cluster"          value={`#${zone.cluster_id ?? "—"}`} icon="📍" color="var(--green-ok)" />
      </div>

      {/* Demand Forecast Chart */}
      <div className="glass animate-slide-up" style={{ padding: "1.75rem" }}>
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 600 }}>
          Demand Forecast — Next {chartData.length} Hours
        </h2>
        {chartData.length > 0
          ? <DemandChart data={chartData} />
          : <p style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>No forecast data available.</p>
        }
      </div>
    </div>
  );
}