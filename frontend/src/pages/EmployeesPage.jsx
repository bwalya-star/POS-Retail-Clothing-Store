import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { roleLabel } from "../roleLabels";

const ROLES = ["cashier", "manager", "superadmin"];

function nextEmployeeNumber(employees) {
  const highest = employees.reduce((max, employee) => {
    const match = /^EMP-(\d+)$/.exec(employee.employee_number || "");
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `EMP-${String(highest + 1).padStart(4, "0")}`;
}

export default function EmployeesPage() {
  const { auth } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", employeeNumber: "", password: "", role: "cashier" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [confirmSaveId, setConfirmSaveId] = useState(null);

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
      setMessage(`${employee.email} onboarded as ${roleLabel(employee.role)}.`);
      setForm({ name: "", email: "", employeeNumber: "", password: "", role: "cashier" });
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

  function startEditing(employee) {
    setEditingId(employee.id);
    setEditForm({ name: employee.name, email: employee.email });
    setConfirmSaveId(null);
    setError("");
    setMessage("");
  }

  function cancelEditing() {
    setEditingId(null);
    setConfirmSaveId(null);
  }

  // Save is a two-step process: first click arms it ("Save" -> "Confirm
  // Save"), second click actually writes the change.
  async function saveDetails(employeeId) {
    setError("");
    setMessage("");
    try {
      await api.updateEmployeeDetails(auth.token, employeeId, editForm);
      setEditingId(null);
      setConfirmSaveId(null);
      setMessage("Employee details updated.");
      loadEmployees();
    } catch (err) {
      setError(err.message);
      setConfirmSaveId(null);
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <h1>Manage Employees</h1>

      <div className="card" style={{ maxWidth: "none", marginBottom: 20 }}>
        <h2>Onboard Employee</h2>
        <form className="row" onSubmit={handleOnboard}>
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            value={form.employeeNumber || nextEmployeeNumber(employees)}
            aria-label="Generated employee ID"
            onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
            placeholder="Employee ID"
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
      </div>

      <h2>Employees</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Employee ID</th>
            <th>Role</th>
            <th>Status</th>
            <th>Change Role</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{editingId === employee.id ? (
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              ) : employee.name}</td>
              <td>{editingId === employee.id ? (
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              ) : employee.email}</td>
              <td>{employee.employee_number}</td>
              <td>{roleLabel(employee.role)}</td>
              <td>{employee.is_active ? "Active" : "Disabled"}</td>
              <td>
                {editingId === employee.id ? (
                  <div className="row">
                    {confirmSaveId === employee.id ? (
                      <button type="button" onClick={() => saveDetails(employee.id)}>
                        <span>Confirm Save</span>
                        <span></span>
                      </button>
                    ) : (
                      <button type="button" onClick={() => setConfirmSaveId(employee.id)}>
                        <span>Save</span>
                        <span></span>
                      </button>
                    )}
                    <button type="button" className="ghost" onClick={cancelEditing}>
                      <span>Cancel</span>
                      <span></span>
                    </button>
                  </div>
                ) : (
                  <div className="row">
                    <select value={employee.role} onChange={(e) => handleRoleChange(employee.id, e.target.value)}>
                      {ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                    </select>
                    <button type="button" className="ghost" onClick={() => startEditing(employee)}>
                      <span>Edit</span>
                      <span></span>
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
