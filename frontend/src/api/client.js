const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const url = `${API_BASE}${path}`;

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log("========== API REQUEST ==========");
  console.log("Method:", method);
  console.log("URL:", url);
  console.log("Body:", body);
  console.log("Token:", token ? "Present" : "Missing");

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log("========== API RESPONSE ==========");
    console.log("Status:", res.status);
    console.log("OK:", res.ok);

    const data = await res.json().catch(() => ({}));

    console.log("Response data:", data);

    if (!res.ok) {
      console.error("========== API ERROR ==========");
      console.error("Status:", res.status);
      console.error("Error response:", data);

      throw new Error(
        data.error || `Request failed with status ${res.status}`
      );
    }

    return data;
  } catch (err) {
    console.error("========== FETCH ERROR ==========");
    console.error("URL:", url);
    console.error("Error:", err);
    console.error("Message:", err.message);

    throw err;
  }
}

export const api = {
  login: (username, password) => request("/auth/login", { method: "POST", body: { username, password } }),
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
  onboardEmployee: (token, { name, username, password, role }) =>
    request("/employees", {
      method: "POST",
      token,
      body: { name, username, password, role },
    }),
  listEmployees: (token) => request("/employees", { token }),
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
