import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function Heatmap() {
  const zones = [
    { id: 1, pos: [12.97, 77.59], demand: 200 },
    { id: 2, pos: [12.95, 77.62], demand: 120 },
    { id: 3, pos: [12.99, 77.58], demand: 80 },
  ];

  const getColor = (demand) => {
    if (demand > 150) return "red";
    if (demand > 100) return "orange";
    return "green";
  };

  return (
    <MapContainer
      center={[12.97, 77.59]}
      zoom={12}
      className="h-80 w-full rounded-xl"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {zones.map((zone) => (
        <Circle
          key={zone.id}
          center={zone.pos}
          radius={500}
          pathOptions={{ color: getColor(zone.demand) }}
        >
          <Popup>
            Zone {zone.id} <br />
            Demand: {zone.demand}
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}