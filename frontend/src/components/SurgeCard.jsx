export default function SurgeCard({ zone, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 p-4 rounded-xl cursor-pointer hover:bg-gray-700"
    >
      <h2 className="text-lg font-semibold">
        Zone {zone.id}
      </h2>

      <p>Demand: {zone.demand}</p>

      <p className="text-red-400">
        Surge: {zone.surge}x
      </p>
    </div>
  );
}