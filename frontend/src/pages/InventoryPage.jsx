import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const PALETTE = ["#7c5cff", "#ff8a5c", "#26c0a1", "#5c9dff", "#ff5c8a", "#c05cff"];
function colourFor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

const BLANK_PRODUCT = { styleCode: "", productName: "", basePrice: "", sku: "", size: "", colour: "", unitPrice: "", quantityOnHand: "" };

export default function InventoryPage() {
  const { auth } = useAuth();
  const [products, setProducts] = useState([]);
  const [panel, setPanel] = useState(null); // null | "add" | { mode: "edit", variant } | { mode: "restock", variant }
  const [form, setForm] = useState(BLANK_PRODUCT);
  const [restockQty, setRestockQty] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  async function handleDelete(variant) {
    setError("");
    setMessage("");
    try {
      await api.deleteProduct(auth.token, variant.sku);
      setMessage(`${variant.sku} removed.`);
      loadInventory();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1>Manage Inventory</h1>
          <button onClick={openAdd}>+ Add Product</button>
        </div>
        {message && <p className="success">{message}</p>}
        {!panel && error && <p className="error">{error}</p>}

        <div className="product-grid">
          {products.map((v) => (
            <div key={v.id} className="product-card" style={{ cursor: "default" }}>
              <div className="product-thumb" style={{ background: colourFor(v.sku) }}>
                {v.product_name.charAt(0)}
              </div>
              <div className="name">{v.product_name}</div>
              <div className="meta">{v.sku}</div>
              <div className="meta">{v.size} / {v.colour} &middot; {v.quantity_on_hand} in stock</div>
              <div className="price">${v.unit_price.toFixed(2)}</div>
              <div className="actions">
                <button className="ghost" onClick={() => openRestock(v)}>Restock</button>
                <button className="ghost" onClick={() => openEdit(v)}>Edit</button>
                <button className="danger" onClick={() => handleDelete(v)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {panel && (
        <div className="panel">
          {panel === "add" && (
            <form onSubmit={submitAdd}>
              <h2>Add Product</h2>
              <label>Style Code<input value={form.styleCode} onChange={(e) => setForm({ ...form, styleCode: e.target.value })} required /></label>
              <label>Product Name<input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required /></label>
              <label>Base Price (only needed for a new style)<input type="number" step="0.01" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></label>
              <label>SKU<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /></label>
              <label>Size<input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} required /></label>
              <label>Colour<input value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} required /></label>
              <label>Unit Price<input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required /></label>
              <label>Initial Quantity<input type="number" value={form.quantityOnHand} onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })} /></label>
              {error && <p className="error">{error}</p>}
              <div className="row">
                <button type="button" className="ghost" onClick={() => setPanel(null)}>Cancel</button>
                <button type="submit">Add Product</button>
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
                <button type="button" className="ghost" onClick={() => setPanel(null)}>Cancel</button>
                <button type="submit">Save Changes</button>
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
                <button type="button" className="ghost" onClick={() => setPanel(null)}>Cancel</button>
                <button type="submit">Restock</button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
