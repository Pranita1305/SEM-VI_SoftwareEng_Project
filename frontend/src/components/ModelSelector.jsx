export default function ModelSelector({ model, setModel }) {
  return (
    <select
      value={model}
      onChange={(e) => setModel(e.target.value)}
      className="p-2 rounded text-black"
    >
      <option value="SARIMA">SARIMA</option>
      <option value="XGBoost">XGBoost</option>
      <option value="LSTM">LSTM</option>
    </select>
  );
}