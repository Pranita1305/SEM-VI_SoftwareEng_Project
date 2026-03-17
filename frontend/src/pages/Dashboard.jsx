import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Heatmap from "../components/Heatmap";
import StatCard from "../components/StatCard";
import SurgeCard from "../components/SurgeCard";

export default function Dashboard() {
  const [zones, setZones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setZones([
      { id: 1, demand: 120, surge: 1.5, name: "Koramangala" },
      { id: 2, demand: 80,  surge: 1.0, name: "Indiranagar" },
      { id: 3, demand: 200, surge: 2.2, name: "Sadashivanagar" },
      { id: 4, demand: 160, surge: 1.8, name: "Jayanagar" },
      { id: 5, demand: 45,  surge: 1.0, name: "Hebbal" },
      { id: 6, demand: 95,  surge: 1.3, name: "Whitefield" },
    ]);
  }, []);

  const totalDemand = zones.reduce((s, z) => s + z.demand, 0);
  const avgSurge    = zones.length ? (zones.reduce((s, z) => s + z.surge, 0) / zones.length).toFixed(2) : "—";
  const hotspotZone = zones.reduce((a, z) => (z.demand > (a?.demand ?? 0) ? z : a), null);

  return (
    <div style={{ padding: "2rem", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>
          Live Dashboard
        </h1>
        <p style={{ margin: "0.25rem 0 0", color: "var(--text-2)", fontSize: "0.9rem" }}>
          Real-time ride demand across Bangalore zones
        </p>
      </div>

      {/* Stat Cards Row */}
      <div
        className="stagger"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          title="Total Zones"
          value={zones.length}
          icon="🗺️"
          color="var(--accent-blue)"
          trend={{ up: true, label: "All active" }}
        />
        <StatCard
          title="Total Demand"
          value={totalDemand}
          icon="🚖"
          color="var(--accent-vio)"
          trend={{ up: true, label: "+12% vs last hour" }}
        />
        <StatCard
          title="Avg Surge"
          value={`${avgSurge}x`}
          icon="⚡"
          color="var(--yellow-mid)"
          trend={{ up: false, label: "Moderate pressure" }}
        />
        <StatCard
          title="Hotspot Zone"
          value={hotspotZone ? `Zone ${hotspotZone.id}` : "—"}
          icon="🔥"
          color="var(--red-surge)"
          trend={{ up: true, label: `${hotspotZone?.demand ?? 0} rides` }}
        />
      </div>

      {/* Zone Cards */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 600, color: "var(--text-2)" }}>
          Zone Overview
        </h2>
        <div
          className="stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {zones.map((zone) => (
            <SurgeCard
              key={zone.id}
              zone={zone}
              onClick={() => navigate(`/zone/${zone.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 600, color: "var(--text-2)" }}>
          Demand Heatmap — Bangalore
        </h2>
        <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
          <Heatmap />
        </div>
      </div>
    </div>
  );
}