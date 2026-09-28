import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import RideMap from "./RideMap.jsx";
import { Card, StatusBadge } from "./ui.jsx";
import {
  Zap,
  Car,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Star,
  Power,
  Navigation,
  Check,
  XCircle,
  Receipt,
  UserCheck,
} from "lucide-react";

export default function DriverDashboard({ user, section = "overview" }) {
  const [tesla, setTesla] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [queue, setQueue] = useState({ requests: [], remainingSeats: 3 });

  const [togglingStatus, setTogglingStatus] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [history, setHistory] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const queueFetchSeq = useRef(0);

  const fetchTesla = async () => {
    try {
      const data = await api("/api/drivers/tesla", { auth: true });
      setTesla(data.tesla);
    } catch (e) {
      console.error("Failed to load Tesla Profile", e);
    }
  };

  const fetchRideAndQueue = async () => {
    const seq = ++queueFetchSeq.current;
    try {
      const [rideData, queueData] = await Promise.all([
        api("/api/drivers/active-ride", { auth: true }),
        api("/api/drivers/available-requests", { auth: true }),
      ]);
      if (seq !== queueFetchSeq.current) return;
      setActiveRide(rideData.activeRide || null);
      setQueue({
        ...queueData,
        requests: queueData.requests || [],
      });
    } catch (e) {
      if (seq !== queueFetchSeq.current) return;
      console.error("Polling error", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await api("/api/drivers/history", { auth: true });
      setHistory(data.history || []);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const fetchFeedbackStats = async () => {
    try {
      const data = await api("/api/feedback/driver", { auth: true });
      setFeedbackStats(data.stats || null);
    } catch (e) {
      console.error("Failed to fetch driver feedback stats", e);
    }
  };

  useEffect(() => {
    fetchTesla();
    fetchRideAndQueue();
    fetchHistory();
    fetchFeedbackStats();
    const interval = setInterval(fetchRideAndQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleToggleStatus() {
    if (!tesla) return;
    setTogglingStatus(true);
    setErrorMsg("");
    setSuccessMsg("");
    const nextStatus = tesla.ops_status === "online" ? "offline" : "online";
    try {
      const res = await api("/api/drivers/status", {
        method: "POST",
        auth: true,
        body: { status: nextStatus },
      });
      setTesla(res.tesla);
      setSuccessMsg(`Status updated: You are now ${nextStatus.toUpperCase()}`);
      await fetchRideAndQueue();
    } catch (e) {
      setErrorMsg(e.message || "Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleAccept(requestId) {
    setAcceptingId(requestId);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api("/api/drivers/rides/accept", {
        method: "POST",
        auth: true,
        body: { requestId },
      });
      setSuccessMsg(res.message || "Passenger added to pool!");
      await fetchRideAndQueue();
      await fetchTesla();
    } catch (e) {
      setErrorMsg(e.message || "Failed to accept ride");
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleTransition(action) {
    setTransitioning(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api("/api/drivers/rides/transition", {
        method: "POST",
        auth: true,
        body: { action },
      });
      setSuccessMsg(res.message);
      await fetchRideAndQueue();
      await fetchTesla();
      await fetchHistory();
    } catch (e) {
      setErrorMsg(e.message || "Action failed");
    } finally {
      setTransitioning(false);
    }
  }

  const remainingCapacity = tesla
    ? activeRide
      ? Math.max(0, tesla.capacity - activeRide.occupied_seats)
      : tesla.capacity
    : 0;

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {section === "overview" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Tesla Vehicle Profile Card */}
          {tesla && (
            <Card
              eyebrow="Assigned Vehicle"
              right={<StatusBadge status={tesla.ops_status} />}
              className="lg:col-span-5"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400">
                    <Zap className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {tesla.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Total Capacity:{" "}
                      <strong className="text-slate-800 dark:text-neutral-200 font-bold">
                        {tesla.capacity} seats
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/40 p-3.5 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-neutral-400">
                    Operational Status
                  </span>
                  <span
                    className={`font-bold capitalize ${
                      tesla.ops_status === "online"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : tesla.ops_status === "on_trip"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-500 dark:text-neutral-400"
                    }`}
                  >
                    ● {tesla.ops_status.replace("_", " ")}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={togglingStatus || tesla.ops_status === "on_trip"}
                  onClick={handleToggleStatus}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
                    tesla.ops_status === "online"
                      ? "border border-slate-300 dark:border-white/15 bg-white dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-700"
                      : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-neutral-950"
                  }`}
                >
                  <Power className="h-4 w-4" />
                  <span>
                    {togglingStatus
                      ? "Updating…"
                      : tesla.ops_status === "online"
                        ? "Go Offline"
                        : "Go Online"}
                  </span>
                </button>

                {tesla.ops_status === "on_trip" && (
                  <p className="text-center text-[11px] text-slate-500 dark:text-neutral-400">
                    Currently on trip. Complete the ride before toggling status.
                  </p>
                )}

                {/* Rating & Complaint Stats */}
                {feedbackStats && (
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-500">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>
                        {feedbackStats.avgRating ? `${feedbackStats.avgRating} / 5.0` : "5.0 / 5.0"}
                      </span>
                      <span className="text-slate-400 dark:text-neutral-500 font-normal">
                        ({feedbackStats.totalRatings} ratings)
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${
                        feedbackStats.totalComplaints > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-400 dark:text-neutral-500"
                      }`}
                    >
                      {feedbackStats.totalComplaints} complaint{feedbackStats.totalComplaints === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Live Ride Requests Queue */}
          <Card
            className="lg:col-span-7"
            eyebrow="Live Available Requests"
            right={
              <span className="rounded-full bg-slate-100 dark:bg-neutral-800 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-neutral-300">
                {remainingCapacity} seat(s) remaining
              </span>
            }
          >
            {tesla?.ops_status === "offline" ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-neutral-400 space-y-2">
                <p>You are currently offline.</p>
                <p className="text-xs text-slate-400 dark:text-neutral-500">
                  Switch to "Go Online" above to receive incoming passenger requests.
                </p>
              </div>
            ) : queue.requests.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-neutral-400 space-y-2">
                <p>No waiting ride requests right now.</p>
                <p className="text-xs text-slate-400 dark:text-neutral-500">
                  Radar is scanning for passengers along your corridor…
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.requests.map((req) => {
                  const canFit = req.seats <= remainingCapacity;
                  return (
                    <div
                      key={req.id}
                      className={`rounded-2xl border p-4 transition-colors ${
                        req.isCompatible && activeRide
                          ? "border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20"
                          : "border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-neutral-800/40"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <strong className="text-sm font-bold text-slate-900 dark:text-white">
                            {req.pickup_zone_name} → {req.dropoff_zone_name}
                          </strong>
                        </div>
                        {req.isCompatible && activeRide && (
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                            Shared Corridor
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-neutral-400">
                        <span>
                          Passenger: <strong className="text-slate-800 dark:text-neutral-200">{req.passenger_name}</strong> ·{" "}
                          {req.seats} {req.seats > 1 ? "seats" : "seat"}
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {(req.estimated_fare_paisa / 100).toFixed(2)} BDT
                        </span>
                      </div>

                      <div className="mt-1 text-[11px] text-slate-400 dark:text-neutral-500">
                        Joining: {req.pickup_zone_name} ({Number(req.pickup_lat).toFixed(3)}, {Number(req.pickup_lng).toFixed(3)})
                      </div>

                      <div className="mt-3">
                        {canFit ? (
                          <button
                            type="button"
                            disabled={acceptingId === req.id}
                            onClick={() => handleAccept(req.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-white dark:text-neutral-950 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>
                              {acceptingId === req.id
                                ? "Accepting…"
                                : activeRide
                                  ? "+ Add to Pool"
                                  : "Accept Ride"}
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-neutral-500">
                            Exceeds capacity ({req.seats} seats needed, {remainingCapacity} left)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Active Pool & Trip Lifecycle */}
          {activeRide ? (
            <Card
              eyebrow="Active Shared Pool & Navigation"
              right={<StatusBadge status={activeRide.status} />}
              className="lg:col-span-12"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <strong className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Route Navigation
                  </strong>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                  {activeRide.status === "started"
                    ? "Trip in progress"
                    : activeRide.status === "driver_arrived"
                      ? "Arrived at pickup location"
                      : "Heading to passenger pickup point"}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                <RideMap
                  mode="driver-navigation"
                  height="300px"
                  passengers={activeRide.passengers || []}
                  activeRideStatus={activeRide.status}
                />
              </div>

              {/* Occupancy Bar */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-neutral-400">
                    Vehicle Pool Occupancy
                  </span>
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {activeRide.occupied_seats} / {activeRide.tesla_capacity} seats filled ({remainingCapacity} available)
                  </strong>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (activeRide.occupied_seats / activeRide.tesla_capacity) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Passengers List */}
              <h4 className="mt-6 mb-3 text-sm font-bold text-slate-900 dark:text-white">
                Passengers in Pool ({activeRide.passengers?.length || 0})
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeRide.passengers?.map((p) => (
                  <div
                    key={p.ride_passenger_id}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/40 p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-sm font-bold text-slate-900 dark:text-white">
                        {p.passenger_name}
                      </strong>
                      <span className="rounded-full bg-slate-200 dark:bg-neutral-700 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-neutral-200">
                        {p.seats} seat(s)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      {p.pickup_zone_name} → {p.dropoff_zone_name}
                    </p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {(p.fare_paisa / 100).toFixed(2)} BDT
                    </p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                {activeRide.status === "matched" && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleTransition("arrive")}
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Mark Driver Arrived
                  </button>
                )}
                {activeRide.status === "driver_arrived" && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleTransition("start")}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-neutral-950 px-5 py-2.5 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Start Trip
                  </button>
                )}
                {activeRide.status === "started" && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleTransition("complete")}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-neutral-950 px-5 py-2.5 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Complete Trip & Settle Fares
                  </button>
                )}
                {["matched", "driver_arrived"].includes(activeRide.status) && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleTransition("cancel")}
                    className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-5 py-2.5 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel Trip
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <Card eyebrow="Active Pool Status" className="lg:col-span-12">
              <p className="text-sm text-slate-500 dark:text-neutral-400 py-4 text-center">
                No active trip in progress. When you accept requests, your live shared pool will appear here.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* History & Earnings Section */}
      {section === "history" && (
        <Card eyebrow="Driver Trip & Earnings Log">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-neutral-400 py-6 text-center">
              No completed trips recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((h) => {
                const allPaid = h.payment_status === "paid";
                const somePaid = h.payment_status === "partial";
                const isCompleted = h.status === "completed";
                const paymentDue = isCompleted && !allPaid;

                return (
                  <div
                    key={h.id}
                    className={`rounded-2xl border p-5 transition-colors ${
                      paymentDue && !somePaid
                        ? "border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20"
                        : "border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-neutral-800/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-base font-bold text-slate-900 dark:text-white">
                        ⚡ {h.tesla_name}
                      </strong>
                      <div className="flex items-center gap-2">
                        {allPaid && isCompleted ? (
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                            EARNED
                          </span>
                        ) : paymentDue ? (
                          <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/50 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-400">
                            {somePaid ? "PARTIAL SETTLEMENT" : "FARE DUE"}
                          </span>
                        ) : (
                          <StatusBadge status={h.status} />
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-neutral-400">
                      <span>{h.passenger_count} passenger(s) carried</span>
                      <span
                        className={`text-sm font-bold ${
                          allPaid && isCompleted
                            ? "text-emerald-600 dark:text-emerald-400"
                            : paymentDue
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-slate-800 dark:text-neutral-200"
                        }`}
                      >
                        {allPaid && isCompleted ? "Earned: " : paymentDue ? "Due: " : "Fare: "}
                        {allPaid ? h.total_paid_bdt : h.total_fare_bdt} BDT
                      </span>
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400 dark:text-neutral-500">
                      Trip completed on {new Date(h.created_at).toLocaleDateString()} at{" "}
                      {new Date(h.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    {/* Passenger Reviews & Feedback */}
                    {h.feedbacks && h.feedbacks.length > 0 && (
                      <div className="mt-4 border-t border-slate-200 dark:border-white/10 pt-3 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                          Passenger Reviews ({h.feedbacks.length}):
                        </span>
                        {h.feedbacks.map((fb, idx) => (
                          <div
                            key={fb.id || idx}
                            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-800/80 p-3 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {fb.rating ? (
                                  <span className="font-bold text-amber-500">
                                    {"★".repeat(fb.rating)}
                                    {"☆".repeat(5 - fb.rating)}{" "}
                                    <span className="text-slate-500 dark:text-neutral-400">
                                      ({fb.rating}/5)
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400">No star rating</span>
                                )}
                              </div>
                              {fb.created_at && (
                                <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                                  {new Date(fb.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {fb.complaint && (
                              <p className="mt-2 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/25 p-2 text-slate-700 dark:text-neutral-300 italic">
                                “{fb.complaint}”
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
