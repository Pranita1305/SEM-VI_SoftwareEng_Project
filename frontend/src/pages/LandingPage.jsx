import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ── Cursor Trail ── */
const TRAIL_SYMBOLS = ["⚡", "◆", "▲", "◈", "●", "✦", "◇", "▸", "V", "S","P"];

function CursorTrail() {
  const trailRef = useRef([]);
  const containerRef = useRef(null);
  const counterRef = useRef(0);

  const spawnParticle = useCallback((x, y) => {
    const container = containerRef.current;
    if (!container) return;

    const el = document.createElement("span");
    const symbol = TRAIL_SYMBOLS[counterRef.current % TRAIL_SYMBOLS.length];
    counterRef.current++;

    const hue = (counterRef.current * 23) % 360;
    const size = Math.random() * 10 + 10;

    Object.assign(el.style, {
      position: "fixed",
      left: x + "px",
      top: y + "px",
      fontSize: size + "px",
      color: `hsl(${hue},90%,72%)`,
      pointerEvents: "none",
      userSelect: "none",
      zIndex: 9999,
      transform: "translate(-50%,-50%) scale(1)",
      opacity: "1",
      transition: "opacity 0.55s ease, transform 0.55s ease",
      textShadow: `0 0 8px hsl(${hue},90%,72%)`,
      fontWeight: 900,
    });
    el.textContent = symbol;
    container.appendChild(el);

    // trigger fade-out on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = "0";
        el.style.transform = "translate(-50%,-50%) scale(0.3)";
      });
    });

    setTimeout(() => el.remove(), 600);
  }, []);

  useEffect(() => {
    let last = 0;
    const onMove = (e) => {
      const now = Date.now();
      if (now - last < 40) return; // throttle ~25fps
      last = now;
      spawnParticle(e.clientX, e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [spawnParticle]);

  return <div ref={containerRef} aria-hidden="true" />;
}

/* ── Premium Logo SVG ── */
function LogoIcon({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f9cf9" />
          <stop offset="100%" stopColor="#7c5cfc" />
        </linearGradient>
        <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7c5cfc" />
          <stop offset="100%" stopColor="#4f9cf9" />
        </linearGradient>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Outer hex */}
      <polygon points="45,4 80,23.5 80,66.5 45,86 10,66.5 10,23.5"
        fill="none" stroke="url(#lg1)" strokeWidth="1.5" opacity="0.3" />
      {/* Inner hex */}
      <polygon points="45,16 70,30 70,60 45,74 20,60 20,30"
        fill="url(#lg1)" opacity="0.06" />
      {/* Six nodes + spokes + ring edges */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const a = (i * 60 - 90) * Math.PI / 180;
        const a2 = ((i + 1) * 60 - 90) * Math.PI / 180;
        const x = 45 + 22 * Math.cos(a), y = 45 + 22 * Math.sin(a);
        const x2 = 45 + 22 * Math.cos(a2), y2 = 45 + 22 * Math.sin(a2);
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x2} y2={y2} stroke="url(#lg1)" strokeWidth="0.9" opacity="0.45" />
            <line x1={x} y1={y} x2="45" y2="45" stroke="url(#lg2)" strokeWidth="0.7" opacity="0.35" />
            <circle cx={x} cy={y} r="3.2" fill="url(#lg1)" filter="url(#glow)" />
          </g>
        );
      })}
      {/* Center */}
      <circle cx="45" cy="45" r="7" fill="url(#lg1)" opacity="0.15" />
      <circle cx="45" cy="45" r="4" fill="url(#lg1)" filter="url(#glow)" />
      <circle cx="45" cy="45" r="2" fill="#fff" />
    </svg>
  );
}


