import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import RideMap from "./RideMap.jsx";
import { Card, StatusBadge } from "./ui.jsx";

export default function PassengerDashboard({ user, section = "ride" }) {
  const [zones, setZones] = useState([]);
  const [pickupZoneId, setPickupZoneId] = useState("");
  const [dropoffZoneId, setDropoffZoneId] = useState("");
  const [seats, setSeats] = useState(1);

  const [estimate, setEstimate] = useState(null);
  const [, setEstimateLoading] = useState(false);

  const [activeRide, setActiveRide] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [history, setHistory] = useState([]);
  const activeFetchSeq = useRef(0);

  const selectedPickupZone = zones.find((z) => z.id === pickupZoneId);
  const selectedDropoffZone = zones.find((z) => z.id === dropoffZoneId);

  useEffect(() => {
    api("/api/zones")
      .then((data) => {
        setZones(data.zones || []);
        if (data.zones && data.zones.length >= 2) {
          const banani =
            data.zones.find((z) => z.slug === "banani") || data.zones[0];
          const mohakhali =
            data.zones.find((z) => z.slug === "mohakhali") || data.zones[1];
          setPickupZoneId(banani.id);
          setDropoffZoneId(mohakhali.id);
        }
      })
      .catch((e) => setErrorMsg(e.message));
  }, []);

  const fetchActive = async () => {
    const seq = ++activeFetchSeq.current;
    try {
      const data = await api("/api/rides/requests/active", { auth: true });
      if (seq !== activeFetchSeq.current) return;
      setActiveRide(data.activeRide || null);
    } catch (e) {
      if (seq !== activeFetchSeq.current) return;
      console.error("Failed to fetch active ride", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await api("/api/rides/requests/history", { auth: true });
      setHistory(data.history || []);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    fetchActive();
    fetchHistory();
    const timer = setInterval(fetchActive, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pickupZoneId || !dropoffZoneId || pickupZoneId === dropoffZoneId) {
      setEstimate(null);
      return;
    }
    setEstimateLoading(true);
    const body = {
      pickupZoneId,
      dropoffZoneId,
      seats: Number(seats),
      pickupLat: selectedPickupZone
        ? Number(selectedPickupZone.latitude)
        : undefined,
      pickupLng: selectedPickupZone
        ? Number(selectedPickupZone.longitude)
        : undefined,
      dropoffLat: selectedDropoffZone
        ? Number(selectedDropoffZone.latitude)
        : undefined,
      dropoffLng: selectedDropoffZone
        ? Number(selectedDropoffZone.longitude)
        : undefined,
    };
    api("/api/rides/estimate", { method: "POST", auth: true, body })
      .then((data) => setEstimate(data))
      .catch(() => setEstimate(null))
      .finally(() => setEstimateLoading(false));
  }, [pickupZoneId, dropoffZoneId, seats]);

  async function handleRequestRide(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);
    try {
      await api("/api/rides/requests", {
        method: "POST",
        auth: true,
        body: {
          pickupZoneId,
          dropoffZoneId,
          seats: Number(seats),
          pickupLat: selectedPickupZone
            ? Number(selectedPickupZone.latitude)
            : undefined,
          pickupLng: selectedPickupZone
            ? Number(selectedPickupZone.longitude)
            : undefined,
          dropoffLat: selectedDropoffZone
            ? Number(selectedDropoffZone.latitude)
            : undefined,
          dropoffLng: selectedDropoffZone
            ? Number(selectedDropoffZone.longitude)
            : undefined,
        },
      });
      setSuccessMsg(
        "Ride requested! Looking for a Tesla with available seats...",
      );
      await fetchActive();
    } catch (err) {
      setErrorMsg(err.message || "Failed to request ride.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelRide() {
    if (!activeRide?.request_id) return;
    if (!window.confirm("Are you sure you want to cancel this ride request?"))
      return;
    setCancelling(true);
    setErrorMsg("");
    try {
      await api(`/api/rides/requests/${activeRide.request_id}/cancel`, {
        method: "POST",
        auth: true,
      });
      activeFetchSeq.current += 1;
      setActiveRide(null);
      setSuccessMsg("Ride request cancelled.");
      await fetchActive();
      await fetchHistory();
    } catch (err) {
      setErrorMsg(err.message || "Failed to cancel ride.");
    } finally {
      setCancelling(false);
    }
  }

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

      {section === "ride" &&
        (activeRide ? (
          <Card
            eyebrow="Active Ride Tracker"
            right={
              <StatusBadge
                status={activeRide.ride_status || activeRide.request_status}
              />
            }
          >
            <h3 className="text-lg font-semibold">
              {activeRide.pickup_zone_name} → {activeRide.dropoff_zone_name}
            </h3>

            <div className="mt-4">
              <RideMap
                mode="passenger-active"
                height="260px"
                pickup={{
                  lat: Number(activeRide.pickup_lat),
                  lng: Number(activeRide.pickup_lng),
                  label: activeRide.pickup_zone_name,
                }}
                dropoff={{
                  lat: Number(activeRide.dropoff_lat),
                  lng: Number(activeRide.dropoff_lng),
                  label: activeRide.dropoff_zone_name,
                }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <span className="text-xs text-neutral-500">Seats booked</span>
                <p className="mt-1 text-sm font-medium">
                  {activeRide.seats} {activeRide.seats > 1 ? "seats" : "seat"}
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <span className="text-xs text-neutral-500">Your fare</span>
                <p className="mt-1 text-sm font-medium text-emerald-400">
                  {(
                    (activeRide.actual_fare_paisa ||
                      activeRide.estimated_fare_paisa) / 100
                  ).toFixed(2)}{" "}
                  BDT
                </p>
              </div>
            </div>

            {activeRide.request_status === "waiting" && !activeRide.ride_id && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-neutral-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
                Finding a nearby Tesla in your direction…
              </div>
            )}

            {activeRide.ride_id && (
              <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <strong className="text-sm">
                    {activeRide.tesla_name || "Dhaka Tesla"}
                  </strong>
                  <span className="text-xs text-neutral-500">
                    {activeRide.occupied_seats} / {activeRide.tesla_capacity}{" "}
                    seats
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-neutral-400">
                  Driver:{" "}
                  <strong className="text-neutral-200">
                    {activeRide.driver_name}
                  </strong>{" "}
                  {activeRide.driver_phone && `(${activeRide.driver_phone})`}
                </p>
                {activeRide.ride_status === "matched" && (
                  <p className="mt-2 text-sm text-sky-400">
                    Driver matched! Heading to pickup zone.
                  </p>
                )}
                {activeRide.ride_status === "driver_arrived" && (
                  <p className="mt-2 text-sm text-amber-400">
                    Driver has arrived at {activeRide.pickup_zone_name}!
                  </p>
                )}
                {activeRide.ride_status === "started" && (
                  <p className="mt-2 text-sm text-emerald-400">
                    Trip in progress! Relax and enjoy your Tesla pool ride.
                  </p>
                )}
              </div>
            )}

            {["waiting", "matched", "driver_arrived"].includes(
              activeRide.ride_status || activeRide.request_status,
            ) && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelRide}
                className="mt-5 rounded-lg border border-red-400/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/5 disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Request"}
              </button>
            )}
          </Card>
        ) : (
          <Card eyebrow="Request a Shared Tesla">
            <h2 className="text-lg font-semibold">Book your pool seat</h2>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <form onSubmit={handleRequestRide} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-neutral-400">
                    Pickup Zone
                  </label>
                  <select
                    value={pickupZoneId}
                    onChange={(e) => setPickupZoneId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-400/50 focus:outline-none"
                  >
                    <option value="">Select pickup zone</option>
                    {zones.map((z) => (
                      <option
                        key={z.id}
                        value={z.id}
                        disabled={z.id === dropoffZoneId}
                      >
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-neutral-400">
                    Destination Zone
                  </label>
                  <select
                    value={dropoffZoneId}
                    onChange={(e) => setDropoffZoneId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-400/50 focus:outline-none"
                  >
                    <option value="">Select destination zone</option>
                    {zones.map((z) => (
                      <option
                        key={z.id}
                        value={z.id}
                        disabled={z.id === pickupZoneId}
                      >
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-neutral-400">
                    Seats Needed
                  </label>
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-400/50 focus:outline-none"
                  >
                    <option value={1}>1 Passenger (Solo Seat)</option>
                    <option value={2}>2 Passengers</option>
                    <option value={3}>
                      3 Passengers (Entire Bullet Tesla)
                    </option>
                  </select>
                </div>

                {estimate && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-4">
                    <div className="flex items-center justify-between text-sm text-neutral-400">
                      <span>Distance: ~{estimate.distanceKm} km</span>
                      <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-400">
                        Pool discount −20%
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-neutral-400">
                      <div>
                        Base fare: {estimate.pooledFare.baseFareBDT} BDT
                      </div>
                      <div>
                        Distance: {estimate.pooledFare.distanceChargeBDT} BDT
                      </div>
                      <div className="text-emerald-400">
                        − {estimate.pooledFare.poolDiscountBDT} BDT
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-sm text-neutral-300">
                        Estimated Fare
                      </span>
                      <span className="text-lg font-semibold text-emerald-400">
                        {estimate.estimatedFareBDT} BDT
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !pickupZoneId ||
                    !dropoffZoneId ||
                    pickupZoneId === dropoffZoneId
                  }
                  className="w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Requesting..." : "Request Tesla Pool Ride"}
                </button>
              </form>

              <div>
                <div className="mb-2 text-sm text-neutral-400">
                  {selectedPickupZone && selectedDropoffZone
                    ? `${selectedPickupZone.name} → ${selectedDropoffZone.name}`
                    : "Select pickup & drop-off locations to preview route"}
                </div>
                <RideMap
                  mode="passenger-select"
                  height="320px"
                  pickup={
                    selectedPickupZone
                      ? {
                          lat: Number(selectedPickupZone.latitude),
                          lng: Number(selectedPickupZone.longitude),
                          label: selectedPickupZone.name,
                        }
                      : null
                  }
                  dropoff={
                    selectedDropoffZone
                      ? {
                          lat: Number(selectedDropoffZone.latitude),
                          lng: Number(selectedDropoffZone.longitude),
                          label: selectedDropoffZone.name,
                        }
                      : null
                  }
                />
              </div>
            </div>
          </Card>
        ))}

      {section === "history" && (
        <Card eyebrow="Your Rides">
          {history.length === 0 ? (
            <p className="text-sm text-neutral-500">No past rides yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.request_id}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm">
                      {item.pickup_zone_name} → {item.dropoff_zone_name}
                    </strong>
                    <StatusBadge
                      status={item.ride_status || item.request_status}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-sm text-neutral-400">
                    <span>
                      {item.seats} seat(s) · {item.tesla_name || "Tesla"}
                    </span>
                    <span className="font-medium text-emerald-400">
                      {(
                        (item.final_fare_paisa || item.estimated_fare_paisa) /
                        100
                      ).toFixed(2)}{" "}
                      BDT
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {new Date(item.created_at).toLocaleTimeString([], {
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
