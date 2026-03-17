import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import ZoneDetails from "./pages/ZoneDetails";
import Predictions from "./pages/Predictions";
import ChatbotPage from "./pages/ChatbotPage";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";

function AppLayout() {
  const { pathname } = useLocation();
  const hideNav = pathname === "/login";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)" }}>
      {!hideNav && <Navbar />}
      <main style={{ paddingTop: hideNav ? 0 : "64px" }}>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/zone/:id"   element={<ZoneDetails />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/chatbot"    element={<ChatbotPage />} />
          <Route path="/login"      element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
