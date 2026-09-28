import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Alert, AuthLayout, Field } from "../components/AuthLayout.jsx";
import { Eye, EyeOff, Users, Car, LogIn } from "lucide-react";

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

  const fillCredentials = (email, password) => {
    setForm({ email, password });
  };

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
            placeholder="your.email@tesla.dhaka"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-neutral-950 py-3 text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
        >
          <LogIn className="h-4 w-4" />
          <span>{busy ? "Signing in…" : "Sign In"}</span>
        </button>
      </form>

      {/* Quick Demo Fill Buttons */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/10">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2">
          Click to auto-fill demo credentials:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              fillCredentials("nusrat@tesla.dhaka", "Password123")
            }
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-neutral-800 p-2 text-left text-xs font-medium text-slate-700 dark:text-neutral-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <Users className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <div className="truncate">
              <span className="block font-semibold">Passenger</span>
              <span className="text-[10px] text-slate-400">Nusrat</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() =>
              fillCredentials("jashim@tesla.dhaka", "Password123")
            }
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-neutral-800 p-2 text-left text-xs font-medium text-slate-700 dark:text-neutral-300 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
          >
            <Car className="h-3.5 w-3.5 shrink-0 text-sky-500" />
            <div className="truncate">
              <span className="block font-semibold">Driver</span>
              <span className="text-[10px] text-slate-400">Jashim</span>
            </div>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
