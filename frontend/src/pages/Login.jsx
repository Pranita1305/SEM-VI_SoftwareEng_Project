import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ── Floating nodes animation for branding panel ─────────── */
function FloatingNodes() {
  const nodes = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 15 + Math.random() * 70,
    size: 4 + Math.random() * 6,
    delay: i * 0.4,
    dur: 3 + Math.random() * 3,
  }));

  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
      <defs>
        <linearGradient id="nodeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f9cf9" />
          <stop offset="100%" stopColor="#7c5cfc" />
        </linearGradient>
      </defs>
      {/* Connecting lines */}
      {nodes.slice(0, -1).map((n, i) => (
        <line key={`l${i}`} x1={n.x} y1={n.y} x2={nodes[i + 1].x} y2={nodes[i + 1].y}
          stroke="url(#nodeGrad)" strokeWidth="0.15" opacity="0.4">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur={`${n.dur}s`} begin={`${n.delay}s`} repeatCount="indefinite" />
        </line>
      ))}
      {/* Pulsing dots */}
      {nodes.map(n => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.size * 0.4} fill="url(#nodeGrad)" opacity="0.15">
            <animate attributeName="r" values={`${n.size * 0.3};${n.size * 0.8};${n.size * 0.3}`}
              dur={`${n.dur}s`} begin={`${n.delay}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={n.x} cy={n.y} r={n.size * 0.15} fill="#4f9cf9">
            <animate attributeName="opacity" values="0.5;1;0.5" dur={`${n.dur}s`} begin={`${n.delay}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </svg>
  );
}

