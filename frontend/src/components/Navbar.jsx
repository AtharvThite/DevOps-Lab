import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/pipeline", label: "Pipeline" },
  { to: "/history", label: "History" },
];

export default function Navbar() {
  return (
    <header className="top-nav">
      <div className="brand-block">
        <div className="brand-dot" />
        <div>
          <p className="brand-title">Automated Bug Detection and Deployment System</p>
          <p className="brand-subtitle">CI/CD Automation Orchestrator</p>
        </div>
      </div>

      <nav className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
