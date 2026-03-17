import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(8,13,26,0.92)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "8px 14px",
          backdropFilter: "blur(10px)",
        }}
      >
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.78rem" }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontWeight: 700, color: "var(--accent-blue)" }}>
          {payload[0].value} rides
        </p>
      </div>
    );
  }
  return null;
};

export default function DemandChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        {/* SVG gradient definition — standard SVG, not recharts exports */}
        <defs>
          <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4f9cf9" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#4f9cf9" stopOpacity={0.0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="time"
          tick={{ fill: "#8ca0c4", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8ca0c4", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "var(--accent-blue)", strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey="demand"
          stroke="#4f9cf9"
          strokeWidth={2.5}
          fill="url(#demandGrad)"
          dot={{ fill: "#4f9cf9", strokeWidth: 0, r: 4 }}
          activeDot={{ fill: "#fff", stroke: "#4f9cf9", strokeWidth: 2, r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}