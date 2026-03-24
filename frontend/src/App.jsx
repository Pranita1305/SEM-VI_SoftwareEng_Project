import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import ZoneDetails from "./pages/ZoneDetails";
import Predictions from "./pages/Predictions";
import ChatbotPage from "./pages/ChatbotPage";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import SearchResults from "./pages/SearchResults";
import Navbar from "./components/Navbar";

function AppLayout() {
  const { pathname } = useLocation();
  const hideNav = pathname === "/login" || pathname === "/";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)" }}>
      {!hideNav && <Navbar />}
      <main style={{ paddingTop: hideNav ? 0 : "64px" }}>
        <Routes>
          <Route path="/"                element={<LandingPage />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/zone/:id"        element={<ZoneDetails />} />
          <Route path="/predictions"     element={<Predictions />} />
          <Route path="/chatbot"         element={<ChatbotPage />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/search-results"  element={<SearchResults />} />
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
