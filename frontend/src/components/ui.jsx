import React from "react";

export function Card({ eyebrow, right, children, className = "", noPadding = false }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/70 text-slate-900 dark:text-neutral-100 shadow-sm transition-colors ${
        noPadding ? "" : "p-6"
      } ${className}`}
    >
      {(eyebrow || right) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {eyebrow}
            </span>
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

const STATUS_STYLES = {
  online: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40",
  offline: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  on_trip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/40",
  matched: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/40",
  driver_arrived: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/40",
  started: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/40",
  waiting: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/40",
};

export function StatusBadge({ status }) {
  const normalized = status ? status.toLowerCase() : "unknown";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
        STATUS_STYLES[normalized] || "bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
      }`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {status ? status.replace(/_/g, " ").toUpperCase() : "UNKNOWN"}
    </span>
  );
}
