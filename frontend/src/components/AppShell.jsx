import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../roleLabels";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function AppShell({ navItems, activeKey, onSelect, children }) {
  const { auth, logout } = useAuth();
  const now = useClock();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={30} />
          Retail POS
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeKey === item.key ? "active" : ""}`}
              onClick={() => onSelect(item.key)}
            >
              <span>{item.label}</span>
              <span></span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-greeting">
            <h2>Welcome, {auth.name}</h2>
            <p>{roleLabel(auth.role)} &middot; here's what's happening in your store.</p>
          </div>

          <div className="status-bar">
            <span className="status-pill">
              <span className="status-dot" />
              Register 1 &middot; Online
            </span>
            <span className="status-clock">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>

          <div className="row" style={{ margin: 0 }}>
            <ThemeToggle />
            <button className="ghost logout-btn" onClick={logout}>
              <span>Logout</span>
              <span></span>
            </button>
          </div>
        </header>

        <div className="content">{children}</div>
      </div>
    </div>
  );
}
