export function Card({ eyebrow, right, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-white/5 bg-neutral-900/40 p-6 ${className}`}
    >
      {(eyebrow || right) && (
        <div className="mb-4 flex items-center justify-between">
          {eyebrow && (
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
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
  online: "bg-emerald-400/10 text-emerald-400",
  offline: "bg-neutral-500/10 text-neutral-400",
  on_trip: "bg-amber-400/10 text-amber-400",
  matched: "bg-sky-400/10 text-sky-400",
  driver_arrived: "bg-amber-400/10 text-amber-400",
  started: "bg-emerald-400/10 text-emerald-400",
  completed: "bg-emerald-400/10 text-emerald-400",
  cancelled: "bg-red-400/10 text-red-400",
  waiting: "bg-sky-400/10 text-sky-400",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium tracking-wide ${
        STATUS_STYLES[status] || "bg-neutral-500/10 text-neutral-400"
      }`}
    >
      {status?.replace("_", " ").toUpperCase()}
    </span>
  );
}
