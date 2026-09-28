import { useEffect, useRef, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import { api } from "../api.js";
import RideMap from "./RideMap.jsx";
import { Card, StatusBadge } from "./ui.jsx";
import FeedbackModal from "./FeedbackModal.jsx";
import {
  Car,
  MapPin,
  Users,
  ShieldCheck,
  CreditCard,
  History,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Star,
  Clock,
  ArrowRight,
} from "lucide-react";

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
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 px-4 py-3 text-sm font-bold text-white dark:text-neutral-950 transition-colors disabled:opacity-50 cursor-pointer"
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
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
      {!payment ? (
        <button
          type="button"
          disabled={loading}
          onClick={startPayment}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 px-5 py-2.5 text-sm font-bold text-white dark:text-neutral-950 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <CreditCard className="h-4 w-4" />
          <span>
            {loading ? "Opening Checkout..." : "Pay with Stripe Card"}
          </span>
        </button>
      ) : payment.isDummy ? (
        <form onSubmit={handleDummyPayment} className="space-y-4">
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs font-medium text-amber-800 dark:text-amber-300">
            Simulated payment test mode. You can enter any valid 16-digit card
            test details.
          </div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
            Card Number
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
              placeholder="16 digits (e.g. 4242424242424242)"
              className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
              Month (MM)
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
                placeholder="12"
                className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
              Year (YYYY)
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
                placeholder="2028"
                className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300">
              Security CVC
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
                placeholder="1234"
                className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 px-5 py-2.5 text-sm font-bold text-white dark:text-neutral-950 transition-colors disabled:opacity-50 cursor-pointer"
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
        "Ride requested! Looking for an available Tesla along your route...",
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

      {/* Settle Payment Screen */}
      {activeRide?.ride_status === "completed" &&
        activeRide.payment_status !== "paid" && (
          <Card eyebrow="Payment Due">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Settle Your Completed Trip
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                  {activeRide.pickup_zone_name} → {activeRide.dropoff_zone_name}
                </p>
              </div>
              <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
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
                  pickupZoneName:
                    activeRide.pickup_zone_name || res?.pickupZoneName,
                  dropoffZoneName:
                    activeRide.dropoff_zone_name || res?.dropoffZoneName,
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

      {/* Ride Booking or Active Tracker Section */}
      {section === "ride" &&
        activeRide?.ride_status !== "completed" &&
        (activeRide ? (
          <Card
            eyebrow="Active Trip Tracker"
            right={
              <StatusBadge
                status={activeRide.ride_status || activeRide.request_status}
              />
            }
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeRide.pickup_zone_name} → {activeRide.dropoff_zone_name}
            </h3>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
              <RideMap
                mode="passenger-active"
                height="280px"
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
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/40 p-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Seats Booked
                </span>
                <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                  {activeRide.seats} {activeRide.seats > 1 ? "seats" : "seat"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/40 p-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  Your Pooled Fare
                </span>
                <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {(
                    (activeRide.actual_fare_paisa ||
                      activeRide.estimated_fare_paisa) / 100
                  ).toFixed(2)}{" "}
                  BDT
                </p>
                {activeRide.solo_fare_paisa != null && (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Saved{" "}
                    {((activeRide.pool_savings_paisa || 0) / 100).toFixed(2)} tk
                    by pooling!
                  </p>
                )}
              </div>
            </div>

            {activeRide.request_status === "waiting" && !activeRide.ride_id && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/40 p-4 text-xs font-medium text-sky-800 dark:text-sky-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                <span>Searching for a matched Tesla along your corridor…</span>
              </div>
            )}

            {activeRide.ride_id && (
              <div className="mt-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-800/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-sm font-bold text-slate-900 dark:text-white">
                    ⚡ {activeRide.tesla_name || "Dhaka Tesla"}
                  </strong>
                  <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                    Occupancy: {activeRide.occupied_seats} /{" "}
                    {activeRide.tesla_capacity} seats
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-neutral-300">
                  Driver:{" "}
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {activeRide.driver_name}
                  </strong>{" "}
                  {activeRide.driver_phone && `(${activeRide.driver_phone})`}
                </p>
                {activeRide.ride_status === "matched" && (
                  <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                    Driver accepted! Heading to your pickup point.
                  </p>
                )}
                {activeRide.ride_status === "driver_arrived" && (
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Driver has arrived at {activeRide.pickup_zone_name}!
                  </p>
                )}
                {activeRide.ride_status === "started" && (
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Trip in progress. Enjoy your quiet electric ride.
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
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                <span>
                  {cancelling ? "Cancelling..." : "Cancel Ride Request"}
                </span>
              </button>
            )}
          </Card>
        ) : (
          <Card eyebrow="Request a Shared Tesla">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Book Your Electric Pool Seat
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
              Select origin and destination to see upfront per-seat pooled fare.
            </p>

            <div className="mt-6 grid gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleRequestRide}
                className="lg:col-span-6 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                    Pickup Zone
                  </label>
                  <select
                    value={pickupZoneId}
                    onChange={(e) => setPickupZoneId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select pickup point</option>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                    Destination Zone
                  </label>
                  <select
                    value={dropoffZoneId}
                    onChange={(e) => setDropoffZoneId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select destination point</option>
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                    Passenger Seats Needed
                  </label>
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-neutral-800/80 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={1}>1 Seat (Individual Commuter)</option>
                    <option value={2}>2 Seats</option>
                    <option value={3}>3 Seats (Private Pool)</option>
                  </select>
                </div>

                {estimate && (
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-neutral-400">
                      <span>
                        Est. Corridor Distance: ~{estimate.distanceKm} km
                      </span>
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Pool Savings: −{estimate.pooledFare.poolDiscountBDT} BDT
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-emerald-200/60 dark:border-emerald-900/40 pt-2.5">
                      <span className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
                        Your Pooled Fare
                      </span>
                      <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                        {estimate.estimatedFareBDT} BDT
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
                      <span>Solo Cab Comparison</span>
                      <span className="line-through">
                        {estimate.soloFare.finalFareBDT} BDT
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
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-neutral-950 py-3 text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Car className="h-4 w-4" />
                  <span>
                    {submitting ? "Requesting..." : "Request Tesla Pool Seat"}
                  </span>
                </button>
              </form>

              {/* Map Preview */}
              <div className="lg:col-span-6 space-y-2">
                <span className="block text-xs font-semibold text-slate-600 dark:text-neutral-400">
                  {selectedPickupZone && selectedDropoffZone
                    ? `${selectedPickupZone.name} → ${selectedDropoffZone.name}`
                    : "Select route endpoints to inspect on map"}
                </span>
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
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
            </div>
          </Card>
        ))}

      {/* History Section */}
      {section === "history" && (
        <Card eyebrow="Trip & Payment History">
          {history.length === 0 ? (
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ py: 4, textAlign: "center" }}
            >
              No previous rides found. Request your first Tesla pool ride today!
            </Typography>
          ) : (
            <Stack spacing={2}>
              {history.map((item) => {
                const isCompleted =
                  item.ride_status === "completed" ||
                  item.request_status === "completed";
                const isPaid = item.payment_status === "paid";
                const paymentDue = isCompleted && !isPaid;

                return (
                  <Paper
                    key={item.request_id}
                    variant="outlined"
                    sx={{
                      minWidth: 0,
                      p: { xs: 1.75, sm: 2.5 },
                      borderRadius: 2,
                      borderColor: paymentDue ? "warning.main" : "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      gap={1.5}
                    >
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        gap={1}
                        sx={{ minWidth: 0 }}
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{ minWidth: 0, overflowWrap: "anywhere" }}
                        >
                          {item.pickup_zone_name} → {item.dropoff_zone_name}
                        </Typography>
                      </Stack>

                      <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                        {paymentDue ? (
                          <Chip
                            size="small"
                            color="warning"
                            label="Payment due"
                          />
                        ) : isPaid ? (
                          <Chip size="small" color="success" label="Paid" />
                        ) : (
                          <StatusBadge
                            status={item.ride_status || item.request_status}
                          />
                        )}
                      </Stack>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      gap={0.75}
                      sx={{ mt: 1.5 }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ overflowWrap: "anywhere" }}
                      >
                        {item.seats} {item.seats > 1 ? "seats" : "seat"} ·{" "}
                        {item.tesla_name || "Tesla Fleet"}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color={paymentDue ? "warning.dark" : "success.main"}
                      >
                        {paymentDue ? "Fare Due: " : "Fare: "}
                        {(
                          (item.final_fare_paisa || item.estimated_fare_paisa) /
                          100
                        ).toFixed(2)}{" "}
                        BDT
                      </Typography>
                    </Stack>

                    {item.solo_fare_paisa != null && (
                      <Typography
                        variant="caption"
                        color="success.main"
                        fontWeight={600}
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        Saved{" "}
                        {((item.pool_savings_paisa || 0) / 100).toFixed(2)} tk
                        by pooling!
                      </Typography>
                    )}

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 1, overflowWrap: "anywhere" }}
                    >
                      Booked on {new Date(item.created_at).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isPaid && item.paid_at && (
                        <span>
                          {" "}
                          · Succeeded on{" "}
                          {new Date(item.paid_at).toLocaleDateString()}
                        </span>
                      )}
                    </Typography>

                    {/* Pay Now Button */}
                    {paymentDue && (
                      <>
                        <Divider
                          sx={{ my: 1.5, borderColor: "warning.light" }}
                        />
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          alignItems={{ xs: "stretch", sm: "center" }}
                          justifyContent="space-between"
                          gap={1.5}
                        >
                          <Typography
                            variant="body2"
                            color="warning.dark"
                            fontWeight={600}
                          >
                            Settle payment for this trip
                          </Typography>
                          <Button
                            type="button"
                            variant="contained"
                            color="warning"
                            size="small"
                            sx={{
                              alignSelf: { xs: "stretch", sm: "auto" },
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => {
                              setActiveRide({
                                ...item,
                                ride_status: "completed",
                                payment_status: "pending",
                                actual_fare_paisa:
                                  item.final_fare_paisa ||
                                  item.estimated_fare_paisa,
                                driver_name: item.driver_name,
                                pickup_zone_name: item.pickup_zone_name,
                                dropoff_zone_name: item.dropoff_zone_name,
                                seats: item.seats,
                              });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            Pay Now (
                            {(
                              (item.final_fare_paisa ||
                                item.estimated_fare_paisa) / 100
                            ).toFixed(2)}{" "}
                            BDT)
                          </Button>
                        </Stack>
                      </>
                    )}

                    {/* Feedback / Review Section */}
                    {isCompleted && (
                      <>
                        <Divider sx={{ my: 1.5 }} />
                        {item.feedback_id ||
                        item.rating !== null ||
                        item.complaint ? (
                          <Box
                            sx={{
                              borderRadius: 1.5,
                              bgcolor: "action.hover",
                              p: 1.5,
                            }}
                          >
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              alignItems={{ xs: "flex-start", sm: "center" }}
                              justifyContent="space-between"
                              gap={1}
                            >
                              <Stack
                                direction="row"
                                useFlexGap
                                flexWrap="wrap"
                                alignItems="center"
                                gap={1}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  fontWeight={600}
                                >
                                  Your trip rating:
                                </Typography>
                                {item.rating > 0 ? (
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    gap={0.75}
                                  >
                                    <Rating
                                      value={item.rating}
                                      readOnly
                                      size="small"
                                    />
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      ({item.rating}/5)
                                    </Typography>
                                  </Stack>
                                ) : (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    No rating
                                  </Typography>
                                )}
                              </Stack>
                              <Button
                                type="button"
                                size="small"
                                color="success"
                                sx={{
                                  minWidth: 0,
                                  minHeight: 0,
                                  p: 1,
                                  flexShrink: 35,
                                  fontSize: "0.75rem",
                                  lineHeight: 2.5,
                                }}
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
                              >
                                Edit review
                              </Button>
                            </Stack>
                            {item.complaint && (
                              <Typography
                                variant="body2"
                                sx={{
                                  mt: 1,
                                  p: 1.25,
                                  borderRadius: 1.5,
                                  bgcolor: "background.paper",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                “{item.complaint}”
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            justifyContent="space-between"
                            gap={1.5}
                          >
                            <Typography variant="body2" color="text.secondary">
                              How was your ride experience?
                            </Typography>
                            <Button
                              type="button"
                              variant="outlined"
                              color="warning"
                              size="small"
                              startIcon={
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              }
                              sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}
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
                            >
                              Rate driver & feedback
                            </Button>
                          </Stack>
                        )}
                      </>
                    )}
                  </Paper>
                );
              })}
            </Stack>
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
