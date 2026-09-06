import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function stockLevel(quantity) {
  if (quantity <= 0) return "out";
  if (quantity <= 5) return "low";
  return "ok";
}

const BLANK_PRODUCT = { styleCode: "", productName: "", description: "", basePrice: "", sku: "", size: "", colour: "", unitPrice: "", quantityOnHand: "" };

export default function InventoryPage() {
  const { auth } = useAuth();
  const [products, setProducts] = useState([]);
  const [panel, setPanel] = useState(null); // null | "add" | { mode: "edit", variant } | { mode: "restock", variant }
  const [form, setForm] = useState(BLANK_PRODUCT);
  const [restockQty, setRestockQty] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmDeleteSku, setConfirmDeleteSku] = useState(null);

  async function loadInventory() {
    const items = await api.listInventory(auth.token);
    setProducts(items);
  }

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setForm(BLANK_PRODUCT);
    setError("");
    setPanel("add");
  }

  function openEdit(variant) {
    setForm({
      styleCode: variant.style_code,
      productName: variant.product_name,
      description: variant.description || "",
      basePrice: "",
      sku: variant.sku,
      size: variant.size,
      colour: variant.colour,
      unitPrice: variant.unit_price,
      quantityOnHand: variant.quantity_on_hand,
    });
    setError("");
    setPanel({ mode: "edit", variant });
  }

  function openRestock(variant) {
    setRestockQty(1);
    setError("");
    setPanel({ mode: "restock", variant });
  }

  async function submitAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createProduct(auth.token, {
        styleCode: form.styleCode,
        productName: form.productName,
        description: form.description,
        basePrice: form.basePrice ? Number(form.basePrice) : undefined,
        sku: form.sku,
        size: form.size,
        colour: form.colour,
        unitPrice: Number(form.unitPrice),
        quantityOnHand: Number(form.quantityOnHand) || 0,
      });
      setMessage(`${form.sku} added.`);
      setPanel(null);
      loadInventory();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.updateProduct(auth.token, panel.variant.sku, {
        size: form.size,
        colour: form.colour,
        unitPrice: Number(form.unitPrice),
      });
      setMessage(`${panel.variant.sku} updated.`);
      setPanel(null);
      loadInventory();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitRestock(e) {
    e.preventDefault();
    setError("");
    try {
      const updated = await api.restock(auth.token, panel.variant.sku, Number(restockQty));
      setMessage(`${updated.sku} is now at ${updated.quantity_on_hand} unit(s).`);
      setPanel(null);
      loadInventory();
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete is a two-step process: first click arms the row ("Delete" -> "Confirm?"),
  // second click actually removes it. Any other action on the row cancels the arm.
  async function confirmDelete(variant) {
    setError("");
    setMessage("");
    try {
      await api.deleteProduct(auth.token, variant.sku);
      setMessage(`${variant.sku} removed.`);
      setConfirmDeleteSku(null);
      loadInventory();
    } catch (err) {
      setError(err.message);
      setConfirmDeleteSku(null);
    }
  }

  return (
    <>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1>Manage Inventory</h1>
          <button onClick={openAdd}>
            <span>+ Add Product</span>
            <span></span>
          </button>
        </div>
        {message && <p className="success">{message}</p>}
        {!panel && error && <p className="error">{error}</p>}

        <div className="item-list">
          {products.length === 0 && <div className="item-row is-empty">No products yet.</div>}
          {products.map((v) => {
            const level = stockLevel(v.quantity_on_hand);
            const confirming = confirmDeleteSku === v.sku;
            return (
              <div key={v.id} className="item-row has-actions" style={{ cursor: "default" }}>
                <div className="item-main">
                  <div className="name">{v.product_name}</div>
                  {v.description && <div className="description">{v.description}</div>}
                </div>
                <div className="item-meta">{v.sku}<br />{v.size} / {v.colour}</div>
                <span className={`item-stock ${level}`}>
                  {level === "out" ? "Out of stock" : `${v.quantity_on_hand} in stock`}
                </span>
                <div className="item-price">${v.unit_price.toFixed(2)}</div>
                <div className="item-actions">
                  {confirming ? (
                    <>
                      <button className="danger" onClick={() => confirmDelete(v)}>
                        <span>Confirm</span>
                        <span></span>
                      </button>
                      <button className="ghost" onClick={() => setConfirmDeleteSku(null)}>
                        <span>Cancel</span>
                        <span></span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="ghost" onClick={() => openRestock(v)}>
                        <span>Restock</span>
                        <span></span>
                      </button>
                      <button className="ghost" onClick={() => openEdit(v)}>
                        <span>Edit</span>
                        <span></span>
                      </button>
                      <button className="danger" onClick={() => setConfirmDeleteSku(v.sku)}>
                        <span>Delete</span>
                        <span></span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {panel && (
        <div className="panel">
          {panel === "add" && (
            <form onSubmit={submitAdd}>
              <h2>Add Product</h2>
              <label>Style Code<input value={form.styleCode} onChange={(e) => setForm({ ...form, styleCode: e.target.value })} required /></label>
              <label>Product Name<input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required /></label>
              <label>Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description shown on the POS list" /></label>
              <label>Base Price (only needed for a new style)<input type="number" step="0.01" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></label>
              <label>SKU<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /></label>
              <label>Size<input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} required /></label>
              <label>Colour<input value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} required /></label>
              <label>Unit Price<input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required /></label>
              <label>Initial Quantity<input type="number" value={form.quantityOnHand} onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })} /></label>
              {error && <p className="error">{error}</p>}
              <div className="row">
                <button type="button" className="ghost" onClick={() => setPanel(null)}>
                  <span>Cancel</span>
                  <span></span>
                </button>
                <button type="submit">
                  <span>Add Product</span>
                  <span></span>
                </button>
              </div>
            </form>
          )}

          {panel.mode === "edit" && (
            <form onSubmit={submitEdit}>
              <h2>Edit {panel.variant.sku}</h2>
              <label>Size<input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} required /></label>
              <label>Colour<input value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} required /></label>
              <label>Unit Price<input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required /></label>
              {error && <p className="error">{error}</p>}
              <div className="row">
                <button type="button" className="ghost" onClick={() => setPanel(null)}>
                  <span>Cancel</span>
                  <span></span>
                </button>
                <button type="submit">
                  <span>Save Changes</span>
                  <span></span>
                </button>
              </div>
            </form>
          )}

          {panel.mode === "restock" && (
            <form onSubmit={submitRestock}>
              <h2>Restock {panel.variant.sku}</h2>
              <p className="hint">Current stock: {panel.variant.quantity_on_hand}</p>
              <label>Quantity Received<input type="number" min="1" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} required /></label>
              {error && <p className="error">{error}</p>}
              <div className="row">
                <button type="button" className="ghost" onClick={() => setPanel(null)}>
                  <span>Cancel</span>
                  <span></span>
                </button>
                <button type="submit">
                  <span>Restock</span>
                  <span></span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
