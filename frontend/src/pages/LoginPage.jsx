import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Alert, AuthLayout, Field } from "../components/AuthLayout.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api("/api/auth/login", { method: "POST", body: form });
      signIn(data);
      navigate("/");
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
        return;
      }
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      footer={
        <p className="footer-link">
          <Link to="/forgot-password">Forgot password?</Link>
          <br />
          New here? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit}>
        <Alert>{error}</Alert>
        <Field label="Email">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="password-toggle"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>
        <button type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="demo-credentials">
        <p>Passenger: nusrat@tesla.dhaka / Password123</p>
        <p>Driver: jashim@tesla.dhaka / Password123</p>
      </div>
    </AuthLayout>
  );
}
