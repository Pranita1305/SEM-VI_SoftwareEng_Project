import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { to: "/dashboard",   label: "Dashboard" },
  { to: "/predictions", label: "Predictions" },
  { to: "/chatbot",     label: "Chatbot" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function handleLogout() {
    navigate("/login");
  }

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          height: "64px",
          background: "rgba(8, 13, 26, 0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
        }}
      >
        {/* Logo */}
        <Link
          to="/dashboard"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}
        >
          {/* SVG logo mark — lightning bolt in a rounded square */}
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, filter: "drop-shadow(0 4px 10px rgba(79,156,249,0.45))" }}>
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4f9cf9" />
                <stop offset="100%" stopColor="#7c5cfc" />
              </linearGradient>
            </defs>
            {/* Rounded square background */}
            <rect width="34" height="34" rx="9" fill="url(#logoGrad)" />
            {/* Lightning bolt path */}
            <path
              d="M20 5L10 19h8l-4 10 14-16h-8.5L20 5z"
              fill="white"
              opacity="0.95"
            />
          </svg>

          <span style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
            <span className="grad-text">SRDAPO</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
          }}
          className="nav-desktop"
        >
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link key={to} to={to} className={`nav-link${isActive ? " active" : ""}`}>
                {label}
              </Link>
            );
          })}
          <LogoutBtn onClick={handleLogout} />
        </nav>

        {/* Hamburger (mobile only) */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "8px",
            color: "var(--text-1)",
            transition: "background 0.2s",
          }}
        >
          <HamburgerIcon open={menuOpen} />
        </button>
      </header>

      {/* Mobile Drawer */}
      <div
        style={{
          position: "fixed",
          top: "64px",
          left: 0, right: 0,
          zIndex: 99,
          background: "rgba(8, 13, 26, 0.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: menuOpen ? "1px solid var(--border)" : "none",
          overflow: "hidden",
          maxHeight: menuOpen ? "320px" : "0px",
          transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
        className="nav-mobile-drawer"
      >
        <nav style={{ padding: "1rem 1.5rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "0.7rem 1rem",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: isActive ? "var(--text-1)" : "var(--text-2)",
                  background: isActive ? "rgba(79,156,249,0.1)" : "transparent",
                  borderLeft: isActive ? "3px solid var(--accent-blue)" : "3px solid transparent",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {label}
              </Link>
            );
          })}

          {/* Logout in drawer */}
          <div style={{ marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              style={{
                width: "100%",
                padding: "0.7rem 1rem",
                borderRadius: "10px",
                border: "1px solid rgba(249,116,84,0.3)",
                background: "rgba(249,116,84,0.08)",
                color: "var(--red-surge)",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>⎋</span> Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 640px) {
          .nav-desktop  { display: none !important; }
          .nav-hamburger { display: flex !important; align-items: center; }
        }
        @media (min-width: 641px) {
          .nav-mobile-drawer { display: none !important; }
        }
        .nav-hamburger:hover { background: rgba(79,156,249,0.1) !important; }
      `}</style>
    </>
  );
}

function LogoutBtn({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.4rem 1rem",
        borderRadius: "8px",
        border: `1px solid ${hovered ? "rgba(249,116,84,0.7)" : "rgba(249,116,84,0.35)"}`,
        background: hovered ? "rgba(249,116,84,0.2)" : "rgba(249,116,84,0.1)",
        color: "var(--red-surge)",
        fontSize: "0.88rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 0.2s, border-color 0.2s, transform 0.15s",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        fontFamily: "inherit",
      }}
    >
      <span>⎋</span> Logout
    </button>
  );
}

function HamburgerIcon({ open }) {
  const bar = (rotation, y) => ({
    display: "block",
    width: 22,
    height: 2,
    borderRadius: 2,
    background: "var(--text-1)",
    transition: "transform 0.25s ease, opacity 0.2s",
    transformOrigin: "center",
    transform: open ? rotation : "none",
    opacity: y === "hidden" ? 0 : 1,
  });

  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 5, width: 22 }}>
      <span style={open ? { ...bar("rotate(45deg) translate(5px, 5px)"), marginBottom: -2 } : bar("none")} />
      <span style={open ? { display: "block", width: 22, height: 2, borderRadius: 2, background: "var(--text-1)", opacity: 0 } : bar("none")} />
      <span style={open ? { ...bar("rotate(-45deg) translate(5px, -5px)"), marginTop: -2 } : bar("none")} />
    </span>
  );
}