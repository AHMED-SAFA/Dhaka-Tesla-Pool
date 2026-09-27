import { useState } from "react";
import { api } from "../api.js";

const QUICK_TAGS = [
  "Smooth & safe drive",
  "Polite & professional",
  "Clean & comfortable Tesla",
  "AC was insufficient",
  "Driver was delayed",
  "Navigation issue",
];

export default function FeedbackModal({ target, onClose, onSaved }) {
  const [rating, setRating] = useState(target?.initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [complaint, setComplaint] = useState(target?.initialComplaint || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!target) return null;

  const currentStar = hoverRating || rating;

  const starLabels = {
    0: "Tap a star to rate (optional)",
    1: "1 Star · Poor",
    2: "2 Stars · Fair",
    3: "3 Stars · Good",
    4: "4 Stars · Great",
    5: "5 Stars · Outstanding Experience",
  };

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await api("/api/feedback", {
        method: "POST",
        auth: true,
        body: {
          requestId: target.requestId,
          rating: rating > 0 ? rating : null,
          complaint: complaint.trim() || null,
        },
      });

      onSaved?.(res.feedback);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit feedback.");
      setSubmitting(false);
    }
  }

  function toggleQuickTag(tag) {
    setComplaint((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) {
        return trimmed
          .replace(new RegExp(`,?\\s*${tag}\\.?`, "i"), "")
          .replace(/^[,\s]+|[,\s]+$/g, "");
      }
      return `${trimmed}, ${tag}`;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900/95 p-6 shadow-2xl ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                {target.isPostPayment ? "PAYMENT COMPLETED" : "TRIP FEEDBACK"}
              </span>
              {target.driverName && (
                <span className="text-xs text-neutral-400">
                  with {target.driverName}
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-lg font-semibold text-neutral-100">
              {target.isPostPayment
                ? "How was your Tesla ride?"
                : "Rate & Share Trip Experience"}
            </h3>
            {(target.pickupZoneName || target.dropoffZoneName) && (
              <p className="mt-0.5 text-xs text-neutral-400">
                {target.pickupZoneName} → {target.dropoffZoneName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Star Rating Section */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Driver & Ride Rating (Optional)
            </label>
            <div className="mt-2.5 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = currentStar >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setRating((prev) => (prev === star ? 0 : star))
                    }
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    title={`${star} Star`}
                  >
                    <svg
                      className={`h-9 w-9 transition-colors ${
                        isLit
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                          : "fill-neutral-900 text-neutral-600 hover:text-neutral-400"
                      }`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xs font-medium text-neutral-300">
                {starLabels[currentStar]}
              </span>
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="text-xs text-neutral-500 underline hover:text-neutral-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Complaint / Comment Section */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="complaint-input"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-400"
              >
                Complaints or Suggestions (Optional)
              </label>
              <span className="text-xs text-neutral-500">
                {complaint.length}/2000
              </span>
            </div>
            <textarea
              id="complaint-input"
              rows={3}
              maxLength={2000}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Report any issues with AC, driver conduct, delay, or share compliments..."
              className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
            />

            {/* Quick suggestion tags */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const isSelected = complaint.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleQuickTag(tag)}
                    className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                      isSelected
                        ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                        : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200 border border-white/5"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons: Skip & Submit */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {target.isPostPayment ? "Skip for now" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-lg shadow-emerald-400/10 transition-colors hover:bg-emerald-300 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
