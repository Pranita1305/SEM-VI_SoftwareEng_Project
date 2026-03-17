const getSurgeColor = (surge) => {
  if (surge > 1.8) return { bg: "rgba(249,116,84,0.15)", badge: "#f97454", bar: "#f97454" };
  if (surge > 1.2) return { bg: "rgba(251,191,36,0.1)",  badge: "#fbbf24", bar: "#fbbf24" };
  return { bg: "rgba(52,211,153,0.1)", badge: "#34d399", bar: "#34d399" };
};

export default function SurgeCard({ zone, onClick }) {
  const { bg, badge, bar } = getSurgeColor(zone.surge);
  const isHighSurge = zone.surge > 1.5;

  return (
    <div
      onClick={onClick}
      className="glass animate-slide-up"
      style={{
        padding: 0,
        cursor: "pointer",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header Strip */}
      <div
        style={{
          padding: "1rem 1.25rem 0.75rem",
          background: bg,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${badge}30`,
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
          Zone {zone.id}
        </h2>
        {isHighSurge && (
          <span
            className="surge-badge"
            style={{ background: `${badge}20`, color: badge }}
          >
            ⚡ SURGE
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-2)", marginBottom: 2 }}>Demand</p>
            <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>{zone.demand}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-2)", marginBottom: 2 }}>Surge</p>
            <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: badge }}>
              {zone.surge}x
            </p>
          </div>
        </div>

        {/* Demand progress bar */}
        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min((zone.demand / 250) * 100, 100)}%`,
              background: `linear-gradient(90deg, ${bar}, ${bar}88)`,
              borderRadius: 999,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}