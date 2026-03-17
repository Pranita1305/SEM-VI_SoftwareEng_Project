import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import ZoneDetails from "./pages/ZoneDetails";
import Predictions from "./pages/Predictions";
import ChatbotPage from "./pages/ChatbotPage";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/zone/:id" element={<ZoneDetails />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
