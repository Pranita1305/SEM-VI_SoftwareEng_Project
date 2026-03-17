import { useState } from "react";
import DemandChart from "../components/DemandChart";

export default function Predictions() {
  const [model, setModel] = useState("SARIMA");

  const data = [
    { time: "Now", demand: 100 },
    { time: "+1h", demand: 140 },
    { time: "+2h", demand: 180 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Predictions 📊
      </h1>

      {/* Model Selector */}
      <select
        value={model}
        onChange={(e) => setModel(e.target.value)}
        className="mb-4 p-2 rounded text-black"
      >
        <option>SARIMA</option>
        <option>XGBoost</option>
        <option>LSTM</option>
      </select>

      <div className="bg-gray-800 p-4 rounded-xl">
        <h2 className="mb-4">
          Model: {model}
        </h2>

        <DemandChart data={data} />
      </div>
    </div>
  );
}