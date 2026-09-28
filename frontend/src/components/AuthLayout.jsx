import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Sun, Moon, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useThemeMode } from "../ThemeModeContext.jsx";

const inputClassName =
  "w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors";

export function AuthLayout({ title, subtitle, children, footer }) {
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d0b] text-slate-900 dark:text-neutral-100 transition-colors">
      {/* Top Bar */}
      <header className="border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#090d0b]/90 backdrop-blur-md px-6 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-bold">
              <Zap className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-sm text-slate-900 dark:text-white leading-tight">
                Dhaka Tesla Pool
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-neutral-400">
                100% Electric Urban Fleet
              </span>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>

            <Link
              to="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-900/90 p-8 shadow-xl">
            <div className="mb-6 space-y-1">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Urban Pooling Portal
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-600 dark:text-neutral-400">
                  {subtitle}
                </p>
              )}
            </div>

            {children}

            {footer && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10 text-center text-xs text-slate-600 dark:text-neutral-400">
                {footer}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-neutral-600">
        © {new Date().getFullYear()} Dhaka Tesla Pool · Secure Authentication
      </footer>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-500">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </span>
      )}
    </label>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-medium text-rose-700 dark:text-rose-400">
      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

export function Success({ children }) {
  if (!children) return null;
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-medium text-emerald-800 dark:text-emerald-300">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  required = false,
  minLength,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${inputClassName} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 z-10 inline-flex w-11 items-center justify-center rounded-r-xl bg-transparent p-0 text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200"
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
