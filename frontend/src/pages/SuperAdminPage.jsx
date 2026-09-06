import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { roleLabel } from "../roleLabels";
import POSTerminalPage from "./POSTerminalPage";
import RestockPage from "./RestockPage";

const ROLES = ["cashier", "manager", "superadmin"];

function EmployeesTab() {
  const { auth } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "cashier" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadEmployees() {
    const list = await api.listEmployees(auth.token);
    setEmployees(list);
  }

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleOnboard(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const employee = await api.onboardEmployee(auth.token, form);
      setMessage(`${employee.username} onboarded as ${roleLabel(employee.role)}.`);
      setForm({ name: "", username: "", password: "", role: "cashier" });
      loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRoleChange(employeeId, role) {
    setError("");
    setMessage("");
    try {
      await api.assignRole(auth.token, employeeId, role);
      loadEmployees();
    } catch (err) {
      setError(err.message);
      loadEmployees();
    }
  }

  return (
    <div>
      <h2>Onboard Employee</h2>
      <form className="row" onSubmit={handleOnboard}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password (8+ chars)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLES.map((role) => (
            <option key={role} value={role}>{roleLabel(role)}</option>
          ))}
        </select>
        <button type="submit">Onboard</button>
      </form>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <h2>Employees</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Change Role</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.name}</td>
              <td>{employee.username}</td>
              <td>{roleLabel(employee.role)}</td>
              <td>{employee.is_active ? "Active" : "Disabled"}</td>
              <td>
                <select
                  value={employee.role}
                  onChange={(e) => handleRoleChange(employee.id, e.target.value)}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{roleLabel(role)}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
      {tab === "employees" && <EmployeesTab />}
    </div>
  );
}
