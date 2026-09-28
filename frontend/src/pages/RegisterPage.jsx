import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { Alert, AuthLayout, Field } from "../components/AuthLayout.jsx";
import { Eye, EyeOff, User, Car, Check, UserPlus } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

  const PASSWORD_RULES = [
    { test: (pw) => pw.length >= 8, label: "At least 8 characters" },
    { test: (pw) => /[a-zA-Z]/.test(pw), label: "Contains at least one letter" },
    { test: (pw) => /\d/.test(pw), label: "Contains at least one number" },
  ];

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
      subtitle="Join Dhaka's first electric pooling community"
      footer={
        <div>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Sign in
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Alert>{error}</Alert>

        {/* Role Selection */}
        <div>
          <span className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-2">
            Select Your Role
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update("role", "passenger")}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                form.role === "passenger"
                  ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold"
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/50 text-slate-600 dark:text-neutral-400 hover:border-slate-300"
              }`}
            >
              <User className="h-4 w-4 shrink-0" />
              <div>
                <span className="block text-xs">Passenger</span>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                  Book shared rides
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => update("role", "driver")}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer ${
                form.role === "driver"
                  ? "border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 font-semibold"
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/50 text-slate-600 dark:text-neutral-400 hover:border-slate-300"
              }`}
            >
              <Car className="h-4 w-4 shrink-0" />
              <div>
                <span className="block text-xs">Tesla Driver</span>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                  Accept pooled rides
                </span>
              </div>
            </button>
          </div>
        </div>

        <Field label="Full Name">
          <input
            required
            placeholder="Nusrat Jahan"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </Field>

        <Field label="Email Address">
          <input
            type="email"
            required
            placeholder="nusrat@example.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </Field>

        <Field label="Phone Number (Optional)">
          <input
            placeholder="01712345678"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
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
              onChange={(e) => update("password", e.target.value)}
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

          <div className="mt-2.5 space-y-1 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-neutral-800/30 p-2.5">
            {PASSWORD_RULES.map(({ test, label }) => {
              const met = test(form.password);
              return (
                <div
                  key={label}
                  className={`flex items-center gap-1.5 text-[11px] ${
                    met
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-slate-400 dark:text-neutral-500"
                  }`}
                >
                  <Check className="h-3 w-3" />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-neutral-950 py-3 text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>{busy ? "Creating account…" : "Create Account"}</span>
        </button>
      </form>
    </AuthLayout>
  );
}
