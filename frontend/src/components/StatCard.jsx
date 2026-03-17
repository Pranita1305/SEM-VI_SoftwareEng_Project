export default function StatCard({ title, value, icon, color = "var(--accent-blue)", trend }) {
  return (
    <div
      className="glass animate-slide-up"
      style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </span>
        {icon && (
          <span
            style={{
              fontSize: "1.1rem",
              background: `${color}20`,
              borderRadius: 8,
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            {icon}
          </span>
        )}
      </div>

      <p style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "var(--text-1)" }}>
        {value}
      </p>

      {trend && (
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 500,
            color: trend.up ? "var(--green-ok)" : "var(--red-surge)",
          }}
        >
          {trend.up ? "↑" : "↓"} {trend.label}
        </span>
      )}

      {/* Color accent bar at bottom */}
      <div
        style={{
          marginTop: 4,
          height: 3,
          borderRadius: 999,
          background: color,
          opacity: 0.7,
          width: "40%",
        }}
      />
    </div>
  );
}