import { useState, useEffect } from "react";
import DemandChart from "../components/DemandChart";
import { predictionsAPI } from "../services/api";

const MODELS = [
  { key: "RandomForest", label: "RandomForest", desc: "Ensemble tree-based model — primary production model" },
  { key: "SARIMA",       label: "SARIMA",       desc: "Short-term seasonal pattern based forecasting" },
  { key: "XGBoost",      label: "XGBoost",      desc: "Gradient boosting for time-series features" },
  { key: "LSTM",         label: "LSTM",         desc: "Deep learning for long-term sequential patterns" },
];

export default function Predictions() {
  const [activeModel, setActiveModel] = useState("RandomForest");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    predictionsAPI.list(activeModel)
      .then((res) => setPredictions(res.data))
      .catch(() => setError("Failed to fetch predictions. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [activeModel]);

  const current = MODELS.find((m) => m.key === activeModel);

  // Build chart from forecast of first prediction, or use current_demand across zones
  const chartData = predictions.length > 0
    ? (predictions[0].forecast ?? []).map((pt) => ({
        time:   `+${pt.hour_offset}h`,
        demand: pt.predicted_demand,
      }))
    : [];

  const peakDemand  = predictions.length ? Math.max(...predictions.map((p) => p.current_demand)) : 0;
  const avgSurge    = predictions.length ? (predictions.reduce((s, p) => s + p.surge_multiplier, 0) / predictions.length).toFixed(2) : "—";
  const hotspot     = predictions.length ? predictions.reduce((a, p) => (p.current_demand > (a?.current_demand ?? 0) ? p : a), null) : null;

  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>Demand Predictions</h1>
        <p style={{ margin: "0.25rem 0 0", color: "var(--text-2)", fontSize: "0.9rem" }}>
          Forecasted ride demand using ML models
        </p>
      </div>

      {/* Model Tabs */}
      <div className="animate-slide-up" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "rgba(15,23,42,0.5)", padding: "0.35rem", borderRadius: 12, width: "fit-content", border: "1px solid var(--border)" }}>
        {MODELS.map((m) => (
          <button key={m.key} id={`model-tab-${m.key}`} onClick={() => setActiveModel(m.key)}
            style={{ padding: "0.5rem 1.25rem", borderRadius: 9, border: "none", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", transition: "all 0.2s", background: activeModel === m.key ? "var(--accent-grad)" : "transparent", color: activeModel === m.key ? "#fff" : "var(--text-2)" }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "0.9rem 1.2rem", borderRadius: 12, background: "rgba(249,116,84,0.1)", border: "1px solid rgba(249,116,84,0.3)", color: "#f97454", marginBottom: "1.5rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Chart Panel */}
      <div className="glass animate-slide-up" style={{ padding: "1.75rem" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1.15rem" }}>{current.label} Forecast</h2>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-2)", fontSize: "0.85rem" }}>{current.desc}</p>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-2)", textAlign: "center", padding: "2rem 0" }}>Loading predictions…</p>
        ) : chartData.length > 0 ? (
          <DemandChart data={chartData} />
        ) : predictions.length > 0 ? (
          // Fallback: bar chart of current_demand per zone
          <DemandChart data={predictions.map((p) => ({ time: p.zone_name, demand: p.current_demand }))} />
        ) : (
          <p style={{ color: "var(--text-2)", textAlign: "center", padding: "2rem 0" }}>
            No prediction data for {activeModel}.
          </p>
        )}

        {/* Summary Stats */}
        {!loading && predictions.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
            {[
              { label: "Peak Demand",  value: peakDemand },
              { label: "Avg Surge",    value: `${avgSurge}x` },
              { label: "Hotspot Zone", value: hotspot?.zone_name ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700 }} className="grad-text">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}