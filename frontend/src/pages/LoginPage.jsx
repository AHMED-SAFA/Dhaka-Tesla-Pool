import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import {
  Alert,
  AuthLayout,
  Field,
  PasswordInput,
} from "../components/AuthLayout.jsx";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      title="Welcome back"
      subtitle="Sign in to manage your bookings, fleet trips, and ride history"
      footer={
        <div className="space-y-2">
          <div>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <div>
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Alert>{error}</Alert>

        <Field label="Email Address">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="your.email@tesla.dhaka"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </Field>

        <Field label="Password">
          <PasswordInput
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/50 px-3.5 py-3 text-xs text-slate-500 dark:text-neutral-400">
          <p className="mb-1 font-semibold text-slate-600 dark:text-neutral-300">
            Demo accounts
          </p>
          <p>Driver: jashim@tesla.dhaka · Password: Password123</p>
          <p>Passenger: nusrat@tesla.dhaka · Password: Password123</p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400"
        >
          <LogIn className="h-4 w-4" />
          <span>{busy ? "Signing in…" : "Sign In"}</span>
        </button>
      </form>
    </AuthLayout>
  );
}
