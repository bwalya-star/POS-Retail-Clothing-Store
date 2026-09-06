const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),
  listInventory: (token) => request("/inventory", { token }),
  restock: (token, sku, quantity) =>
    request("/inventory/restock", { method: "POST", token, body: { sku, quantity } }),
  createProduct: (token, product) => request("/inventory", { method: "POST", token, body: product }),
  updateProduct: (token, sku, { size, colour, unitPrice }) =>
    request(`/inventory/${encodeURIComponent(sku)}`, { method: "PATCH", token, body: { size, colour, unitPrice } }),
  deleteProduct: (token, sku) =>
    request(`/inventory/${encodeURIComponent(sku)}`, { method: "DELETE", token }),
  processSale: (token, { registerId, lineItems, payment }) =>
    request("/sales", { method: "POST", token, body: { registerId, lineItems, payment } }),
  onboardEmployee: (token, { name, email, employeeNumber, password, role }) =>
    request("/employees", {
      method: "POST",
      token,
      body: { name, email, employeeNumber, password, role },
    }),
  listEmployees: (token) => request("/employees", { token }),
  updateEmployeeDetails: (token, employeeId, { name, email }) =>
    request(`/employees/${employeeId}/details`, {
      method: "PATCH",
      token,
      body: { name, email },
    }),
  assignRole: (token, employeeId, role) =>
    request(`/employees/${employeeId}/role`, {
      method: "PATCH",
      token,
      body: { role },
    }),

  getSalesSummary: (token, period) =>
    request(`/reports/summary?period=${period}`, {
      token,
    }),

  getTopSellers: (token, period, limit = 5) =>
    request(`/reports/top-sellers?period=${period}&limit=${limit}`, {
      token,
    }),
};
