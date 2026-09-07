import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function stockLevel(quantity) {
  if (quantity <= 0) return "out";
  if (quantity <= 5) return "low";
  return "ok";
}

const BLANK_PRODUCT = { styleCode: "", productName: "", description: "", size: "", colour: "", unitPrice: "", quantityOnHand: "" };
const SIZE_OPTIONS = [
  { value: "S", label: "Small" },
  { value: "M", label: "Medium" },
  { value: "L", label: "Large" },
];

export default function InventoryPage({ navParams }) {
  const { auth } = useAuth();
  const [products, setProducts] = useState([]);
  const [panel, setPanel] = useState(null); // null | "add" | { mode: "edit", variant } | { mode: "restock", variant }
  const [form, setForm] = useState(BLANK_PRODUCT);
  const [restockQty, setRestockQty] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmDeleteSku, setConfirmDeleteSku] = useState(null);
  const [highlightSku, setHighlightSku] = useState(null);
  const rowRefs = useRef({});

  async function loadInventory() {
    const items = await api.listInventory(auth.token);
    setProducts(items);
  }

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jumped here from the dashboard's "Top Selling Products" - scroll to and
  // briefly highlight the row once it's actually in `products`.
  useEffect(() => {
    const sku = navParams?.focusSku;
    if (!sku || !products.some((p) => p.sku === sku)) return;
    rowRefs.current[sku]?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightSku(sku);
    const timer = setTimeout(() => setHighlightSku(null), 1600);
    return () => clearTimeout(timer);
  }, [navParams, products]);

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

  function lookupProductBarcode(barcode) {
    const normalizedBarcode = barcode.trim();
    if (!normalizedBarcode) return;

    const match = products.find(
      (product) => product.sku === normalizedBarcode || product.style_code === normalizedBarcode
    );
    if (!match) {
      setMessage("Barcode not found. Complete the product details manually.");
      return;
    }

    setForm((current) => ({
      ...current,
      styleCode: normalizedBarcode,
      productName: match.product_name,
      description: match.description || "",
      size: match.size,
      colour: match.colour,
      unitPrice: String(match.unit_price),
    }));
    setMessage(`${match.product_name} details filled from barcode.`);
    setError("");
  }

  async function submitAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createProduct(auth.token, {
        styleCode: form.styleCode,
        productName: form.productName,
        description: form.description,
        sku: form.styleCode,
        size: form.size,
        colour: form.colour,
        unitPrice: Number(form.unitPrice),
        quantityOnHand: Number(form.quantityOnHand) || 0,
      });
      setMessage(`${form.styleCode} added.`);
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
              <div
                key={v.id}
                ref={(el) => { rowRefs.current[v.sku] = el; }}
                className={`item-row has-actions${highlightSku === v.sku ? " is-highlighted" : ""}`}
                style={{ cursor: "default" }}
              >
                <div className="item-main">
                  <div className="name">{v.product_name}</div>
                  {v.description && <div className="description">{v.description}</div>}
                </div>
                <div className="item-meta">{v.sku}<br />{v.size} / {v.colour}</div>
                <span className={`item-stock ${level}`}>
                  {level === "out" ? "Out of stock" : `${v.quantity_on_hand} in stock`}
                </span>
                <div className="item-price">K{v.unit_price.toFixed(2)}</div>
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
              <label>Product Barcode
                <div className="row">
                  <input
                    value={form.styleCode}
                    onChange={(e) => setForm({ ...form, styleCode: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        lookupProductBarcode(form.styleCode);
                      }
                    }}
                    placeholder="Scan or enter barcode"
                    required
                  />
                  <button type="button" className="ghost" onClick={() => lookupProductBarcode(form.styleCode)}>
                    Lookup
                  </button>
                </div>
              </label>
              <label>Product Name<input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} required /></label>
              <label>Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description shown on the POS list" /></label>
              <label>Size
                <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} required>
                  <option value="" disabled>Select size</option>
                  {form.size && !SIZE_OPTIONS.some((size) => size.value === form.size) && (
                    <option value={form.size}>{form.size}</option>
                  )}
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
              </label>
              <label>Colour<input value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} required /></label>
              <label>Price<input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required /></label>
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
              <label>Price<input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required /></label>
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