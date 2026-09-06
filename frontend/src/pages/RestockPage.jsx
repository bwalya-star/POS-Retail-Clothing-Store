import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { roleLabel } from "../roleLabels";

export default function RestockPage({ hideHeader = false }) {
  const { auth, logout } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadInventory() {
    const items = await api.listInventory(auth.token);
    setInventory(items);
  }

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRestock(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const updated = await api.restock(auth.token, sku.trim(), Number(quantity));
      setMessage(`${updated.sku} is now at ${updated.quantity_on_hand} unit(s).`);
      setSku("");
      setQuantity(1);
      loadInventory();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      {!hideHeader && (
        <header className="topbar">
          <span>{roleLabel(auth.role)}: {auth.name}</span>
          <button onClick={logout}>Logout</button>
        </header>
      )}

      <h1>Restock Inventory</h1>

      <form className="row" onSubmit={handleRestock}>
        <input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={{ width: 80 }}
        />
        <button type="submit">Restock</button>
      </form>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <h2>Current Stock</h2>
      <table className="table">
        <thead>
          <tr><th>SKU</th><th>Product</th><th>Size</th><th>Colour</th><th>Qty on Hand</th></tr>
        </thead>
        <tbody>
          {inventory.map((v) => (
            <tr key={v.id}>
              <td>{v.sku}</td>
              <td>{v.product_name}</td>
              <td>{v.size}</td>
              <td>{v.colour}</td>
              <td>{v.quantity_on_hand}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