/* ── Interactive Magnetic Dot Field ── */
function MagneticField() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId, t = 0;

    /* ── physics constants ── */
    const REPEL_R = 130;   // radius of mouse repulsion
    const REPEL_F = 8.5;   // repulsion force strength
    const SPRING = 0.055; // spring back toward home
    const DAMPING = 0.82;  // velocity damping per frame

    let pts = [];

    function build() {
      const W = canvas.width, H = canvas.height;
      const cols = Math.floor(W / 28);
      const rows = Math.floor(H / 28);
      const spacingX = W / cols;
      const spacingY = H / rows;
      pts = [];
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          pts.push({
            hx: c * spacingX,
            hy: r * spacingY,
            x: c * spacingX,
            y: r * spacingY,
            vx: 0,
            vy: 0,
          });
        }
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      build();
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    function draw() {
      t += 0.007;
      const W = canvas.width, H = canvas.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      /* ── background ── */
      ctx.fillStyle = "#060b18";
      ctx.fillRect(0, 0, W, H);

      /* ── slow aurora blobs ── */
      const blobs = [
        { cx: W * 0.15 + Math.sin(t * 0.22) * W * 0.06, cy: H * 0.30, r: W * 0.50, h: 225, a: 0.05 },
        { cx: W * 0.80 + Math.cos(t * 0.18) * W * 0.05, cy: H * 0.65, r: W * 0.45, h: 272, a: 0.045 },
        { cx: W * 0.50, cy: H * 0.05 + Math.sin(t * 0.15) * H * 0.04, r: W * 0.60, h: 205, a: 0.032 },
      ];
      for (const { cx, cy, r, h, a } of blobs) {
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        rg.addColorStop(0, `hsla(${h},82%,55%,${a})`);
        rg.addColorStop(0.5, `hsla(${h + 30},65%,42%,${a * 0.3})`);
        rg.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = rg;
        ctx.fill();
      }

      /* ── dot physics + drawing ── */
      for (const p of pts) {
        /* idle breathing wave */
        const wave = Math.sin(t + p.hx * 0.018 + p.hy * 0.014) * 3.5;
        const waveX = Math.cos(t * 0.7 + p.hy * 0.012) * 2.5;

        /* mouse repulsion */
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist2 = dx * dx + dy * dy;
        const repR2 = REPEL_R * REPEL_R;
        if (dist2 < repR2 && dist2 > 0.01) {
          const dist = Math.sqrt(dist2);
          const factor = (1 - dist / REPEL_R);
          p.vx += (dx / dist) * factor * factor * REPEL_F;
          p.vy += (dy / dist) * factor * factor * REPEL_F;
        }

        /* spring toward home + wave offset */
        p.vx += (p.hx + waveX - p.x) * SPRING;
        p.vy += (p.hy + wave - p.y) * SPRING;

        /* damping */
        p.vx *= DAMPING;
        p.vy *= DAMPING;

        p.x += p.vx;
        p.y += p.vy;

        /* displacement → colour + size */
        const ddx = p.x - p.hx;
        const ddy = p.y - p.hy;
        const disp = Math.sqrt(ddx * ddx + ddy * ddy);
        const norm = Math.min(disp / 70, 1); // 0 → 1 as displaced 0 → 70px

        /* idle hue 220 (blue-ish), displaced shifts → 320 (pink→orange) */
        const hue = 220 + norm * 120;
        const sat = 75 + norm * 20;
        const lit = 48 + norm * 22;
        const alph = 0.25 + norm * 0.75;
        const size = 1.8 + norm * 3.5;

        /* tiny glow for displaced dots */
        if (norm > 0.15) {
          const rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 5);
          rg.addColorStop(0, `hsla(${hue},${sat}%,${lit + 15}%,${alph * 0.55})`);
          rg.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 5, 0, Math.PI * 2);
          ctx.fillStyle = rg;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},${sat}%,${lit}%,${alph})`;
        ctx.fill();
      }

      /* ── mouse ring indicator ── */
      if (mx > 0) {
        const ringAlpha = 0.18 + 0.08 * Math.sin(t * 3);
        ctx.beginPath();
        ctx.arc(mx, my, REPEL_R, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(124,92,252,${ringAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        const inner = ctx.createRadialGradient(mx, my, 0, mx, my, 24);
        inner.addColorStop(0, "rgba(79,156,249,0.25)");
        inner.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(mx, my, 24, 0, Math.PI * 2);
        ctx.fillStyle = inner;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}

/* ── Key metrics ── */
const STATS = [
  { label: "Accuracy", value: "94.7%", color: "#4f9cf9" },
  { label: "Zones", value: "24", color: "#7c5cfc" },
  { label: "ML Models", value: "3", color: "#34d399" },
  { label: "Latency", value: "<200ms", color: "#f97454" },
];

/* ── Three core pillars ── */
const FEATURES = [
  {
    icon: "◈",
    title: "Demand Forecasting",
    desc: "Hybrid SARIMA + XGBoost + LSTM ensemble predicts per-zone ride demand across short, medium, and long horizons with measurable precision.",
    grad: "linear-gradient(135deg,#4f9cf9,#7c5cfc)",
  },
  {
    icon: "⚡",
    title: "Surge Pricing Engine",
    desc: "ML-driven multiplier activates when predicted demand exceeds zone thresholds — aligning supply, demand, and revenue in real time.",
    grad: "linear-gradient(135deg,#7c5cfc,#f97454)",
  },
  {
    icon: "◉",
    title: "Zone Intelligence",
    desc: "KMeans clustering identifies demand hotspots. Live heatmaps and an AI chatbot surface actionable insights without writing a single query.",
    grad: "linear-gradient(135deg,#34d399,#4f9cf9)",
  },
];

/* ── Hook: appear on scroll ── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, visible];
}

/* ── Reveal wrapper ── */
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Main Component ── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [hoverBtn, setHoverBtn] = useState(false);
  const glowRef = useRef(null);

  /* Directly mutate the glow div — no state, no re-renders, no lag */
  useEffect(() => {
    const handle = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = e.clientX + "px";
        glowRef.current.style.top = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  const handleGetStarted = () => {
    const token = localStorage.getItem("token");
    navigate(token ? "/dashboard" : "/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text-1)",
        fontFamily: "'Inter', sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Ambient radial glow that follows mouse */}
      <div
        ref={glowRef}
        style={{
          position: "fixed",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,156,249,0.055) 0%, transparent 70%)",
          transform: "translate(-50%,-50%)",
          left: 0,
          top: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <MagneticField />
      <CursorTrail />

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
          gap: "2rem",
        }}
      >
        {/* Full name badge */}
        <div className="animate-slide-up" style={{ animationDelay: "0s" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(79,156,249,0.07)",
            border: "1px solid rgba(79,156,249,0.18)",
            borderRadius: 999, padding: "0.35rem 1.1rem",
            fontSize: "0.75rem", color: "var(--text-2)", fontWeight: 500,
            letterSpacing: "0.04em", backdropFilter: "blur(10px)",
          }}>
            Smart Ride Demand Anticipation &amp; Pricing Optimizer
          </div>
        </div>

        {/* Main heading */}
        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div style={{ margin: "0 auto 1.8rem", filter: "drop-shadow(0 0 32px rgba(79,156,249,0.55))", width: 90, height: 90 }}>
            <LogoIcon size={90} />
          </div>

          <h1 style={{ margin: 0, fontSize: "clamp(3.2rem, 7vw, 6rem)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.05em" }}>
            <span className="grad-text">SRDAPO</span>
          </h1>

          <p style={{
            marginTop: "0.7rem", fontSize: "0.80rem", color: "var(--text-2)", fontWeight: 400,
            maxWidth: 420, lineHeight: 1.7, letterSpacing: "0.01em"
          }}>
            Intelligent ride demand forecasting &amp; real-time surge pricing,<br />
            powered by a SARIMA · XGBoost · LSTM ensemble.
          </p>
        </div>

        {/* CTA Button */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <button
            id="landing-get-started"
            onClick={handleGetStarted}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            style={{
              background: "var(--accent-grad)",
              border: "none",
              borderRadius: 14,
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.1rem",
              padding: "1rem 2.4rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              boxShadow: hoverBtn
                ? "0 12px 48px rgba(79,156,249,0.55)"
                : "0 6px 30px rgba(79,156,249,0.3)",
              transform: hoverBtn ? "translateY(-3px) scale(1.03)" : "translateY(0) scale(1)",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
              letterSpacing: "0.01em",
            }}
          >
            Get Started
            <span
              style={{
                display: "inline-block",
                transform: hoverBtn ? "translateX(4px)" : "translateX(0)",
                transition: "transform 0.25s ease",
                fontSize: "1.2rem",
              }}
            >
              →
            </span>
          </button>

          <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--text-2)", opacity: 0.65 }}>
          </p>
        </div>

        {/* Stats row — number-first, no emojis */}
        <div className="animate-slide-up" style={{ animationDelay: "0.3s", display: "flex", flexWrap: "wrap", gap: "0.8rem", justifyContent: "center" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{
              padding: "0.65rem 1.4rem", borderRadius: 12, minWidth: 90, textAlign: "center",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{
                fontSize: "0.63rem", color: "var(--text-2)", marginTop: "0.3rem",
                letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 500
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div
          className="animate-slide-up"
          style={{ animationDelay: "0.5s", marginTop: "1rem" }}
        >
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "0.3rem", color: "var(--text-2)", fontSize: "0.75rem",
          }}>
            <span>Scroll to explore</span>
            <div style={{
              width: 24, height: 38, border: "2px solid rgba(79,156,249,0.3)",
              borderRadius: 12, display: "flex", alignItems: "flex-start", justifyContent: "center",
              padding: "5px",
            }}>
              <div style={{
                width: 4, height: 8, background: "#4f9cf9", borderRadius: 9,
                animation: "scrollDot 2s ease-in-out infinite",
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "4rem 2rem 6rem",
        }}
      >
        <Reveal>
          <h2 style={{
            textAlign: "center", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
            fontWeight: 800, marginBottom: "0.5rem", letterSpacing: "-0.03em",
          }}>
            Three pillars.{" "}
            <span className="grad-text">One platform.</span>
          </h2>
          <p style={{ textAlign: "center", color: "var(--text-2)", fontSize: "0.95rem", maxWidth: 440, margin: "0 auto 3rem" }}>
            From raw trip data to live pricing decisions — no manual intervention.
          </p>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.2rem",
          }}
        >
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.07}>
              <FeatureCard feature={f} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: "relative", zIndex: 2, padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{
              textAlign: "center", fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              fontWeight: 800, marginBottom: "3rem", letterSpacing: "-0.03em",
            }}>
              How it <span className="grad-text">works</span>
            </h2>
          </Reveal>

          {[
            { step: "01", title: "Ingest", desc: "Historical trips, weather, and traffic ingested per Bangalore zone via scheduled pipelines." },
            { step: "02", title: "Forecast", desc: "SARIMA handles seasonality, XGBoost encodes features, LSTM models long-range dependencies — fused into one demand estimate." },
            { step: "03", title: "Price", desc: "Demand exceeding zone thresholds triggers the surge engine, which computes the optimal fare multiplier instantly." },
            { step: "04", title: "Visualise", desc: "Interactive heatmaps, trend charts, and an AI chatbot surface every insight on the live dashboard." },
          ].map((item, i) => (
            <Reveal key={item.step} delay={i * 0.1}>
              <div
                style={{
                  display: "flex", gap: "1.5rem", marginBottom: "2rem",
                  alignItems: "flex-start",
                }}
              >
                <div style={{
                  minWidth: 52, height: 52, borderRadius: 14,
                  background: "var(--accent-grad)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: "0.85rem", color: "#fff",
                  boxShadow: "0 6px 20px rgba(79,156,249,0.3)",
                  flexShrink: 0,
                }}>
                  {item.step}
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.3rem", fontSize: "1.05rem", fontWeight: 700 }}>{item.title}</h3>
                  <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.9rem", lineHeight: 1.65 }}>{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── TECH STACK BANNER ── */}
      <section style={{ position: "relative", zIndex: 2, padding: "2rem" }}>
        <Reveal>
          <div className="glass" style={{
            maxWidth: 900, margin: "0 auto", padding: "2rem 2.5rem",
            textAlign: "center",
          }}>
            <p style={{ margin: "0 0 1.2rem", fontSize: "0.8rem", color: "var(--text-2)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
              Tech Stack
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem", justifyContent: "center" }}>
              {["React.js", "FastAPI", "MongoDB", "XGBoost", "LSTM / TensorFlow", "SARIMA", "JWT Auth", "APScheduler", "Recharts", "Leaflet"].map((t) => (
                <span key={t} style={{
                  background: "rgba(79,156,249,0.1)",
                  border: "1px solid rgba(79,156,249,0.2)",
                  borderRadius: 999, padding: "0.35rem 0.9rem",
                  fontSize: "0.8rem", color: "#4f9cf9", fontWeight: 500,
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        position: "relative", zIndex: 2,
        padding: "6rem 2rem",
        textAlign: "center",
      }}>
        <Reveal>
          <div style={{
            maxWidth: 600, margin: "0 auto",
          }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 0.8rem" }}>
              From prediction to <span className="grad-text">profit</span>!
            </h2>
            <p style={{ color: "var(--text-2)", fontSize: "0.95rem", marginBottom: "2rem", lineHeight: 1.7 }}>
              SRDAPO turns historical demand patterns into live pricing decisions — so operators stay ahead of demand, not behind it.
            </p>
            <button
              id="landing-get-started-bottom"
              onClick={handleGetStarted}
              className="btn-grad"
              style={{ padding: "1rem 2.4rem", fontSize: "1.1rem", fontWeight: 700, borderRadius: 14 }}
            >
              Get Started →
            </button>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: "relative", zIndex: 2,
        borderTop: "1px solid var(--border)",
        padding: "1.5rem 2rem",
        textAlign: "center",
        color: "var(--text-2)",
        fontSize: "0.8rem",
      }}>
        SRDAPO &nbsp;&middot;&nbsp; Pranita Mahajan &nbsp;&middot;&nbsp; Pulkit &nbsp;&middot;&nbsp; Shivang Sharma
      </footer>

      {/* ── Extra keyframes injected inline ── */}
      <style>{`
        @keyframes scrollDot {
          0%   { transform: translateY(0); opacity: 1; }
          60%  { transform: translateY(14px); opacity: 0; }
          61%  { transform: translateY(0); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

/* ── Feature card sub-component ── */
function FeatureCard({ feature }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="glass"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "1.6rem",
        cursor: "default",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.25s ease, background 0.25s, border-color 0.25s, box-shadow 0.25s",
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: feature.grad,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.4rem", marginBottom: "1rem",
        boxShadow: hov ? "0 8px 28px rgba(79,156,249,0.3)" : "0 4px 12px rgba(0,0,0,0.3)",
        transition: "box-shadow 0.25s",
      }}>
        {feature.icon}
      </div>
      <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem", fontWeight: 700 }}>{feature.title}</h3>
      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6 }}>{feature.desc}</p>
    </div>
  );
}
