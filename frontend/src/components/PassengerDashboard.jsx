import { useEffect, useRef, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "../api.js";
import RideMap from "./RideMap.jsx";
import { Card, StatusBadge } from "./ui.jsx";
import FeedbackModal from "./FeedbackModal.jsx";

function StripePaymentForm({ payment, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements || processing) return;
    setProcessing(true);
    setError("");
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (result.error) throw new Error(result.error.message);
      if (result.paymentIntent?.status !== "succeeded") {
        throw new Error("Stripe has not confirmed this payment yet.");
      }
      await onPaid({ paymentIntentId: result.paymentIntent.id });
    } catch (err) {
      setError(err.message || "Payment could not be completed.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-300 disabled:opacity-50"
      >
        {processing ? "Processing payment..." : `Pay ${payment.amountBDT} BDT`}
      </button>
    </form>
  );
}

function PassengerPayment({ ride, onPaid }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dummyCard, setDummyCard] = useState({
    number: "",
    month: "",
    year: "",
    cvc: "",
  });

  async function startPayment() {
    setLoading(true);
    setError("");
    try {
      const config = await api("/api/payments/config");
      const intent = await api("/api/payments/create-intent", {
        method: "POST",
        auth: true,
        body: { ridePassengerId: ride.ride_passenger_id },
      });
      if (intent.alreadyPaid) {
        await onPaid();
        return;
      }
      if (!intent.isDummy && !config.publishableKey) {
        throw new Error(
          "Stripe is not fully configured. Please contact support.",
        );
      }
      setPayment({
        ...intent,
        stripe: intent.isDummy ? null : loadStripe(config.publishableKey),
      });
    } catch (err) {
      setError(err.message || "Unable to start Stripe checkout.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPayment(details = {}) {
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/payments/confirm", {
        method: "POST",
        auth: true,
        body: {
          paymentId: payment.paymentId,
          paymentIntentId: details.paymentIntentId,
          isDummy: Boolean(payment.isDummy),
        },
      });
      setPayment(null);
      await onPaid(res);
    } catch (err) {
      setError(err.message || "Payment could not be confirmed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDummyPayment(event) {
    event.preventDefault();
    if (!/^\d{16}$/.test(dummyCard.number)) {
      setError("Enter a 16-digit card number.");
      return;
    }
    if (!/^(0[1-9]|1[0-2])$/.test(dummyCard.month)) {
      setError("Enter a valid expiry month from 01 to 12.");
      return;
    }
    if (!/^\d{4}$/.test(dummyCard.year) || Number(dummyCard.year) <= 2026) {
      setError("Expiry year must be later than 2026.");
      return;
    }
    if (!/^\d{4}$/.test(dummyCard.cvc)) {
      setError("Enter a 4-digit security code.");
      return;
    }
    await confirmPayment();
  }

  function updateDummyCard(field, value) {
    setDummyCard((current) => ({ ...current, [field]: value }));
    setError("");
  }

  return (
    <div className="mt-5">
      {error && (
        <p className="mb-3 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {!payment ? (
        <button
          type="button"
          disabled={loading}
          onClick={startPayment}
          className="rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading ? "Opening Stripe..." : "Pay with Stripe"}
        </button>
      ) : payment.isDummy ? (
        <form onSubmit={handleDummyPayment} className="space-y-4">
          <p className="text-xs text-amber-300">
            Simulated payment. Any card details matching the required format are
            accepted; no card data is sent or stored.
          </p>
          <label className="block text-sm text-neutral-300">
            Card number
            <input
              required
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={16}
              pattern="[0-9]{16}"
              value={dummyCard.number}
              onChange={(event) =>
                updateDummyCard(
                  "number",
                  event.target.value.replace(/\D/g, "").slice(0, 16),
                )
              }
              placeholder="16 digits"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="block text-sm text-neutral-300">
              Month
              <input
                required
                inputMode="numeric"
                autoComplete="cc-exp-month"
                maxLength={2}
                pattern="0[1-9]|1[0-2]"
                value={dummyCard.month}
                onChange={(event) =>
                  updateDummyCard(
                    "month",
                    event.target.value.replace(/\D/g, "").slice(0, 2),
                  )
                }
                placeholder="MM"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              />
            </label>
            <label className="block text-sm text-neutral-300">
              Year
              <input
                required
                inputMode="numeric"
                autoComplete="cc-exp-year"
                maxLength={4}
                pattern="[0-9]{4}"
                value={dummyCard.year}
                onChange={(event) =>
                  updateDummyCard(
                    "year",
                    event.target.value.replace(/\D/g, "").slice(0, 4),
                  )
                }
                placeholder="YYYY"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              />
            </label>
            <label className="block text-sm text-neutral-300">
              Security code
              <input
                required
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                pattern="[0-9]{4}"
                value={dummyCard.cvc}
                onChange={(event) =>
                  updateDummyCard(
                    "cvc",
                    event.target.value.replace(/\D/g, "").slice(0, 4),
                  )
                }
                placeholder="4 digits"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-300 disabled:opacity-50"
          >
            {loading ? "Confirming..." : `Pay ${payment.amountBDT} BDT`}
          </button>
        </form>
      ) : (
        <Elements
          stripe={payment.stripe}
          options={{ clientSecret: payment.clientSecret }}
        >
          <StripePaymentForm payment={payment} onPaid={confirmPayment} />
        </Elements>
      )}
    </div>
  );
}

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
  const [feedbackTarget, setFeedbackTarget] = useState(null);
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

      {activeRide?.ride_status === "completed" &&
        activeRide.payment_status !== "paid" && (
          <Card eyebrow="Payment Required">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Settle your completed ride
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {activeRide.pickup_zone_name} → {activeRide.dropoff_zone_name}
                </p>
              </div>
              <strong className="text-lg font-semibold text-emerald-400">
                {(
                  (activeRide.actual_fare_paisa ||
                    activeRide.estimated_fare_paisa) / 100
                ).toFixed(2)}{" "}
                BDT
              </strong>
            </div>
            <PassengerPayment
              ride={activeRide}
              onPaid={async (res) => {
                setSuccessMsg("Payment completed successfully.");
                setFeedbackTarget({
                  requestId: activeRide.request_id || res?.requestId,
                  driverName: activeRide.driver_name || res?.driverName,
                  pickupZoneName: activeRide.pickup_zone_name || res?.pickupZoneName,
                  dropoffZoneName: activeRide.dropoff_zone_name || res?.dropoffZoneName,
                  initialRating: activeRide.rating || 0,
                  initialComplaint: activeRide.complaint || "",
                  isPostPayment: true,
                });
                await fetchActive();
                await fetchHistory();
              }}
            />
          </Card>
        )}

      {section === "ride" &&
        activeRide?.ride_status !== "completed" &&
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
                {activeRide.solo_fare_paisa != null && (
                  <p className="mt-1 text-xs text-emerald-400">
                    You save{" "}
                    {((activeRide.pool_savings_paisa || 0) / 100).toFixed(2)} tk
                    by pooling!
                  </p>
                )}
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
                        Pool discount −{estimate.pooledFare.poolDiscountBDT} BDT
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
                    <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between text-neutral-300">
                        <span>Solo fare</span>
                        <span>{estimate.soloFare.finalFareBDT} BDT</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between font-medium text-emerald-400">
                        <span>
                          You save {estimate.poolSavingsBDT} tk by pooling!
                        </span>
                        <span>Fairness check</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        Your pooled fare is{" "}
                        {Math.round(
                          (estimate.estimatedFarePaisa /
                            estimate.soloFare.finalFarePaisa) *
                            100,
                        )}
                        % of solo pricing.
                      </p>
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
              {history.map((item) => {
                const isCompleted =
                  item.ride_status === "completed" ||
                  item.request_status === "completed";
                const isPaid = item.payment_status === "paid";
                const paymentDue = isCompleted && !isPaid;

                return (
                  <div
                    key={item.request_id}
                    className={`rounded-xl border p-4 ${
                      paymentDue
                        ? "border-amber-400/20 bg-amber-400/[0.03]"
                        : "border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-sm">
                        {item.pickup_zone_name} → {item.dropoff_zone_name}
                      </strong>
                      <div className="flex items-center gap-2">
                        {paymentDue ? (
                          <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-medium tracking-wide text-amber-400">
                            PAYMENT DUE
                          </span>
                        ) : isPaid ? (
                          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium tracking-wide text-emerald-400">
                            PAID
                          </span>
                        ) : (
                          <StatusBadge
                            status={item.ride_status || item.request_status}
                          />
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-sm text-neutral-400">
                      <span>
                        {item.seats} seat(s) · {item.tesla_name || "Tesla"}
                      </span>
                      <span
                        className={`font-medium ${
                          paymentDue ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {paymentDue ? "Due: " : ""}
                        {(
                          (item.final_fare_paisa || item.estimated_fare_paisa) /
                          100
                        ).toFixed(2)}{" "}
                        BDT
                      </span>
                    </div>
                    {item.solo_fare_paisa != null && (
                      <div className="mt-1 text-xs text-emerald-400">
                        You save{" "}
                        {((item.pool_savings_paisa || 0) / 100).toFixed(2)} tk by
                        pooling!
                      </div>
                    )}
                    {isPaid && item.paid_at && (
                      <div className="mt-1 text-xs text-neutral-500">
                        Paid on{" "}
                        {new Date(item.paid_at).toLocaleDateString()}{" "}
                        {new Date(item.paid_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-neutral-500">
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    {/* Pay Now if payment is due */}
                    {paymentDue && (
                      <div className="mt-3 flex items-center justify-between border-t border-amber-400/10 pt-2.5">
                        <span className="text-xs font-medium text-amber-400">
                          Payment is required for this trip
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRide({
                              ...item,
                              ride_status: "completed",
                              payment_status: "pending",
                              actual_fare_paisa:
                                item.final_fare_paisa || item.estimated_fare_paisa,
                              driver_name: item.driver_name,
                              pickup_zone_name: item.pickup_zone_name,
                              dropoff_zone_name: item.dropoff_zone_name,
                              seats: item.seats,
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 transition-colors hover:bg-amber-300"
                        >
                          Pay Now (
                          {(
                            (item.final_fare_paisa ||
                              item.estimated_fare_paisa) /
                            100
                          ).toFixed(2)}{" "}
                          BDT)
                        </button>
                      </div>
                    )}

                    {/* Feedback (Rating & Complaint) Section */}
                    {isCompleted && (
                      <div className="mt-3 border-t border-white/5 pt-2.5">
                        {item.feedback_id ||
                        item.rating !== null ||
                        item.complaint ? (
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-neutral-400">
                                  Your Review:
                                </span>
                                {item.rating > 0 ? (
                                  <span className="flex items-center font-medium text-amber-400">
                                    {"★".repeat(item.rating)}
                                    {"☆".repeat(5 - item.rating)}{" "}
                                    <span className="ml-1 text-neutral-400">
                                      ({item.rating}/5)
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-neutral-500">
                                    No star rating
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setFeedbackTarget({
                                    requestId: item.request_id,
                                    driverName: item.driver_name,
                                    pickupZoneName: item.pickup_zone_name,
                                    dropoffZoneName: item.dropoff_zone_name,
                                    initialRating: item.rating || 0,
                                    initialComplaint: item.complaint || "",
                                    isPostPayment: false,
                                  })
                                }
                                className="text-xs font-medium text-emerald-400 underline hover:text-emerald-300"
                              >
                                Edit Feedback
                              </button>
                            </div>
                            {item.complaint && (
                              <p className="mt-1.5 rounded border border-white/5 bg-black/20 p-2 text-neutral-300 italic">
                                “{item.complaint}”
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-500">
                              No rating or complaint submitted yet
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFeedbackTarget({
                                  requestId: item.request_id,
                                  driverName: item.driver_name,
                                  pickupZoneName: item.pickup_zone_name,
                                  dropoffZoneName: item.dropoff_zone_name,
                                  initialRating: 0,
                                  initialComplaint: "",
                                  isPostPayment: false,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-400/20"
                            >
                              <span>★</span> Rate & Complaint
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {feedbackTarget && (
        <FeedbackModal
          target={feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          onSaved={async () => {
            setSuccessMsg(
              "Thank you! Your rating and feedback have been saved.",
            );
            await fetchActive();
            await fetchHistory();
          }}
        />
      )}
    </div>
  );
}
