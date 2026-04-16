import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard    from "./pages/Dashboard";
import ZoneDetails  from "./pages/ZoneDetails";
import Predictions  from "./pages/Predictions";
import ChatbotPage  from "./pages/ChatbotPage";
import Login        from "./pages/Login";
import LandingPage  from "./pages/LandingPage";
import SearchResults from "./pages/SearchResults";
import Navbar       from "./components/Navbar";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // wait for token validation
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppLayout() {
  const { pathname } = useLocation();
  const hideNav = pathname === "/login" || pathname === "/";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)" }}>
      {!hideNav && <Navbar />}
      <main style={{ paddingTop: hideNav ? 0 : "64px" }}>
        <Routes>
          <Route path="/"               element={<LandingPage />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/zone/:id"       element={<ProtectedRoute><ZoneDetails /></ProtectedRoute>} />
          <Route path="/predictions"    element={<ProtectedRoute><Predictions /></ProtectedRoute>} />
          <Route path="/chatbot"        element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
          <Route path="/search-results" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}
