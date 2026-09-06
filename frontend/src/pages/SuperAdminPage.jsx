import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../roleLabels";
import DashboardPage from "./DashboardPage";
import POSTerminalPage from "./POSTerminalPage";
import InventoryPage from "./InventoryPage";
import EmployeesPage from "./EmployeesPage";

export default function SuperAdminPage() {
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

      <h1>Super Admin</h1>

      <p className="subtitle">
        Full access to every store function.
      </p>

      <div className="row">
        <button
          onClick={() => setTab("dashboard")}
          disabled={tab === "dashboard"}
        >
          Dashboard
        </button>

        <button
          onClick={() => setTab("pos")}
          disabled={tab === "pos"}
        >
          POS Terminal
        </button>

        <button
          onClick={() => setTab("inventory")}
          disabled={tab === "inventory"}
        >
          Inventory
        </button>

        <button
          onClick={() => setTab("employees")}
          disabled={tab === "employees"}
        >
          Employees
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        {tab === "dashboard" && <DashboardPage />}

        {tab === "pos" && <POSTerminalPage />}

        {tab === "inventory" && <InventoryPage />}

        {tab === "employees" && <EmployeesPage />}
      </div>
    </div>
  );
}