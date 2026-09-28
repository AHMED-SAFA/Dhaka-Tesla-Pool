import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Card } from "./ui.jsx";
import { User, CheckCircle2, AlertCircle, Save } from "lucide-react";

export default function ProfilePage({ user, updateUser }) {
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    email: user.email || "",
    role: user.role || "",
    phone: user.phone || "",
    nid: user.nid || "",
    dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "",
    address: user.address || "",
    teslaNumber: user.teslaNumber || "",
  });
  const [status, setStatus] = useState({ error: "", success: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "",
      phone: user.phone || "",
      nid: user.nid || "",
      dateOfBirth: user.dateOfBirth
        ? String(user.dateOfBirth).slice(0, 10)
        : "",
      address: user.address || "",
      teslaNumber: user.teslaNumber || "",
    }));
  }, [user]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setStatus({ error: "", success: "" });
    setBusy(true);
    try {
      const data = await api("/api/auth/profile", {
        method: "PATCH",
        auth: true,
        body: {
          fullName: form.fullName,
          phone: form.phone,
          nid: form.nid,
          dateOfBirth: form.dateOfBirth,
          address: form.address,
          ...(user.role === "driver" ? { teslaNumber: form.teslaNumber } : {}),
        },
      });
      updateUser(data.user);
      setStatus({ error: "", success: data.message });
    } catch (error) {
      setStatus({ error: error.message, success: "" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Account Settings
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Your Profile & Credentials
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Manage your contact information, national ID, and vehicle specifications.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          {status.error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{status.error}</span>
            </div>
          )}
          {status.success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{status.success}</span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField
              label="Full Name"
              value={form.fullName}
              onChange={(value) => update("fullName", value)}
              required
            />
            <ProfileField
              label="Phone Number"
              value={form.phone}
              onChange={(value) => update("phone", value)}
              placeholder="01XXXXXXXXX"
            />
            <ProfileField
              label="Registered Email"
              value={form.email}
              disabled
              hint="Email address cannot be changed."
            />
            <ProfileField
              label="Password"
              value="••••••••"
              disabled
              hint="Managed securely via Password Reset."
            />
            <ProfileField label="Account Role" value={form.role.toUpperCase()} disabled />
            <ProfileField
              label="National ID (NID)"
              value={form.nid}
              onChange={(value) => update("nid", value)}
              placeholder="NID Number"
            />
            <ProfileField
              label="Date of Birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(value) => update("dateOfBirth", value)}
            />
            {user.role === "driver" && (
              <ProfileField
                label="Tesla Plate / Registration Number"
                value={form.teslaNumber}
                onChange={(value) => update("teslaNumber", value)}
                placeholder="DHK-METRO-GA-1234"
              />
            )}
          </div>

          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
            Current Address
            <textarea
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
              rows={3}
              placeholder="House, Road, Area, Dhaka"
              className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 px-6 py-2.5 text-sm font-bold text-white dark:text-neutral-950 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{busy ? "Saving…" : "Save Changes"}</span>
          </button>
        </form>
      </Card>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  required = false,
  placeholder,
  hint,
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      />
      {hint && (
        <span className="mt-1 block text-[11px] text-slate-400 dark:text-neutral-500">
          {hint}
        </span>
      )}
    </label>
  );
}
