import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../roleLabels";
import POSTerminalPage from "./POSTerminalPage";
import RestockPage from "./RestockPage";

// Super Admin has access to every other role's capabilities (see
// docs/domain_model.md). Employee onboarding & role assignment is a
// separate use case deferred to Elaboration Iteration 2.
export default function SuperAdminPage() {
  const { auth, logout } = useAuth();
  const [tab, setTab] = useState("pos");

  return (
    <div className="page">
      <header className="topbar">
        <span>{roleLabel(auth.role)}: {auth.name}</span>
        <button onClick={logout}>Logout</button>
      </header>

      <h1>Super Admin</h1>
      <p className="subtitle">Full access to every role's functions.</p>

      <div className="row">
        <button onClick={() => setTab("pos")} disabled={tab === "pos"}>POS Terminal</button>
        <button onClick={() => setTab("restock")} disabled={tab === "restock"}>Restock Inventory</button>
        <button onClick={() => setTab("employees")} disabled={tab === "employees"}>Onboard Employees</button>
      </div>

      {tab === "pos" && <POSTerminalPage hideHeader />}
      {tab === "restock" && <RestockPage hideHeader />}
      {tab === "employees" && (
        <div className="card">
          <p>Employee onboarding &amp; role assignment is planned for Elaboration Iteration 2 (see docs/detailed_use_cases.md "Remaining Use Cases").</p>
        </div>
      )}
    </div>
  );
}
