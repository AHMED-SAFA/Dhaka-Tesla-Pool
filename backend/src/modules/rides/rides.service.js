import { query, withTransaction } from '../../db/pool.js';
import { AppError } from '../../middleware/errorHandler.js';
import { calculateDistanceKm, calculateFare } from '../../utils/fare.calculator.js';

/**
 * Get zone by ID or throw error
 */
async function getZoneOrThrow(client, zoneId, label = 'Zone') {
  const { rows } = await client.query('SELECT * FROM zones WHERE id = $1', [zoneId]);
  if (!rows[0]) {
    throw new AppError(404, 'NOT_FOUND', `${label} not found`);
  }
  return rows[0];
}

/**
 * Estimate fare between two zones
 */
export async function estimateRide({ pickupZoneId, dropoffZoneId, seats }) {
  const pickup = await getZoneOrThrow({ query }, pickupZoneId, 'Pickup zone');
  const dropoff = await getZoneOrThrow({ query }, dropoffZoneId, 'Dropoff zone');

  const distanceKm = calculateDistanceKm(
    Number(pickup.latitude),
    Number(pickup.longitude),
    Number(dropoff.latitude),
    Number(dropoff.longitude),
  );

  const soloFare = calculateFare({ distanceKm, seats, isPooled: false });
  const pooledFare = calculateFare({ distanceKm, seats, isPooled: true });

  return {
    pickupZone: pickup,
    dropoffZone: dropoff,
    distanceKm,
    seats,
    soloFare,
    pooledFare,
    estimatedFarePaisa: pooledFare.finalFarePaisa,
    estimatedFareBDT: pooledFare.finalFareBDT,
  };
}

/**
 * Passenger requests a ride
 */