/* ── Password visibility toggle ──────────────────────────── */
function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/* ── Live stats ticker ───────────────────────────────────── */
function LiveStats() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 3000); return () => clearInterval(t); }, []);

  const stats = [
    { label: "Active Riders", value: (2847 + (tick % 50)).toLocaleString(), color: "#4f9cf9" },
    { label: "Zones Online", value: "15/15", color: "#34d399" },
    { label: "Avg Surge", value: `${(1.3 + (tick % 5) * 0.1).toFixed(1)}x`, color: "#fbbf24" },
    { label: "ML Accuracy", value: "94.7%", color: "#7c5cfc" },
  ];

  return (
    <div style={{ marginTop: "2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", width: "100%", maxWidth: 320 }}>
      {stats.map(s => (
        <div key={s.label} style={{
          padding: "0.6rem 0.8rem", borderRadius: 12,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: s.color, lineHeight: 1.2,
            transition: "all 0.3s ease" }}>{s.value}</div>
          <div style={{ fontSize: "0.62rem", color: "var(--text-2)", marginTop: "0.15rem",
            letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main Login / Signup Page
   ════════════════════════════════════════════════════════════ */
export default function Login() {
  const [tab, setTab]             = useState("login");
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const navigate  = useNavigate();
  const { login, signup } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill in all required fields."); return; }
    if (tab === "signup") {
      if (!fullName.trim()) { setError("Please enter your full name."); return; }
      if (password !== confirm) { setError("Passwords do not match."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    }
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

  const isSignup = tab === "signup";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Left Branding Panel ──────────────────────────── */}
      <div style={{
        flex: 1,
        background: "linear-gradient(145deg, #0d1b3e 0%, #0a0f1e 60%, #130a2e 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "3rem", position: "relative", overflow: "hidden",
      }}>
        {/* Ambient orbs */}
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(79,156,249,0.06)", top: "-140px", left: "-140px", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(124,92,252,0.08)", bottom: "-120px", right: "-120px", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(249,116,84,0.05)", top: "40%", left: "60%", filter: "blur(60px)" }} />

        {/* Animated node network */}
        <FloatingNodes />

        <div className="animate-slide-right" style={{ position: "relative", textAlign: "center", zIndex: 2 }}>
          {/* Logo */}
          <div style={{
            width: 78, height: 78, borderRadius: 22,
            background: "var(--accent-grad)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.2rem", margin: "0 auto 1.5rem",
            boxShadow: "0 16px 48px rgba(79,156,249,0.4)",
          }}>🚖</div>

          <h1 style={{ margin: 0, fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.03em" }}>
            <span className="grad-text">SRDAPO</span>
          </h1>
          <p style={{ margin: "0.4rem 0 0", color: "var(--text-2)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Smart Ride Demand Anticipation<br />&amp; Pricing Optimizer
          </p>

          {/* Live metrics */}
          <LiveStats />

          {/* Trust badge */}
          <div style={{
            marginTop: "1.5rem", display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.4rem 1rem", borderRadius: 999,
            background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
            fontSize: "0.72rem", color: "#34d399", fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block",
              animation: "pulseRing 1.6s ease-out infinite" }} />
            System Online · All Services Healthy
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────── */}
      <div style={{
        width: "460px", flexShrink: 0, background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem", borderLeft: "1px solid var(--border)",
      }}>
        <div className="animate-slide-up" style={{ width: "100%", maxWidth: 380 }}>

          {/* Tab switcher */}
          <div style={{
            display: "flex", background: "rgba(15,23,42,0.5)", borderRadius: 12,
            padding: "0.3rem", marginBottom: "2rem", border: "1px solid var(--border)",
          }}>
            {["login", "signup"].map((t) => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                style={{
                  flex: 1, padding: "0.55rem", borderRadius: 9, border: "none",
                  fontFamily: "inherit", fontWeight: 600, fontSize: "0.875rem",
                  cursor: "pointer", transition: "all 0.25s",
                  background: tab === t ? "var(--accent-grad)" : "transparent",
                  color: tab === t ? "#fff" : "var(--text-2)",
                }}>
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            {isSignup ? "Create account" : "Welcome back"}
          </h2>
          <p style={{ margin: "0 0 1.75rem", color: "var(--text-2)", fontSize: "0.88rem" }}>
            {isSignup ? "Join SRDAPO to access demand intelligence" : "Sign in to your dashboard"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

            {/* Full Name — signup only */}
            <div style={{
              maxHeight: isSignup ? "80px" : "0px",
              opacity: isSignup ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 0.35s ease, opacity 0.3s ease",
            }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.35rem" }}>Full Name</label>
              <input type="text" placeholder="e.g. Shivang Sharma" className="input-dark"
                value={fullName} onChange={(e) => setFullName(e.target.value)} onKeyDown={handleKeyDown}
                style={{ borderRadius: 11 }} />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.35rem" }}>Email Address</label>
              <input id="login-email" type="email" placeholder="you@example.com" className="input-dark"
                value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                style={{ borderRadius: 11 }} />
            </div>

            {/* Password with eye toggle */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)" }}>Password</label>
                {!isSignup && (
                  <button type="button" style={{
                    background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer",
                    fontSize: "0.72rem", fontWeight: 600, fontFamily: "inherit", padding: 0,
                  }}
                    onClick={() => alert("Password reset would be sent to your email.")}
                  >Forgot password?</button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input id="login-password" type={showPwd ? "text" : "password"} placeholder="••••••••" className="input-dark"
                  value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                  style={{ borderRadius: 11, paddingRight: "2.8rem" }} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-2)",
                    display: "flex", alignItems: "center", padding: "4px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--text-1)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-2)"}
                >
                  <EyeIcon visible={showPwd} />
                </button>
              </div>
            </div>

            {/* Confirm Password — signup only */}
            <div style={{
              maxHeight: isSignup ? "80px" : "0px",
              opacity: isSignup ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 0.35s ease, opacity 0.3s ease",
            }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "0.35rem" }}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input type={showConf ? "text" : "password"} placeholder="••••••••" className="input-dark"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={handleKeyDown}
                  style={{ borderRadius: 11, paddingRight: "2.8rem" }} />
                <button type="button" onClick={() => setShowConf(v => !v)}
                  style={{
                    position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-2)",
                    display: "flex", alignItems: "center", padding: "4px",
                  }}
                >
                  <EyeIcon visible={showConf} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "0.65rem 1rem", borderRadius: 11,
                background: "rgba(249,116,84,0.1)", border: "1px solid rgba(249,116,84,0.3)",
                color: "#f97454", fontSize: "0.83rem",
                display: "flex", alignItems: "center", gap: "0.5rem",
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Submit */}
            <button id="login-btn" onClick={handleSubmit} disabled={loading} className="btn-grad"
              style={{
                padding: "0.85rem", fontSize: "1rem", marginTop: "0.35rem",
                opacity: loading ? 0.7 : 1, borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              }}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} /> Please wait…</>
                : isSignup ? "Create Account →" : "Sign In →"
              }
            </button>
          </div>

          {/* Footer */}
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.78rem", color: "var(--text-2)", margin: 0 }}>
              {isSignup
                ? <>Already have an account? <button onClick={() => setTab("login")} style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: "0.78rem", padding: 0 }}>Sign in</button></>
                : <>Don't have an account? <button onClick={() => setTab("signup")} style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: "0.78rem", padding: 0 }}>Create one</button></>
              }
            </p>
            <p style={{ marginTop: "0.8rem", fontSize: "0.68rem", color: "var(--text-2)", opacity: 0.5 }}>
              SRDAPO v2.0 · B.Tech CSE SEM VI Project
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}