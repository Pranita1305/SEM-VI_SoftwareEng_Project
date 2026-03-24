import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function Heatmap() {
  const zones = [
    { id: 1, pos: [12.97, 77.59], demand: 200, name: "Koramangala" },
    { id: 2, pos: [12.95, 77.62], demand: 120, name: "Indiranagar" },
    { id: 3, pos: [12.99, 77.58], demand: 80,  name: "Sadashivanagar" },
    { id: 4, pos: [12.93, 77.56], demand: 160, name: "Jayanagar" },
    { id: 5, pos: [13.01, 77.61], demand: 50,  name: "Hebbal" },
  ];

  const getStyle = (demand) => {
    if (demand > 150) return { color: "#f97454", fillColor: "#f97454" };
    if (demand > 100) return { color: "#fbbf24", fillColor: "#fbbf24" };
    return { color: "#34d399", fillColor: "#34d399" };
  };

  return (
    <MapContainer
      center={[12.97, 77.59]}
      zoom={12}
      style={{ height: 380, width: "100%", borderRadius: 14, zIndex: 1 }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {zones.map((zone) => {
        const { color, fillColor } = getStyle(zone.demand);
        return (
          <CircleMarker
            key={zone.id}
            center={zone.pos}
            radius={Math.max(12, zone.demand / 12)}
            pathOptions={{
              color,
              fillColor,
              fillOpacity: 0.45,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ textAlign: "center", padding: "4px 8px", minWidth: 120 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "#f0f4ff" }}>
                  Zone {zone.id}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#8ca0c4" }}>
                  {zone.name}
                </p>
                <p style={{ margin: "6px 0 0", fontWeight: 700, color }}>
                  {zone.demand} rides
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}