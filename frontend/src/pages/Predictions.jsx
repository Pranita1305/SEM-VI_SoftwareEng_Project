import { useState } from "react";
import DemandChart from "../components/DemandChart";

const MODELS = [
  {
    key: "SARIMA",
    label: "SARIMA",
    desc: "Short-term seasonal pattern based forecasting",
    data: [
      { time: "Now",  demand: 100 },
      { time: "+1h",  demand: 140 },
      { time: "+2h",  demand: 180 },
      { time: "+3h",  demand: 155 },
      { time: "+4h",  demand: 130 },
    ],
  },
  {
    key: "XGBoost",
    label: "XGBoost",
    desc: "Tree-based gradient boosting for time-series features",
    data: [
      { time: "Now",  demand: 100 },
      { time: "+1h",  demand: 128 },
      { time: "+2h",  demand: 162 },
      { time: "+3h",  demand: 175 },
      { time: "+4h",  demand: 148 },
    ],
  },
  {
    key: "LSTM",
    label: "LSTM",
    desc: "Deep learning for long-term sequential patterns",
    data: [
      { time: "Now",  demand: 100 },
      { time: "+1h",  demand: 135 },
      { time: "+2h",  demand: 190 },
      { time: "+3h",  demand: 210 },
      { time: "+4h",  demand: 185 },
    ],
  },
];

export default function Predictions() {
  const [activeModel, setActiveModel] = useState("SARIMA");
  const current = MODELS.find((m) => m.key === activeModel);

  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700 }}>
          Demand Predictions
        </h1>
        <p style={{ margin: "0.25rem 0 0", color: "var(--text-2)", fontSize: "0.9rem" }}>
          Forecasted ride demand using ML models
        </p>
      </div>

      {/* Model Tabs */}
      <div
        className="animate-slide-up"
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          background: "rgba(15,23,42,0.5)",
          padding: "0.35rem",
          borderRadius: 12,
          width: "fit-content",
          border: "1px solid var(--border)",
        }}
      >
        {MODELS.map((m) => (
          <button
            key={m.key}
            id={`model-tab-${m.key}`}
            onClick={() => setActiveModel(m.key)}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: 9,
              border: "none",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s",
              background: activeModel === m.key
                ? "var(--accent-grad)"
                : "transparent",
              color: activeModel === m.key ? "#fff" : "var(--text-2)",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart Panel */}
      <div className="glass animate-slide-up" style={{ padding: "1.75rem" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: "1.15rem" }}>
            {current.label} Forecast
          </h2>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-2)", fontSize: "0.85rem" }}>
            {current.desc}
          </p>
        </div>

        <DemandChart data={current.data} />

        {/* Summary Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          {[
            { label: "Peak Demand", value: Math.max(...current.data.map((d) => d.demand)) },
            { label: "Avg Demand",  value: Math.round(current.data.reduce((a, d) => a + d.demand, 0) / current.data.length) },
            { label: "Forecast Horizon", value: `+${current.data.length - 1}h` },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
              </p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700 }} className="grad-text">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}