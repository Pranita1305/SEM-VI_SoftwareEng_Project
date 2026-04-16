import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [tab, setTab]         = useState("login"); // "login" | "signup"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const navigate  = useNavigate();
  const { login, signup } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill in both fields."); return; }
    setError("");
    setLoading(true);
    try {
      if (tab === "login") await login(email, password);
      else                 await signup(email, password);
      navigate("/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 503)
        setError("Database is offline. Please try again later.");
      else if (err.response?.status === 401)
        setError("Incorrect email or password.");
      else if (err.response?.status === 409)
        setError("An account with this email already exists.");
      else
        setError(detail || "Something went wrong. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Left Branding Panel */}
      <div style={{ flex: 1, background: "linear-gradient(145deg, #0d1b3e 0%, #0a0f1e 60%, #130a2e 100%)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "3rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(79,156,249,0.08)", top: "-100px", left: "-100px", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(124,92,252,0.1)", bottom: "-80px", right: "-80px", filter: "blur(60px)" }} />

        <div className="animate-slide-right" style={{ position: "relative", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "var(--accent-grad)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 1.5rem", boxShadow: "0 12px 40px rgba(79,156,249,0.35)" }}>🚖</div>
          <h1 style={{ margin: 0, fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            <span className="grad-text">SRDAPO</span>
          </h1>
          <p style={{ margin: "0.5rem 0 0", color: "var(--text-2)", fontSize: "1rem", lineHeight: 1.6 }}>
            Smart Ride Demand Anticipation<br />& Pricing Optimizer
          </p>
          <div style={{ marginTop: "2.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {["📊 Real-time demand forecasting", "⚡ Dynamic surge pricing", "🗺️  Zone heatmaps & clustering", "🤖 AI chatbot intelligence"].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 1rem", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.875rem", color: "var(--text-2)", textAlign: "left" }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{ width: "420px", flexShrink: 0, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", borderLeft: "1px solid var(--border)" }}>
        <div className="animate-slide-up" style={{ width: "100%", maxWidth: 360 }}>

          {/* Tab switcher */}
          <div style={{ display: "flex", background: "rgba(15,23,42,0.5)", borderRadius: 10, padding: "0.3rem", marginBottom: "1.75rem", border: "1px solid var(--border)" }}>
            {["login", "signup"].map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", transition: "all 0.2s", background: tab === t ? "var(--accent-grad)" : "transparent", color: tab === t ? "#fff" : "var(--text-2)" }}>
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.7rem", fontWeight: 700 }}>
            {tab === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ margin: "0 0 2rem", color: "var(--text-2)", fontSize: "0.9rem" }}>
            {tab === "login" ? "Sign in to access the dashboard" : "Join SRDAPO to get started"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: "0.4rem" }}>Email</label>
              <input id="login-email" type="email" placeholder="you@example.com" className="input-dark"
                value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-2)", marginBottom: "0.4rem" }}>Password</label>
              <input id="login-password" type="password" placeholder="••••••••" className="input-dark"
                value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} />
            </div>

            {error && (
              <div style={{ padding: "0.65rem 1rem", borderRadius: 10, background: "rgba(249,116,84,0.1)", border: "1px solid rgba(249,116,84,0.3)", color: "#f97454", fontSize: "0.83rem" }}>
                ⚠️ {error}
              </div>
            )}

            <button id="login-btn" onClick={handleSubmit} disabled={loading} className="btn-grad"
              style={{ padding: "0.8rem", fontSize: "1rem", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait…" : tab === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </div>

          <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", color: "var(--text-2)", textAlign: "center" }}>
            SRDAPO v1.1 · B.Tech CSE SEM VI Project
          </p>
        </div>
      </div>
    </div>
  );
}