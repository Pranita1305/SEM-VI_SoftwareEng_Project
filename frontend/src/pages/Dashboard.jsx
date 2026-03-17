import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Heatmap from "../components/Heatmap";

export default function Dashboard() {
  const [zones, setZones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setZones([
      { id: 1, demand: 120, surge: 1.5 },
      { id: 2, demand: 80, surge: 1.0 },
      { id: 3, demand: 200, surge: 2.2 },
    ]);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">SRDAPO Dashboard 🚖</h1>

      {/* Zone Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {zones.map((zone) => (
          <div
            key={zone.id}
            onClick={() => navigate(`/zone/${zone.id}`)}
            className="bg-gray-800 p-4 rounded-xl cursor-pointer hover:bg-gray-700"
          >
            <h2 className="text-lg font-semibold">Zone {zone.id}</h2>
            <p>Demand: {zone.demand}</p>
            <p className="text-red-400">Surge: {zone.surge}x</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <Heatmap />
    </div>
  );
}