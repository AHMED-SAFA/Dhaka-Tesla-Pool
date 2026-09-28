import { useState } from "react";
import { api } from "../api.js";
import { X, Star, MessageSquare } from "lucide-react";

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
    1: "1 Star · Poor Experience",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-neutral-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {target.isPostPayment ? "PAYMENT SUCCESSFUL" : "TRIP FEEDBACK"}
              </span>
              {target.driverName && (
                <span className="text-xs text-slate-500 dark:text-neutral-400">
                  Driver: {target.driverName}
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">
              {target.isPostPayment
                ? "How was your Tesla ride?"
                : "Rate Driver & Ride Experience"}
            </h3>
            {(target.pickupZoneName || target.dropoffZoneName) && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
                {target.pickupZoneName} → {target.dropoffZoneName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-700 dark:hover:text-neutral-200 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Star Rating Section */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-neutral-800/40 p-4 text-center">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Trip Star Rating
            </label>
            <div className="mt-3 flex items-center justify-center gap-2">
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
                    className="p-1 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                    title={`${star} Star`}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        isLit
                          ? "fill-amber-400 text-amber-400"
                          : "fill-transparent text-slate-300 dark:text-neutral-600 hover:text-amber-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-neutral-300">
                {starLabels[currentStar]}
              </span>
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Complaint / Comment Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="complaint-input"
                className="block text-xs font-semibold text-slate-700 dark:text-neutral-300"
              >
                Complaints or Suggestions (Optional)
              </label>
              <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                {complaint.length}/2000
              </span>
            </div>
            <textarea
              id="complaint-input"
              rows={3}
              maxLength={2000}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Tell us about AC performance, punctuality, driver courtesy, or compliments..."
              className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none transition-colors"
            />

            {/* Quick suggestion tags */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const isSelected = complaint.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleQuickTag(tag)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-neutral-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {target.isPostPayment ? "Skip for now" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-white dark:text-neutral-950 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
