import { query, withTransaction } from "../../db/pool.js";
import { AppError } from "../../middleware/errorHandler.js";
import {
  calculateDistanceKm,
  calculateFare,
} from "../../utils/fare.calculator.js";

/**
 * Get zone by ID or throw error
 */
async function getZoneOrThrow(client, zoneId, label = "Zone") {
  const { rows } = await client.query("SELECT * FROM zones WHERE id = $1", [
    zoneId,
  ]);
  if (!rows[0]) {
    throw new AppError(404, "NOT_FOUND", `${label} not found`);
  }
  return rows[0];
}

/**
 * Estimate fare between two zones (optionally using exact coordinates)
 */
export async function estimateRide({
  pickupZoneId,
  dropoffZoneId,
  seats,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
}) {
  const pickup = await getZoneOrThrow({ query }, pickupZoneId, "Pickup zone");
  const dropoff = await getZoneOrThrow(
    { query },
    dropoffZoneId,
    "Dropoff zone",
  );

  const startLat =
    pickupLat !== undefined ? Number(pickupLat) : Number(pickup.latitude);
  const startLng =
    pickupLng !== undefined ? Number(pickupLng) : Number(pickup.longitude);
  const destLat =
    dropoffLat !== undefined ? Number(dropoffLat) : Number(dropoff.latitude);
  const destLng =
    dropoffLng !== undefined ? Number(dropoffLng) : Number(dropoff.longitude);

  const distanceKm = calculateDistanceKm(startLat, startLng, destLat, destLng);

  const soloFare = calculateFare({ distanceKm, seats, isPooled: false });
  const pooledFare = calculateFare({ distanceKm, seats, isPooled: true });

  return {
    pickupZone: pickup,
    dropoffZone: dropoff,
    distanceKm,
    seats,
    pickupLat: startLat,
    pickupLng: startLng,
    dropoffLat: destLat,
    dropoffLng: destLng,
    soloFare,
    pooledFare,
    poolSavingsPaisa: soloFare.finalFarePaisa - pooledFare.finalFarePaisa,
    poolSavingsBDT: (
      (soloFare.finalFarePaisa - pooledFare.finalFarePaisa) /
      100
    ).toFixed(2),
    estimatedFarePaisa: pooledFare.finalFarePaisa,
    estimatedFareBDT: pooledFare.finalFareBDT,
  };
}

/**
 * Passenger requests a ride
 */
