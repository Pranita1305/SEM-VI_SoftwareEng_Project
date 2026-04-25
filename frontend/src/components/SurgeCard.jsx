const getSurgeColor = (surge) => {
  if (surge > 1.8) return { bg: "rgba(249,116,84,0.15)", badge: "#f97454", bar: "#f97454" };
  if (surge > 1.2) return { bg: "rgba(251,191,36,0.1)",  badge: "#fbbf24", bar: "#fbbf24" };
  return { bg: "rgba(52,211,153,0.1)", badge: "#34d399", bar: "#34d399" };
};

const getTrendIcon = (trend) => {
  switch (trend) {
    case "critical": return "🔴";
    case "high":     return "🟠";
    case "moderate": return "🟡";
    default:         return "🟢";
  }
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
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        borderColor: isHighSurge ? `${badge}40` : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 12px 32px ${badge}25`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header Strip */}
      <div
        style={{
          padding: "0.85rem 1.15rem 0.65rem",
          background: bg,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${badge}30`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: `${badge}20`, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.85rem", fontWeight: 700, color: badge,
          }}>
            {zone.id}
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {zone.name || `Zone ${zone.id}`}
            </h2>
            {zone.pop && (
              <p style={{ margin: 0, fontSize: "0.62rem", color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {zone.pop}
              </p>
            )}
          </div>
        </div>
        {isHighSurge && (
          <span
            className="surge-badge"
            style={{ background: `${badge}20`, color: badge, flexShrink: 0 }}
          >
            ⚡ SURGE
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "0.85rem 1.15rem 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.6rem" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-2)", marginBottom: 2, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Demand</p>
            <p style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {zone.demand} <span style={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--text-2)" }}>rides</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-2)", marginBottom: 2, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Surge</p>
            <p style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: badge, letterSpacing: "-0.02em" }}>
              {zone.surge}x
            </p>
          </div>
        </div>

        {/* Trend label */}
        {zone.trend && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.55rem" }}>
            <span style={{ fontSize: "0.7rem" }}>{getTrendIcon(zone.trend)}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: badge, textTransform: "capitalize" }}>
              {zone.trend}
            </span>
          </div>
        )}

        {/* Demand progress bar */}
        <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.min((zone.demand / 220) * 100, 100)}%`,
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