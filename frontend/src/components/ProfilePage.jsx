import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Card } from "./ui.jsx";

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
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
          Account
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Your profile</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Keep your ride details current.
        </p>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          {status.error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">
              {status.error}
            </div>
          )}
          {status.success && (
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-400">
              {status.success}
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField
              label="Full name"
              value={form.fullName}
              onChange={(value) => update("fullName", value)}
              required
            />
            <ProfileField
              label="Phone"
              value={form.phone}
              onChange={(value) => update("phone", value)}
              placeholder="01XXXXXXXXX"
            />
            <ProfileField
              label="Email"
              value={form.email}
              disabled
              hint="Email cannot be changed."
            />
            <ProfileField
              label="Password"
              value="••••••••"
              disabled
              hint="Password is managed through reset password."
            />
            <ProfileField label="Role" value={form.role} disabled />
            <ProfileField
              label="NID"
              value={form.nid}
              onChange={(value) => update("nid", value)}
            />
            <ProfileField
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(value) => update("dateOfBirth", value)}
            />
            {user.role === "driver" && (
              <ProfileField
                label="Tesla number"
                value={form.teslaNumber}
                onChange={(value) => update("teslaNumber", value)}
              />
            )}
          </div>
          <label className="block text-sm text-neutral-300">
            Address
            <textarea
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-400/60"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {busy ? "Saving…" : "Save profile"}
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
    <label className="block text-sm text-neutral-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {hint && (
        <span className="mt-1 block text-xs text-neutral-500">{hint}</span>
      )}
    </label>
  );
}
