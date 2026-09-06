import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter both your email and password.");
      return;
    }
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
    <div className="login-shell">
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div className="login-grid">
        <div className="login-info">
          <div className="login-brand-row">
            <Logo size={26} />
            <span>Retail POS</span>
          </div>
          <h1 className="login-heading">Open the register.</h1>
          <p className="login-tagline">
            Sign in with your store account to run sales, restock inventory and manage the floor.
          </p>
        </div>

        <form className="card login-card" onSubmit={handleSubmit}>
          <div className="login-card-head">
            <h2>Sign in</h2>
            <p>Use your employee email and password.</p>
          </div>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@example.com"
              autoComplete="username"
              autoFocus
            />
          </label>

          <label>
            Password
            <span className="field-password">
              <input
                type={reveal ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="field-reveal"
                onClick={() => setReveal((r) => !r)}
              >
                <span>{reveal ? "Hide" : "Show"}</span>
                <span></span>
              </button>
            </span>
          </label>

          {error && (
            <div className="alert alert-error">
              <span className="alert-dot" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={submitting} className="login-submit">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              {submitting && <span className="spinner" />}
              {submitting ? "Signing in…" : "Sign in"}
            </span>
            <span></span>
          </button>

        </form>
      </div>
    </div>
  );
}
