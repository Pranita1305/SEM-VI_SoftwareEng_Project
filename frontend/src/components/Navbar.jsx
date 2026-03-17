import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="bg-gray-800 px-6 py-3 flex justify-between items-center shadow-md">
      
      <h1 className="text-xl font-bold">
        SRDAPO 🚖
      </h1>

      <div className="flex gap-6">
        <Link to="/" className="hover:text-gray-400">Dashboard</Link>
        <Link to="/predictions" className="hover:text-gray-400">Predictions</Link>
        <Link to="/chatbot" className="hover:text-gray-400">Chatbot</Link>
        <Link to="/login" className="hover:text-gray-400">Login</Link>
      </div>

    </div>
  );
}