import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { Alert, AuthLayout, Field, PasswordInput } from "../components/AuthLayout.jsx";
import { User, Car, Check, UserPlus } from "lucide-react";

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

        <div>
          <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-neutral-300">
            Select Your Role
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update("role", "passenger")}
              className={`flex min-h-[4.25rem] w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left ${
                form.role === "passenger"
                  ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-neutral-800/50 dark:text-neutral-400"
              }`}
            >
              <User className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block text-xs leading-tight">Passenger</span>
                <span className="mt-0.5 block text-[10px] font-normal leading-tight text-slate-400 dark:text-neutral-500">
                  Book shared rides
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => update("role", "driver")}
              className={`flex min-h-[4.25rem] w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left ${
                form.role === "driver"
                  ? "border-sky-500 bg-sky-50 font-semibold text-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-neutral-800/50 dark:text-neutral-400"
              }`}
            >
              <Car className="h-4 w-4 shrink-0" />
              <span className="min-w-0">
                <span className="block text-xs leading-tight">Tesla Driver</span>
                <span className="mt-0.5 block text-[10px] font-normal leading-tight text-slate-400 dark:text-neutral-500">
                  Accept pooled rides
                </span>
              </span>
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
          <PasswordInput
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />

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
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:text-neutral-950 dark:hover:bg-emerald-400"
        >
          <UserPlus className="h-4 w-4" />
          <span>{busy ? "Creating account…" : "Create Account"}</span>
        </button>
      </form>
    </AuthLayout>
  );
}
