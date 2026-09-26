import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import RideMap from "./RideMap.jsx";
import { Card, StatusBadge } from "./ui.jsx";

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

  useEffect(() => {
    fetchTesla();
    fetchRideAndQueue();
    fetchHistory();
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
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-400">
          {successMsg}
        </div>
      )}

      {section === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {tesla && (
            <Card
              eyebrow="Your Tesla Vehicle"
              right={<StatusBadge status={tesla.ops_status} />}
            >
              <h2 className="text-lg font-semibold">⚡ {tesla.name}</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Fixed vehicle capacity:{" "}
                <strong className="text-neutral-200">
                  {tesla.capacity} seats
                </strong>
              </p>
              <button
                type="button"
                disabled={togglingStatus || tesla.ops_status === "on_trip"}
                onClick={handleToggleStatus}
                className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  tesla.ops_status === "online"
                    ? "border border-white/10 text-neutral-200 hover:border-white/20 hover:bg-white/5"
                    : "bg-emerald-400 text-neutral-950 hover:bg-emerald-300"
                }`}
              >
                {togglingStatus
                  ? "Updating…"
                  : tesla.ops_status === "online"
                    ? "Go Offline"
                    : "Go Online"}
              </button>
              {tesla.ops_status === "on_trip" && (
                <p className="mt-2 text-xs text-neutral-500">
                  Currently on trip. Complete the ride to change status.
                </p>
              )}
            </Card>
          )}

          <Card
            className="lg:col-span-2"
            eyebrow="Live Ride Requests"
            right={
              <span className="text-xs text-neutral-500">
                {remainingCapacity} seat(s) available
              </span>
            }
          >
            {tesla?.ops_status === "offline" ? (
              <p className="text-sm text-neutral-500">
                You're currently offline. Go online from the Overview tab to see
                waiting passengers.
              </p>
            ) : queue.requests.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No waiting ride requests right now. Looking for passengers…
              </p>
            ) : (
              <div className="space-y-3">
                {queue.requests.map((req) => {
                  const canFit = req.seats <= remainingCapacity;
                  return (
                    <div
                      key={req.id}
                      className={`rounded-xl border p-4 ${
                        req.isCompatible && activeRide
                          ? "border-emerald-400/20 bg-emerald-400/[0.03]"
                          : "border-white/5 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm">
                          {req.pickup_zone_name} → {req.dropoff_zone_name}
                        </strong>
                        {req.isCompatible && activeRide && (
                          <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-400">
                            Shared route
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-400">
                        <span>
                          {req.passenger_name} · {req.seats}{" "}
                          {req.seats > 1 ? "seats" : "seat"}
                        </span>
                        <span className="font-medium text-emerald-400">
                          {(req.estimated_fare_paisa / 100).toFixed(2)} BDT
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        Joining at {req.pickup_zone_name} (
                        {Number(req.pickup_lat).toFixed(3)},{" "}
                        {Number(req.pickup_lng).toFixed(3)})
                      </div>
                      <div className="mt-3">
                        {canFit ? (
                          <button
                            type="button"
                            disabled={acceptingId === req.id}
                            onClick={() => handleAccept(req.id)}
                            className="rounded-lg bg-emerald-400 px-4 py-1.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
                          >
                            {acceptingId === req.id
                              ? "Accepting…"
                              : activeRide
                                ? "+ Add to Pool"
                                : "Accept Ride"}
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-600">
                            Exceeds capacity — needs {req.seats} seats,{" "}
                            {remainingCapacity} left
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {activeRide ? (
            <Card
              eyebrow="Active Pool & Trip"
              right={<StatusBadge status={activeRide.status} />}
              className="lg:col-span-2"
            >
              <div className="mb-4 flex items-center justify-between">
                <strong className="text-sm text-neutral-300">
                  Route Navigation
                </strong>
                <span className="text-xs text-neutral-500">
                  {activeRide.status === "started"
                    ? "In progress"
                    : activeRide.status === "driver_arrived"
                      ? "Arrived at pickup"
                      : "Heading to joining spot"}
                </span>
              </div>
              <RideMap
                mode="driver-navigation"
                height="280px"
                passengers={activeRide.passengers || []}
                activeRideStatus={activeRide.status}
              />

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Occupancy</span>
                  <strong className="text-neutral-200">
                    {activeRide.occupied_seats} / {activeRide.tesla_capacity}{" "}
                    seats · {remainingCapacity} free
                  </strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{
                      width: `${Math.min(100, (activeRide.occupied_seats / activeRide.tesla_capacity) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <h4 className="mt-6 mb-3 text-sm font-medium text-neutral-300">
                Passengers in this pool ({activeRide.passengers?.length || 0})
              </h4>
              <div className="space-y-3">
                {activeRide.passengers?.map((p) => (
                  <div
                    key={p.ride_passenger_id}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-sm">{p.passenger_name}</strong>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-neutral-400">
                        {p.seats} seat(s)
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-neutral-400">
                      <span>
                        Joining at{" "}
                        <strong className="text-neutral-200">
                          {p.pickup_zone_name}
                        </strong>
                      </span>
                      <span className="text-neutral-600">→</span>
                      <span>
                        Drop-off{" "}
                        <strong className="text-neutral-200">
                          {p.dropoff_zone_name}
                        </strong>
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Lat {Number(p.pickup_lat).toFixed(4)}, Lng{" "}
                      {Number(p.pickup_lng).toFixed(4)}
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-emerald-400">
                      {(p.fare_paisa / 100).toFixed(2)} BDT
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {activeRide.status === "matched" && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleTransition("arrive")}
                    className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
                  >
                    Mark Driver Arrived
                  </button>
                )}
                {activeRide.status === "driver_arrived" && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleTransition("start")}
                    className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
                  >
                    Start Trip
                  </button>
                )}
                {activeRide.status === "started" && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleTransition("complete")}
                    className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
                  >
                    Complete Trip & Settle Fares
                  </button>
                )}
                {["matched", "driver_arrived"].includes(activeRide.status) && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleTransition("cancel")}
                    className="rounded-lg border border-red-400/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/5 disabled:opacity-50"
                  >
                    Cancel Trip
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <Card eyebrow="Active Pool" className="lg:col-span-2">
              <p className="text-sm text-neutral-500">
                No active ride right now. When you accept ride requests, your
                shared pool will appear here.
              </p>
            </Card>
          )}
        </div>
      )}

      {section === "history" && (
        <Card eyebrow="Driver Trip History">
          {history.length === 0 ? (
            <p className="text-sm text-neutral-500">No completed trips yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm">{h.tesla_name}</strong>
                    <StatusBadge status={h.status} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-sm text-neutral-400">
                    <span>{h.passenger_count} passenger(s)</span>
                    <span
                      className={`font-medium ${
                        h.status === "completed"
                          ? "text-emerald-400"
                          : "text-neutral-300"
                      }`}
                    >
                      {h.status === "completed" ? "Earned" : "Amount"}{" "}
                      {h.total_fare_bdt} BDT
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {new Date(h.created_at).toLocaleDateString()}{" "}
                    {new Date(h.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
