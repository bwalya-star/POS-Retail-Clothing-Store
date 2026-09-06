import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function stockLevel(quantity) {
  if (quantity <= 0) return "out";
  if (quantity <= 5) return "low";
  return "ok";
}

export default function POSTerminalPage() {
  const { auth, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]); // [{ variant, quantity }]
  const [phase, setPhase] = useState("shopping"); // shopping -> paying -> done
  const [paymentAmount, setPaymentAmount] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listInventory(auth.token).then(setProducts).catch((err) => setError(err.message));
  }, [auth.token]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.product_name))],
    [products]
  );

  const visibleProducts = category === "All" ? products : products.filter((p) => p.product_name === category);

  const total = cart.reduce((sum, line) => sum + line.variant.unit_price * line.quantity, 0);

  function addToCart(variant) {
    setError("");
    if (variant.quantity_on_hand < 1) {
      setError(`${variant.sku} is out of stock.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((line) => line.variant.id === variant.id);
      if (existing) {
        if (existing.quantity + 1 > variant.quantity_on_hand) {
          setError(`Only ${variant.quantity_on_hand} unit(s) of ${variant.sku} in stock.`);
          return prev;
        }
        return prev.map((line) =>
          line.variant.id === variant.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...prev, { variant, quantity: 1 }];
    });
  }

  function changeQuantity(variantId, delta) {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.variant.id !== variantId) return line;
          const nextQty = line.quantity + delta;
          if (nextQty > line.variant.quantity_on_hand) return line;
          return { ...line, quantity: nextQty };
        })
        .filter((line) => line.quantity > 0)
    );
  }

  function pressKey(key) {
    setPaymentAmount((prev) => {
      if (key === "C") return "";
      if (key === "." && prev.includes(".")) return prev;
      return prev + key;
    });
  }

  async function completeSale() {
    setError("");
    try {
      const sale = await api.processSale(auth.token, {
        registerId: auth.registerId,
        lineItems: cart.map((line) => ({ sku: line.variant.sku, quantity: line.quantity })),
        payment: { amount: Number(paymentAmount), method: "cash" },
      });
      setReceipt(sale);
      setPhase("done");
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message);
    }
  }

  function startNewSale() {
    setCart([]);
    setPhase("shopping");
    setPaymentAmount("");
    setReceipt(null);
    setError("");
    api.listInventory(auth.token).then(setProducts).catch(() => {});
  }

  if (phase === "done" && receipt) {
    return (
      <div className="panel" style={{ margin: "0 auto" }}>
        <h2>Receipt #{receipt.id}</h2>
        <table className="table">
          <thead><tr><th>SKU</th><th>Qty</th><th>Subtotal</th></tr></thead>
          <tbody>
            {receipt.lineItems.map((li) => (
              <tr key={li.id}>
                <td>{li.sku} ({li.size}/{li.colour})</td>
                <td>{li.quantity}</td>
                <td>K{li.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="summary-row total"><span>Total</span><span>K{receipt.total_amount.toFixed(2)}</span></div>
        <div className="summary-row"><span>Paid ({receipt.payment.method})</span><span>K{receipt.payment.amount.toFixed(2)}</span></div>
        <div className="summary-row"><span>Change due</span><span>K{receipt.changeDue.toFixed(2)}</span></div>
        <button onClick={startNewSale}>Start New Sale</button>
      </div>
    );
  }

  return (
    <>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 className="section-heading">Choose Products</h2>

        <div className="item-list">
          <div className="item-list-toolbar">
            {categories.map((c) => (
              <button
                key={c}
                className={`pill ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                <span>{c}</span>
                <span></span>
              </button>
            ))}
          </div>
          {visibleProducts.length === 0 && <div className="item-row is-empty">No products in this category.</div>}
          {visibleProducts.map((v) => {
            const level = stockLevel(v.quantity_on_hand);
            return (
              <div
                key={v.id}
                className="item-row"
                onClick={() => addToCart(v)}
                style={level === "out" ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              >
                <div className="item-main">
                  <div className="name">{v.product_name}</div>
                  {v.description && <div className="description">{v.description}</div>}
                </div>
                <div className="item-meta">{v.sku}<br />{v.size} / {v.colour}</div>
                <span className={`item-stock ${level}`}>
                  {level === "out" ? "Out of stock" : level === "low" ? `${v.quantity_on_hand} left` : "In stock"}
                </span>
                <div className="item-price">${v.unit_price.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cart-column">
        <h2 className="section-heading">Current Sale</h2>
        <div className="panel">
          {cart.length === 0 && <p className="hint">Click an item to add it to the sale.</p>}
          {cart.map((line) => (
            <div className="cart-line" key={line.variant.id}>
              <div>
                <div>{line.variant.product_name}</div>
                <div className="meta">{line.variant.sku} &middot; ${line.variant.unit_price.toFixed(2)}</div>
              </div>
              <div className="qty-controls">
                <button className="ghost" onClick={() => changeQuantity(line.variant.id, -1)}>
                  <span>-</span>
                  <span></span>
                </button>
                <span>{line.quantity}</span>
                <button className="ghost" onClick={() => changeQuantity(line.variant.id, 1)}>
                  <span>+</span>
                  <span></span>
                </button>
              </div>
              <div className="name">{v.product_name}</div>
              <div className="meta">{v.sku}</div>
              <div className="meta">{v.size} / {v.colour} &middot; {v.quantity_on_hand} in stock</div>
              <div className="price">K{v.unit_price.toFixed(2)}</div>
            </div>
          ))}

      <div className="panel">
        <h2>Current Sale</h2>
        {cart.length === 0 && <p className="hint">Click a product to add it to the sale.</p>}
        {cart.map((line) => (
          <div className="cart-line" key={line.variant.id}>
            <div>
              <div>{line.variant.product_name}</div>
              <div className="meta">{line.variant.sku} &middot; K{line.variant.unit_price.toFixed(2)}</div>
            </div>
            <div className="qty-controls">
              <button className="ghost" onClick={() => changeQuantity(line.variant.id, -1)}>-</button>
              <span>{line.quantity}</span>
              <button className="ghost" onClick={() => changeQuantity(line.variant.id, 1)}>+</button>
            </div>
          </div>
        ))}

          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

        <div className="summary-row total">
          <span>Total</span>
          <span>K{total.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
}