export async function createRideRequest({
  passengerId,
  pickupZoneId,
  dropoffZoneId,
  seats,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
}) {
  // Check if passenger already has an active request or active ride
  const { rows: activeReqs } = await query(
    `SELECT r.id, r.status
     FROM ride_requests r
     WHERE r.passenger_id = $1 AND r.status IN ('waiting', 'matched')`,
    [passengerId],
  );

  if (activeReqs.length > 0) {
    throw new AppError(
      409,
      "ACTIVE_REQUEST_EXISTS",
      "You already have an active ride request in progress.",
    );
  }

  const { rows: pendingPayments } = await query(
    `SELECT p.id
     FROM payments p
     JOIN ride_passengers rp ON rp.id = p.ride_passenger_id
     WHERE rp.passenger_id = $1 AND p.status = 'pending'
     LIMIT 1`,
    [passengerId],
  );
  if (pendingPayments.length > 0) {
    throw new AppError(
      409,
      "PAYMENT_REQUIRED",
      "Please pay for your completed ride before requesting another ride.",
    );
  }

  const pickup = await getZoneOrThrow({ query }, pickupZoneId, "Pickup zone");
  const dropoff = await getZoneOrThrow(
    { query },
    dropoffZoneId,
    "Dropoff zone",
  );

  const startLat =
    pickupLat !== undefined ? Number(pickupLat) : Number(pickup.latitude);
  const startLng =
    pickupLng !== undefined ? Number(pickupLng) : Number(pickup.longitude);
  const destLat =
    dropoffLat !== undefined ? Number(dropoffLat) : Number(dropoff.latitude);
  const destLng =
    dropoffLng !== undefined ? Number(dropoffLng) : Number(dropoff.longitude);

  const distanceKm = calculateDistanceKm(startLat, startLng, destLat, destLng);

  // Default estimate reflects pooled pricing
  const fareResult = calculateFare({ distanceKm, seats, isPooled: true });

  const result = await withTransaction(async (client) => {
    const { rows: inserted } = await client.query(
      `INSERT INTO ride_requests (
         passenger_id, pickup_zone_id, dropoff_zone_id, seats, status, estimated_fare_paisa, solo_fare_paisa,
         pickup_lat, pickup_lng, dropoff_lat, dropoff_lng
       )
      VALUES ($1, $2, $3, $4, 'waiting', $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        passengerId,
        pickupZoneId,
        dropoffZoneId,
        seats,
        fareResult.finalFarePaisa,
        calculateFare({ distanceKm, seats, isPooled: false }).finalFarePaisa,
        startLat,
        startLng,
        destLat,
        destLng,
      ],
    );

    const createdReq = inserted[0];

    // Audit event
    await client.query(
      `INSERT INTO ride_events (
         request_id, actor_id, event_type, from_status, to_status, payload
       )
       VALUES ($1, $2, 'REQUEST_CREATED', NULL, 'waiting', $3)`,
      [
        createdReq.id,
        passengerId,
        JSON.stringify({
          seats,
          distanceKm,
          estimatedFarePaisa: fareResult.finalFarePaisa,
          startLat,
          startLng,
          destLat,
          destLng,
        }),
      ],
    );

    return createdReq;
  });

  return {
    request: {
      ...result,
      pickupZone: pickup,
      dropoffZone: dropoff,
      fareDetails: fareResult,
    },
  };
}

/**
 * Get current passenger's active ride request or ride
 */
export async function getActivePassengerRide(passengerId) {
  // Check for waiting or matched request, or completed ride with pending payment
  const { rows } = await query(
    `SELECT
       req.id AS request_id,
       req.seats,
       req.status AS request_status,
       req.estimated_fare_paisa,
       req.solo_fare_paisa,
       req.created_at AS request_created_at,
       COALESCE(req.pickup_lat, pz.latitude) AS pickup_lat,
       COALESCE(req.pickup_lng, pz.longitude) AS pickup_lng,
       COALESCE(req.dropoff_lat, dz.latitude) AS dropoff_lat,
       COALESCE(req.dropoff_lng, dz.longitude) AS dropoff_lng,
       pz.name AS pickup_zone_name,
       dz.name AS dropoff_zone_name,
       rp.id AS ride_passenger_id,
       rp.fare_paisa AS actual_fare_paisa,
       rp.solo_fare_paisa,
       rp.pool_savings_paisa,
       rp.status AS passenger_status,
       rd.id AS ride_id,
       rd.status AS ride_status,
       rd.occupied_seats,
       t.name AS tesla_name,
       t.capacity AS tesla_capacity,
       u.full_name AS driver_name,
       u.phone AS driver_phone,
       p.id AS payment_id,
       p.status AS payment_status,
       p.method AS payment_method,
       p.stripe_payment_intent_id,
       p.stripe_client_secret,
       rf.id AS feedback_id,
       rf.rating,
       rf.complaint
     FROM ride_requests req
     JOIN zones pz ON pz.id = req.pickup_zone_id
     JOIN zones dz ON dz.id = req.dropoff_zone_id
     LEFT JOIN ride_passengers rp ON rp.request_id = req.id AND rp.status NOT IN ('cancelled')
     LEFT JOIN rides rd ON rd.id = rp.ride_id
     LEFT JOIN payments p ON p.ride_passenger_id = rp.id
     LEFT JOIN teslas t ON t.id = rd.tesla_id
     LEFT JOIN users u ON u.id = rd.driver_id
     LEFT JOIN ride_feedback rf ON rf.request_id = req.id AND rf.submitted_by = req.passenger_id
     WHERE req.passenger_id = $1
       AND req.cancelled_at IS NULL
       AND (
         req.status = 'waiting'
         OR (req.status = 'matched' AND rd.status IN ('matched', 'driver_arrived', 'started'))
         OR (rd.status = 'completed' AND (p.status IS NULL OR p.status = 'pending'))
       )
     ORDER BY req.created_at DESC
     LIMIT 1`,
    [passengerId],
  );

  return rows[0] || null;
}

/**
 * Passenger cancels a ride request
 */
export async function cancelRideRequest({ passengerId, requestId }) {
  return withTransaction(async (client) => {
    const { rows: reqRows } = await client.query(
      `SELECT * FROM ride_requests WHERE id = $1 AND passenger_id = $2 FOR UPDATE`,
      [requestId, passengerId],
    );

    const req = reqRows[0];
    if (!req) {
      throw new AppError(404, "NOT_FOUND", "Ride request not found.");
    }

    if (req.status === "cancelled" || req.status === "completed") {
      return {
        message: "Ride request cancelled successfully.",
        requestId: req.id,
        alreadyCancelled: true,
      };
    }

    const { rows: rpRows } = await client.query(
      `SELECT * FROM ride_passengers WHERE request_id = $1 FOR UPDATE`,
      [req.id],
    );
    const rp = rpRows[0];

    let ride = null;
    if (rp) {
      const { rows: rideRows } = await client.query(
        `SELECT * FROM rides WHERE id = $1 FOR UPDATE`,
        [rp.ride_id],
      );
      ride = rideRows[0] || null;
      if (ride && ["started", "completed"].includes(ride.status)) {
        throw new AppError(
          400,
          "CANNOT_CANCEL",
          "Trip has already started. Cannot cancel now.",
        );
      }
    }

    await client.query(
      `UPDATE ride_requests
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE id = $1`,
      [req.id],
    );

    if (rp) {
      await client.query(
        `UPDATE ride_passengers SET status = 'cancelled' WHERE id = $1`,
        [rp.id],
      );
    }

    if (ride && !["completed", "cancelled"].includes(ride.status)) {
      const { rows: remaining } = await client.query(
        `SELECT COALESCE(SUM(seats), 0) AS seats
         FROM ride_passengers
         WHERE ride_id = $1 AND status NOT IN ('cancelled', 'completed')`,
        [ride.id],
      );
      const occupied = Number(remaining[0]?.seats || 0);

      if (occupied === 0) {
        await client.query(
          `UPDATE rides
           SET status = 'cancelled',
               occupied_seats = 0,
               cancelled_at = NOW(),
               cancel_reason = 'All passengers cancelled'
           WHERE id = $1`,
          [ride.id],
        );
        await client.query(
          `UPDATE teslas SET ops_status = 'online' WHERE id = $1 AND ops_status = 'on_trip'`,
          [ride.tesla_id],
        );
      } else {
        await client.query(
          `UPDATE rides SET occupied_seats = $1 WHERE id = $2`,
          [occupied, ride.id],
        );
      }
    }

    await client.query(
      `INSERT INTO ride_events (
         ride_id, request_id, actor_id, event_type, from_status, to_status, payload
       )
       VALUES ($1, $2, $3, 'PASSENGER_CANCELLED', $4, 'cancelled', '{}'::jsonb)`,
      [ride?.id || rp?.ride_id || null, req.id, passengerId, req.status],
    );

    return {
      message: "Ride request cancelled successfully.",
      requestId: req.id,
    };
  });
}

/**
 * Passenger ride history
 */
export async function getPassengerHistory(passengerId) {
  const { rows } = await query(
    `SELECT
       req.id AS request_id,
       req.seats,
       req.status AS request_status,
       req.estimated_fare_paisa,
       req.created_at,
       req.cancelled_at,
       COALESCE(req.pickup_lat, pz.latitude) AS pickup_lat,
       COALESCE(req.pickup_lng, pz.longitude) AS pickup_lng,
       COALESCE(req.dropoff_lat, dz.latitude) AS dropoff_lat,
       COALESCE(req.dropoff_lng, dz.longitude) AS dropoff_lng,
       pz.name AS pickup_zone_name,
       dz.name AS dropoff_zone_name,
       rp.fare_paisa AS final_fare_paisa,
       rp.solo_fare_paisa,
       rp.pool_savings_paisa,
       rd.status AS ride_status,
       rd.started_at,
       rd.completed_at,
       t.name AS tesla_name,
       u.full_name AS driver_name,
       p.id AS payment_id,
       p.status AS payment_status,
       p.method AS payment_method,
       p.stripe_payment_intent_id,
       p.paid_at,
       rf.id AS feedback_id,
       rf.rating,
       rf.complaint,
       rf.created_at AS feedback_created_at,
       rf.updated_at AS feedback_updated_at
     FROM ride_requests req
     JOIN zones pz ON pz.id = req.pickup_zone_id
     JOIN zones dz ON dz.id = req.dropoff_zone_id
     LEFT JOIN ride_passengers rp ON rp.request_id = req.id
     LEFT JOIN rides rd ON rd.id = rp.ride_id
     LEFT JOIN payments p ON p.ride_passenger_id = rp.id
     LEFT JOIN teslas t ON t.id = rd.tesla_id
     LEFT JOIN users u ON u.id = rd.driver_id
     LEFT JOIN ride_feedback rf ON rf.request_id = req.id AND rf.submitted_by = req.passenger_id
     WHERE req.passenger_id = $1
     ORDER BY req.created_at DESC
     LIMIT 20`,
    [passengerId],
  );
  return rows;
}