export async function createRideRequest({ passengerId, pickupZoneId, dropoffZoneId, seats }) {
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
      'ACTIVE_REQUEST_EXISTS',
      'You already have an active ride request in progress.',
    );
  }

  const pickup = await getZoneOrThrow({ query }, pickupZoneId, 'Pickup zone');
  const dropoff = await getZoneOrThrow({ query }, dropoffZoneId, 'Dropoff zone');

  const distanceKm = calculateDistanceKm(
    Number(pickup.latitude),
    Number(pickup.longitude),
    Number(dropoff.latitude),
    Number(dropoff.longitude),
  );

  // Default estimate reflects pooled pricing
  const fareResult = calculateFare({ distanceKm, seats, isPooled: true });

  const result = await withTransaction(async (client) => {
    const { rows: inserted } = await client.query(
      `INSERT INTO ride_requests (
         passenger_id, pickup_zone_id, dropoff_zone_id, seats, status, estimated_fare_paisa
       )
       VALUES ($1, $2, $3, $4, 'waiting', $5)
       RETURNING *`,
      [passengerId, pickupZoneId, dropoffZoneId, seats, fareResult.finalFarePaisa],
    );

    const createdReq = inserted[0];

    // Audit event
    await client.query(
      `INSERT INTO ride_events (
         request_id, actor_id, event_type, from_status, to_status, payload
       )
       VALUES ($1, $2, 'REQUEST_CREATED', NULL, 'waiting', $3)`,
      [createdReq.id, passengerId, JSON.stringify({ seats, distanceKm, estimatedFarePaisa: fareResult.finalFarePaisa })],
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
  // Check for waiting or matched request
  const { rows } = await query(
    `SELECT
       req.id AS request_id,
       req.seats,
       req.status AS request_status,
       req.estimated_fare_paisa,
       req.created_at AS request_created_at,
       pz.name AS pickup_zone_name,
       dz.name AS dropoff_zone_name,
       rp.fare_paisa AS actual_fare_paisa,
       rp.status AS passenger_status,
       rd.id AS ride_id,
       rd.status AS ride_status,
       rd.occupied_seats,
       t.name AS tesla_name,
       t.capacity AS tesla_capacity,
       u.full_name AS driver_name,
       u.phone AS driver_phone
     FROM ride_requests req
     JOIN zones pz ON pz.id = req.pickup_zone_id
     JOIN zones dz ON dz.id = req.dropoff_zone_id
     LEFT JOIN ride_passengers rp ON rp.request_id = req.id
     LEFT JOIN rides rd ON rd.id = rp.ride_id
     LEFT JOIN teslas t ON t.id = rd.tesla_id
     LEFT JOIN users u ON u.id = rd.driver_id
     WHERE req.passenger_id = $1
       AND (
         req.status = 'waiting'
         OR (req.status = 'matched' AND rd.status NOT IN ('completed', 'cancelled'))
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
      throw new AppError(404, 'NOT_FOUND', 'Ride request not found.');
    }

    if (req.status === 'cancelled' || req.status === 'completed') {
      throw new AppError(400, 'INVALID_STATE', `Request is already ${req.status}.`);
    }

    // Check if assigned to an active ride
    const { rows: rpRows } = await client.query(
      `SELECT rp.*, rd.status AS ride_status, rd.id AS ride_id, rd.tesla_id
       FROM ride_passengers rp
       JOIN rides rd ON rd.id = rp.ride_id
       WHERE rp.request_id = $1 FOR UPDATE`,
      [req.id],
    );

    const rp = rpRows[0];
    if (rp && ['started', 'completed'].includes(rp.ride_status)) {
      throw new AppError(400, 'CANNOT_CANCEL', 'Trip has already started. Cannot cancel now.');
    }

    // Cancel request
    await client.query(
      `UPDATE ride_requests
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE id = $1`,
      [req.id],
    );

    if (rp) {
      // Cancel passenger on ride
      await client.query(
        `UPDATE ride_passengers SET status = 'cancelled' WHERE id = $1`,
        [rp.id],
      );

      // Decrement occupied seats on ride
      await client.query(
        `UPDATE rides
         SET occupied_seats = GREATEST(0, occupied_seats - $1)
         WHERE id = $2`,
        [rp.seats, rp.ride_id],
      );

      // Check if there are other active passengers on this ride
      const { rows: otherPassengers } = await client.query(
        `SELECT COUNT(*) AS count
         FROM ride_passengers
         WHERE ride_id = $1 AND status NOT IN ('cancelled')`,
        [rp.ride_id],
      );

      if (Number(otherPassengers[0]?.count) === 0) {
        // No passengers left on ride, mark ride cancelled and set tesla online
        await client.query(
          `UPDATE rides SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'All passengers cancelled'
           WHERE id = $1`,
          [rp.ride_id],
        );
        await client.query(
          `UPDATE teslas SET ops_status = 'online' WHERE id = $1`,
          [rp.tesla_id],
        );
      }
    }

    // Audit log
    await client.query(
      `INSERT INTO ride_events (
         ride_id, request_id, actor_id, event_type, from_status, to_status, payload
       )
       VALUES ($1, $2, $3, 'PASSENGER_CANCELLED', $4, 'cancelled', '{}')`,
      [rp?.ride_id || null, req.id, passengerId, req.status],
    );

    return { message: 'Ride request cancelled successfully.' };
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
       pz.name AS pickup_zone_name,
       dz.name AS dropoff_zone_name,
       rp.fare_paisa AS final_fare_paisa,
       rd.status AS ride_status,
       rd.started_at,
       rd.completed_at,
       t.name AS tesla_name,
       u.full_name AS driver_name
     FROM ride_requests req
     JOIN zones pz ON pz.id = req.pickup_zone_id
     JOIN zones dz ON dz.id = req.dropoff_zone_id
     LEFT JOIN ride_passengers rp ON rp.request_id = req.id
     LEFT JOIN rides rd ON rd.id = rp.ride_id
     LEFT JOIN teslas t ON t.id = rd.tesla_id
     LEFT JOIN users u ON u.id = rd.driver_id
     WHERE req.passenger_id = $1
     ORDER BY req.created_at DESC
     LIMIT 20`,
    [passengerId],
  );
  return rows;
}
