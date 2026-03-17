import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/",            label: "Dashboard" },
  { to: "/predictions", label: "Predictions" },
  { to: "/chatbot",     label: "Chatbot" },
  { to: "/login",       label: "Login" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "64px",
        background: "rgba(8, 13, 26, 0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            width: 32, height: 32, borderRadius: 9,
            background: "var(--accent-grad)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", fontWeight: 800, color: "#fff",
            boxShadow: "0 4px 14px rgba(79,156,249,0.4)",
          }}
        >
          S
        </span>
        <span style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
          <span className="grad-text">SRDAPO</span>
        </span>
      </Link>

      {/* Nav Links */}
      <nav style={{ display: "flex", gap: "2rem" }}>
        {NAV_LINKS.map(({ to, label }) => {
          const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`nav-link${isActive ? " active" : ""}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}