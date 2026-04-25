import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { BANGALORE_ZONES, getDemandForZone, getSurgeForZone, getTrendLabel } from "../data/realisticData";

/* Lock the map to Bangalore bounds so it can't drift away */
function MapBounds() {
  const map = useMap();
  useEffect(() => {
    const sw = [12.78, 77.45];
    const ne = [13.10, 77.82];
    map.setMaxBounds([sw, ne]);
    map.fitBounds([sw, ne], { padding: [20, 20] });
  }, [map]);
  return null;
}

export default function Heatmap() {
  const hour = new Date().getHours();

  const zones = BANGALORE_ZONES.map(z => {
    const demand = getDemandForZone(z, hour);
    const surge = getSurgeForZone(z, hour);
    return {
      id: z.id,
      pos: [z.lat, z.lng],
      demand,
      surge,
      trend: getTrendLabel(surge),
      name: z.name,
      pop: z.pop,
    };
  });

  /* Fixed radius tiers — won't change with zoom */
  const getRadius = (demand) => {
    if (demand >= 160) return 20;
    if (demand >= 120) return 17;
    if (demand >= 80)  return 15;
    if (demand >= 40)  return 13;
    return 11;
  };

  const getColors = (surge) => {
    if (surge >= 2.0) return { color: "#f97454", fill: "#f97454" };
    if (surge >= 1.5) return { color: "#fbbf24", fill: "#fbbf24" };
    if (surge >= 1.2) return { color: "#fbbf24", fill: "#fbbf24" };
    return { color: "#34d399", fill: "#34d399" };
  };

  const surgeTag = (s) => {
    if (s >= 2.0) return "🔴 Critical";
    if (s >= 1.5) return "🟠 High";
    if (s >= 1.2) return "🟡 Moderate";
    return "🟢 Normal";
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Legend */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 1000,
        background: "rgba(10,15,30,0.9)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, padding: "8px 12px", backdropFilter: "blur(10px)",
      }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Surge Level</div>
        {[
          { color: "#34d399", label: "Normal (1.0–1.1x)" },
          { color: "#fbbf24", label: "Moderate (1.2–1.9x)" },
          { color: "#f97454", label: "Critical (2.0x+)" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, display: "inline-block", border: `1px solid ${l.color}`, boxShadow: `0 0 6px ${l.color}60` }} />
            <span style={{ fontSize: "0.68rem", color: "var(--text-2)" }}>{l.label}</span>
          </div>
        ))}
      </div>

      <MapContainer
        center={[12.955, 77.62]}
        zoom={12}
        minZoom={11}
        maxZoom={15}
        scrollWheelZoom={true}
        dragging={true}
        style={{ height: 440, width: "100%", borderRadius: 14, zIndex: 1 }}
      >
        <MapBounds />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {zones.map((zone) => {
          const { color, fill } = getColors(zone.surge);
          const r = getRadius(zone.demand);
          return (
            <CircleMarker
              key={zone.id}
              center={zone.pos}
              radius={r}
              pathOptions={{
                color,
                fillColor: fill,
                fillOpacity: 0.55,
                weight: 2,
              }}
            >
              {/* Always-visible label */}
              <Tooltip
                permanent
                direction="top"
                offset={[0, -(r + 2)]}
                className="zone-tooltip"
              >
                <span style={{
                  fontSize: "0.65rem", fontWeight: 700,
                  color: "#e8ecf4", textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                  whiteSpace: "nowrap",
                }}>
                  {zone.name}
                </span>
              </Tooltip>

              <Popup>
                <div style={{ textAlign: "center", padding: "6px 10px", minWidth: 170 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: "#f0f4ff" }}>
                    {zone.name}
                  </p>
                  <p style={{ margin: "2px 0 8px", fontSize: "0.7rem", color: "#8ca0c4" }}>
                    Zone {zone.id} · {zone.pop}
                  </p>

                  <div style={{ display: "flex", justifyContent: "center", gap: "1.2rem" }}>
                    <div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 800, color }}>{zone.demand}</div>
                      <div style={{ fontSize: "0.6rem", color: "#8ca0c4", textTransform: "uppercase", letterSpacing: "0.06em" }}>rides</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 800, color }}>{zone.surge}x</div>
                      <div style={{ fontSize: "0.6rem", color: "#8ca0c4", textTransform: "uppercase", letterSpacing: "0.06em" }}>surge</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, fontSize: "0.72rem", fontWeight: 600, color }}>
                    {surgeTag(zone.surge)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Tooltip & map CSS overrides */}
        <style>{`
          .zone-tooltip {
            background: rgba(10,15,30,0.85) !important;
            border: 1px solid rgba(79,156,249,0.25) !important;
            border-radius: 6px !important;
            padding: 2px 8px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5) !important;
            font-family: "Inter", sans-serif !important;
          }
          .zone-tooltip::before {
            border-top-color: rgba(10,15,30,0.85) !important;
          }
          .leaflet-container {
            background: #0a0f1e !important;
          }
        `}</style>
      </MapContainer>
    </div>
  );
}