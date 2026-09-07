import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function toCsv(sales) {
  const header = ["Sale ID", "Date/Time", "Cashier", "Register", "Items", "Payment Method", "Total"];
  const rows = sales.map((s) => [
    s.id,
    s.date_time,
    s.cashierName,
    s.register_id,
    s.itemCount,
    s.paymentMethod || "",
    s.total_amount.toFixed(2),
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function SalesPage() {
  const { auth } = useAuth();
  const isAdmin = auth.role === "manager" || auth.role === "superadmin";

  const [period, setPeriod] = useState("today");
  const [cashierFilter, setCashierFilter] = useState("");
  const [employees, setEmployees] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    api.listEmployees(auth.token).then(setEmployees).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSales() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getSalesList(auth.token, {
        period,
        cashierId: isAdmin && cashierFilter ? cashierFilter : undefined,
      });
      setSales(data);
    } catch (err) {
      setError(err.message || "Failed to load sales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, cashierFilter]);

  const totals = useMemo(
    () => ({
      count: sales.length,
      revenue: sales.reduce((sum, s) => sum + s.total_amount, 0),
    }),
    [sales]
  );

  function exportCsv() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`sales-${period}-${stamp}.csv`, toCsv(sales), "text/csv;charset=utf-8");
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="section-heading" style={{ margin: 0 }}>
          {isAdmin ? "Sales" : "My Sales"}
        </h1>
        <div className="row" style={{ margin: 0 }}>
          {isAdmin && (
            <select value={cashierFilter} onChange={(e) => setCashierFilter(e.target.value)}>
              <option value="">All cashiers</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <button className="ghost" onClick={exportCsv} disabled={sales.length === 0}>
            <span>Export CSV</span>
            <span></span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <span className="alert-dot" />
          <span>{error}</span>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">{isAdmin ? "Sales" : "My Sales"} ({period === "today" ? "Today" : period === "week" ? "This Week" : period === "month" ? "This Month" : "All Time"})</span>
          <span className="stat-value">{totals.count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">K{totals.revenue.toFixed(2)}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading sales...</div>
      ) : sales.length === 0 ? (
        <div className="empty-state">
          <p>No sales for the selected period.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date/Time</th>
              {isAdmin && <th>Cashier</th>}
              <th>Items</th>
              <th>Payment</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{new Date(sale.date_time).toLocaleString()}</td>
                {isAdmin && <td>{sale.cashierName}</td>}
                <td>{sale.itemCount}</td>
                <td>{sale.paymentMethod}</td>
                <td>K{sale.total_amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
