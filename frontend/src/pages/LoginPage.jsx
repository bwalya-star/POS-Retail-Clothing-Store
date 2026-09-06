import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page centered">
      <form className="card" onSubmit={handleSubmit}>
        <h1>POS Retail Clothing Store</h1>
        <p className="subtitle">Sign in to continue</p>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Login"}
        </button>

        <p className="hint">
          Demo accounts: grace.mulenga@pos.local/cashier123, brian.phiri@pos.local/manager123,
          dorn.banda@pos.local/superadmin123
        </p>
      </form>
    </div>
  );
}
