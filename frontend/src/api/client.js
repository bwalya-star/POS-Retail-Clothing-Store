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
  login: (username, password) => request("/auth/login", { method: "POST", body: { username, password } }),
  listInventory: (token) => request("/inventory", { token }),
  restock: (token, sku, quantity) =>
    request("/inventory/restock", { method: "POST", token, body: { sku, quantity } }),
  processSale: (token, { registerId, lineItems, payment }) =>
    request("/sales", { method: "POST", token, body: { registerId, lineItems, payment } }),
};
