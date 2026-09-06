import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../roleLabels";
import DashboardPage from "./DashboardPage";
import InventoryPage from "./InventoryPage";

export default function ManagerPage() {
  const { auth, logout } = useAuth();
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="page">
      <header className="topbar">
        <span>
          {roleLabel(auth.role)}: {auth.name}
        </span>

        <button onClick={logout}>Logout</button>
      </header>

      <h1>Manager</h1>

      <p className="subtitle">
        Manage inventory and view store sales reports.
      </p>

      <div className="row">
        <button
          onClick={() => setTab("dashboard")}
          disabled={tab === "dashboard"}
        >
          Dashboard
        </button>

        <button
          onClick={() => setTab("inventory")}
          disabled={tab === "inventory"}
        >
          Inventory
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        {tab === "dashboard" && <DashboardPage />}

        {tab === "inventory" && <InventoryPage />}
      </div>
    </div>
  );
}