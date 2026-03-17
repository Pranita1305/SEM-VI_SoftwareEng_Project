import { useParams } from "react-router-dom";
import DemandChart from "../components/DemandChart";

export default function ZoneDetails() {
  const { id } = useParams();

  const data = [
    { time: "10AM", demand: 50 },
    { time: "11AM", demand: 80 },
    { time: "12PM", demand: 120 },
    { time: "1PM", demand: 150 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Zone {id} Details
      </h1>

      <div className="bg-gray-800 p-4 rounded-xl mb-6">
        <p>Current Demand: 150</p>
        <p>Surge Multiplier: 2.0x</p>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl">
        <h2 className="mb-4">Demand Trend</h2>
        <DemandChart data={data} />
      </div>
    </div>
  );
}