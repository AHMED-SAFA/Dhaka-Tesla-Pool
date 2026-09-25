import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { Alert, AuthLayout, Field } from "../components/AuthLayout.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "passenger",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const PASSWORD_RULES = [
    { test: (pw) => pw.length >= 8, label: "At least 8 characters" },
    { test: (pw) => /[a-zA-Z]/.test(pw), label: "At least one letter" },
    { test: (pw) => /\d/.test(pw), label: "At least one number" },
  ];
  const passwordValid = (pw) => PASSWORD_RULES.every((r) => r.test(pw));
  const [showPassword, setShowPassword] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: {
          ...form,
          phone: form.phone || undefined,
        },
      });
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Passengers request rides. Drivers drive them."
      footer={
        <p className="footer-link">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit}>
        <Alert>{error}</Alert>
        <Field label="Full name">
          <input
            required
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            placeholder="01XXXXXXXXX"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </Field>
        <Field label="Password">
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
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
          <ul
            style={{
              listStyle: "none",
              margin: "8px 0 0",
              padding: 0,
              fontSize: 12,
            }}
          >
            {PASSWORD_RULES.map(({ test, label }) => {
              const met = test(form.password);
              return (
                <li key={label} style={{ color: met ? "#16a34a" : "#94a3b8" }}>
                  {met ? "✓" : "•"} {label}
                </li>
              );
            })}
          </ul>
        </Field>
        <fieldset className="roles">
          <legend>I am a</legend>
          <label>
            <input
              type="radio"
              name="role"
              checked={form.role === "passenger"}
              onChange={() => update("role", "passenger")}
            />
            Passenger
          </label>
          <label>
            <input
              type="radio"
              name="role"
              checked={form.role === "driver"}
              onChange={() => update("role", "driver")}
            />
            Driver
          </label>
        </fieldset>
        <button type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
