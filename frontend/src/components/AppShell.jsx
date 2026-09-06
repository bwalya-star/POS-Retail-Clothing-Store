import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../roleLabels";

export default function AppShell({ navItems, activeKey, onSelect, children }) {
  const { auth, logout } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="dot" />
          Retail POS
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeKey === item.key ? "active" : ""}`}
              onClick={() => onSelect(item.key)}
            >
              {item.label}
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
          <button className="ghost" onClick={logout}>Logout</button>
        </header>

        <div className="content">{children}</div>
      </div>
    </div>
  );
}
