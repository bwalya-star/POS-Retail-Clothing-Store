import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function POSTerminalPage() {
  const { auth, logout } = useAuth();
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lineItems, setLineItems] = useState([]);
  const [itemError, setItemError] = useState("");
  const [phase, setPhase] = useState("scanning"); // scanning -> paying -> done
  const [paymentAmount, setPaymentAmount] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [saleError, setSaleError] = useState("");

  function addLineItem(e) {
    e.preventDefault();
    setItemError("");
    if (!sku.trim() || quantity <= 0) return;
    // Price/stock are authoritative on the server at checkout (End Sale).
    setLineItems((items) => [...items, { sku: sku.trim(), quantity: Number(quantity) }]);
    setSku("");
    setQuantity(1);
  }

  function removeLineItem(index) {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }

  async function completeSale(e) {
    e.preventDefault();
    setSaleError("");
    try {
      const sale = await api.processSale(auth.token, {
        registerId: 1,
        lineItems: lineItems.map(({ sku, quantity }) => ({ sku, quantity })),
        payment: { amount: Number(paymentAmount), method: "cash" },
      });
      setReceipt(sale);
      setPhase("done");
    } catch (err) {
      setSaleError(err.message);
    }
  }

  function startNewSale() {
    setLineItems([]);
    setPhase("scanning");
    setPaymentAmount("");
    setReceipt(null);
    setSaleError("");
  }

  return (
    <div className="page">
      <header className="topbar">
        <span>Cashier: {auth.name}</span>
        <button onClick={logout}>Logout</button>
      </header>

      <h1>POS Terminal</h1>

      {phase === "scanning" && (
        <>
          <form className="row" onSubmit={addLineItem}>
            <input placeholder="SKU (e.g. TSH-001-M-BLK)" value={sku} onChange={(e) => setSku(e.target.value)} />
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ width: 80 }}
            />
            <button type="submit">Add Item</button>
          </form>
          {itemError && <p className="error">{itemError}</p>}

          <table className="table">
            <thead>
              <tr><th>SKU</th><th>Qty</th><th></th></tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i}>
                  <td>{li.sku}</td>
                  <td>{li.quantity}</td>
                  <td><button onClick={() => removeLineItem(i)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <button disabled={lineItems.length === 0} onClick={() => setPhase("paying")}>
            End Sale
          </button>
        </>
      )}

      {phase === "paying" && (
        <form className="card" onSubmit={completeSale}>
          <h2>Payment</h2>
          <p>{lineItems.length} item(s) in this sale.</p>
          <label>
            Amount tendered
            <input
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              autoFocus
            />
          </label>
          {saleError && <p className="error">{saleError}</p>}
          <div className="row">
            <button type="button" onClick={() => setPhase("scanning")}>Back</button>
            <button type="submit">Complete Sale</button>
          </div>
        </form>
      )}

      {phase === "done" && receipt && (
        <div className="card">
          <h2>Receipt #{receipt.id}</h2>
          <table className="table">
            <thead><tr><th>SKU</th><th>Qty</th><th>Subtotal</th></tr></thead>
            <tbody>
              {receipt.lineItems.map((li) => (
                <tr key={li.id}>
                  <td>{li.sku} ({li.size}/{li.colour})</td>
                  <td>{li.quantity}</td>
                  <td>${li.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p><strong>Total: ${receipt.total_amount.toFixed(2)}</strong></p>
          <p>Paid: ${receipt.payment.amount.toFixed(2)} ({receipt.payment.method})</p>
          <p>Change due: ${receipt.changeDue.toFixed(2)}</p>
          <button onClick={startNewSale}>Start New Sale</button>
        </div>
      )}
    </div>
  );
}
