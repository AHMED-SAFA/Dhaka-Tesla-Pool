import { query, withTransaction } from '../../db/pool.js';
import { AppError } from '../../middleware/errorHandler.js';
import { calculateDistanceKm, calculateFare } from '../../utils/fare.calculator.js';

/**
 * Get or create Tesla for driver
 */
export async function getDriverTesla(driverId) {
  let { rows } = await query('SELECT * FROM teslas WHERE driver_id = $1', [driverId]);
  if (!rows[0]) {
    // If not found, create default Tesla
    const { rows: userRows } = await query('SELECT full_name FROM users WHERE id = $1', [driverId]);
    const driverName = userRows[0]?.full_name || 'Driver';
    const teslaName = `${driverName.split(' ')[0]}'s Bullet`;

    const { rows: created } = await query(
      `INSERT INTO teslas (driver_id, name, capacity, ops_status)
       VALUES ($1, $2, 3, 'offline')
       RETURNING *`,
      [driverId, teslaName],
    );
    return created[0];
  }
  return rows[0];
}

/**
 * Update Tesla details (name, capacity)
 */
export async function updateDriverTesla(driverId, { name, capacity }) {
  const tesla = await getDriverTesla(driverId);

  // Check if currently on trip before changing capacity
  if (capacity !== undefined && tesla.ops_status === 'on_trip') {
    throw new AppError(400, 'CANNOT_MODIFY', 'Cannot change capacity while on an active trip.');
  }

  const updates = [];
  const values = [driverId];

  if (name !== undefined) {
    values.push(name);
    updates.push(`name = $${values.length}`);
  }
  if (capacity !== undefined) {
    values.push(capacity);
    updates.push(`capacity = $${values.length}`);
  }

  if (updates.length === 0) return tesla;

  const { rows } = await query(
    `UPDATE teslas SET ${updates.join(', ')} WHERE driver_id = $1 RETURNING *`,
    values,
  );
  return rows[0];
}

/**
 * Toggle driver status: online / offline
 */
export async function updateDriverStatus(driverId, nextStatus) {
  const tesla = await getDriverTesla(driverId);

  if (nextStatus === 'offline' && tesla.ops_status === 'on_trip') {
    throw new AppError(
      400,
      'CANNOT_GO_OFFLINE',
      'Cannot go offline while on an active trip. Complete or cancel your trip first.',
    );
  }

  const { rows } = await query(
    `UPDATE teslas SET ops_status = $1 WHERE driver_id = $2 RETURNING *`,
    [nextStatus, driverId],
  );

  return rows[0];
}

/**
 * Get active ride for driver
 */
export async function getActiveDriverRide(driverId) {
  const { rows } = await query(
    `SELECT
       rd.id,
       rd.tesla_id,
       rd.driver_id,
       rd.status,
       rd.occupied_seats,
       rd.created_at,
       rd.arrived_at,
       rd.started_at,
       t.name AS tesla_name,
       t.capacity AS tesla_capacity
     FROM rides rd
     JOIN teslas t ON t.id = rd.tesla_id
     WHERE rd.driver_id = $1 AND rd.status IN ('matched', 'driver_arrived', 'started')
     ORDER BY rd.created_at DESC
     LIMIT 1`,
    [driverId],
  );

  if (!rows[0]) return null;

  const ride = rows[0];

  // Fetch passengers on this active ride
  const { rows: passengers } = await query(
    `SELECT
       rp.id AS ride_passenger_id,
       rp.request_id,
       rp.passenger_id,
       rp.seats,
       rp.fare_paisa,
       rp.status AS passenger_status,
       COALESCE(rp.pickup_lat, req.pickup_lat, pz.latitude) AS pickup_lat,
       COALESCE(rp.pickup_lng, req.pickup_lng, pz.longitude) AS pickup_lng,
       COALESCE(rp.dropoff_lat, req.dropoff_lat, dz.latitude) AS dropoff_lat,
       COALESCE(rp.dropoff_lng, req.dropoff_lng, dz.longitude) AS dropoff_lng,
       u.full_name AS passenger_name,
       u.phone AS passenger_phone,
       pz.name AS pickup_zone_name,
       dz.name AS dropoff_zone_name
     FROM ride_passengers rp
     JOIN ride_requests req ON req.id = rp.request_id
     JOIN users u ON u.id = rp.passenger_id
     JOIN zones pz ON pz.id = rp.pickup_zone_id
     JOIN zones dz ON dz.id = rp.dropoff_zone_id
     WHERE rp.ride_id = $1 AND rp.status NOT IN ('cancelled')
     ORDER BY rp.created_at ASC`,
    [ride.id],
  );

  return {
    ...ride,
    passengers,
    availableSeats: Math.max(0, ride.tesla_capacity - ride.occupied_seats),
  };
}

/**
 * List available waiting ride requests that can fit the driver's vehicle / pool
 */
export async function getAvailableRequests(driverId) {
  const tesla = await getDriverTesla(driverId);
  const activeRide = await getActiveDriverRide(driverId);

  // If driver is offline, return empty list
  if (tesla.ops_status === 'offline') {
    return {
      status: 'offline',
      availableSeats: 0,
      requests: [],
    };
  }

  const remainingSeats = activeRide
    ? Math.max(0, tesla.capacity - activeRide.occupied_seats)
    : tesla.capacity;

  // Active pickup zones in the pool to test compatibility
  const activePickupZones = activeRide
    ? new Set(activeRide.passengers.map((p) => p.pickup_zone_name))
    : new Set();

  const { rows: waiting } = await query(
    `SELECT
       req.id,
       req.seats,
       req.estimated_fare_paisa,
       req.created_at,
       u.full_name AS passenger_name,
       pz.id AS pickup_zone_id,
       pz.name AS pickup_zone_name,
       COALESCE(req.pickup_lat, pz.latitude) AS pickup_lat,
       COALESCE(req.pickup_lng, pz.longitude) AS pickup_lng,
       dz.id AS dropoff_zone_id,
       dz.name AS dropoff_zone_name,
       COALESCE(req.dropoff_lat, dz.latitude) AS dropoff_lat,
       COALESCE(req.dropoff_lng, dz.longitude) AS dropoff_lng
     FROM ride_requests req
     JOIN users u ON u.id = req.passenger_id
     JOIN zones pz ON pz.id = req.pickup_zone_id
     JOIN zones dz ON dz.id = req.dropoff_zone_id
     WHERE req.status = 'waiting'
     ORDER BY req.created_at ASC`,
  );

  const enriched = waiting.map((req) => {
    const canFit = req.seats <= remainingSeats;
    // Route compatibility: If already has passengers, compatible if sharing pickup zone or nearby
    const isCompatible =
      activePickupZones.size === 0 || activePickupZones.has(req.pickup_zone_name);

    return {
      ...req,
      canFit,
      isCompatible,
      remainingSeatsAfter: remainingSeats - req.seats,
    };
  });

  return {
    driverStatus: tesla.ops_status,
    teslaCapacity: tesla.capacity,
    occupiedSeats: activeRide ? activeRide.occupied_seats : 0,
    remainingSeats,
    hasActiveRide: Boolean(activeRide),
    requests: enriched,
  };
}

/**
 * Driver accepts a ride request into a ride / pool
 * Strictly enforces capacity with transaction and row locks!
 */
export async function acceptRideRequest(driverId, requestId) {
  return withTransaction(async (client) => {
    // 1. Lock driver's Tesla
    const { rows: teslaRows } = await client.query(
      `SELECT * FROM teslas WHERE driver_id = $1 FOR UPDATE`,
      [driverId],
    );
    const tesla = teslaRows[0];
    if (!tesla) {
      throw new AppError(404, 'NOT_FOUND', 'Tesla vehicle not found for driver.');
    }

    if (tesla.ops_status === 'offline') {
      throw new AppError(400, 'DRIVER_OFFLINE', 'You must go online before accepting rides.');
    }

    // 2. Lock and check the ride request
    const { rows: reqRows } = await client.query(
      `SELECT req.*, pz.latitude AS p_lat, pz.longitude AS p_lng, dz.latitude AS d_lat, dz.longitude AS d_lng
       FROM ride_requests req
       JOIN zones pz ON pz.id = req.pickup_zone_id
       JOIN zones dz ON dz.id = req.dropoff_zone_id
       WHERE req.id = $1 FOR UPDATE`,
      [requestId],
    );
    const request = reqRows[0];
    if (!request) {
      throw new AppError(404, 'NOT_FOUND', 'Ride request not found.');
    }
    if (request.status !== 'waiting') {
      throw new AppError(409, 'REQUEST_TAKEN', 'This ride request is no longer available.');
    }

    // Calculate individual fare
    const distanceKm = calculateDistanceKm(
      Number(request.p_lat),
      Number(request.p_lng),
      Number(request.d_lat),
      Number(request.d_lng),
    );
    const fareInfo = calculateFare({ distanceKm, seats: request.seats, isPooled: true });

    // 3. Check if driver already has an active ride in progress
    const { rows: rideRows } = await client.query(
      `SELECT * FROM rides
       WHERE driver_id = $1 AND status IN ('matched', 'driver_arrived')
       FOR UPDATE`,
      [driverId],
    );

    let ride = rideRows[0];

    if (ride) {
      // Multiple requests sharing one Tesla: Check capacity!
      const newOccupied = ride.occupied_seats + request.seats;
      if (newOccupied > tesla.capacity) {
        throw new AppError(
          409,
          'CAPACITY_EXCEEDED',
          `Cannot accept: ${tesla.name} has only ${tesla.capacity - ride.occupied_seats} seats remaining. Requested: ${request.seats}.`,
        );
      }

      // Update occupied seats on existing ride
      const { rows: updatedRide } = await client.query(
        `UPDATE rides SET occupied_seats = $1 WHERE id = $2 RETURNING *`,
        [newOccupied, ride.id],
      );
      ride = updatedRide[0];
    } else {
      // Check if seats exceed Tesla's total capacity
      if (request.seats > tesla.capacity) {
        throw new AppError(
          409,
          'CAPACITY_EXCEEDED',
          `Requested seats (${request.seats}) exceed total vehicle capacity (${tesla.capacity}).`,
        );
      }

      // Create a brand new ride/pool
      const { rows: createdRide } = await client.query(
        `INSERT INTO rides (tesla_id, driver_id, status, occupied_seats)
         VALUES ($1, $2, 'matched', $3)
         RETURNING *`,
        [tesla.id, driverId, request.seats],
      );
      ride = createdRide[0];

      // Set Tesla to on_trip
      await client.query(`UPDATE teslas SET ops_status = 'on_trip' WHERE id = $1`, [tesla.id]);
    }

    const pLat = request.pickup_lat !== null && request.pickup_lat !== undefined ? Number(request.pickup_lat) : Number(request.p_lat);
    const pLng = request.pickup_lng !== null && request.pickup_lng !== undefined ? Number(request.pickup_lng) : Number(request.p_lng);
    const dLat = request.dropoff_lat !== null && request.dropoff_lat !== undefined ? Number(request.dropoff_lat) : Number(request.d_lat);
    const dLng = request.dropoff_lng !== null && request.dropoff_lng !== undefined ? Number(request.dropoff_lng) : Number(request.d_lng);

    // 4. Add passenger to ride
    const { rows: insertedPassenger } = await client.query(
      `INSERT INTO ride_passengers (
         ride_id, request_id, passenger_id, pickup_zone_id, dropoff_zone_id, seats, fare_paisa, status,
         pickup_lat, pickup_lng, dropoff_lat, dropoff_lng
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8, $9, $10, $11)
       RETURNING *`,
      [
        ride.id,
        request.id,
        request.passenger_id,
        request.pickup_zone_id,
        request.dropoff_zone_id,
        request.seats,
        fareInfo.finalFarePaisa,
        pLat,
        pLng,
        dLat,
        dLng,
      ],
    );

    // 5. Update request status to 'matched'
    await client.query(
      `UPDATE ride_requests SET status = 'matched' WHERE id = $1`,
      [request.id],
    );

    // 6. Audit event
    await client.query(
      `INSERT INTO ride_events (
         ride_id, request_id, actor_id, event_type, from_status, to_status, payload
       )
       VALUES ($1, $2, $3, 'PASSENGER_ADDED_TO_POOL', 'waiting', 'matched', $4)`,
      [
        ride.id,
        request.id,
        driverId,
        JSON.stringify({
          seats: request.seats,
          occupiedSeats: ride.occupied_seats,
          capacity: tesla.capacity,
          farePaisa: fareInfo.finalFarePaisa,
        }),
      ],
    );

    return {
      message: 'Request accepted and added to pool.',
      rideId: ride.id,
      occupiedSeats: ride.occupied_seats,
      capacity: tesla.capacity,
      passenger: insertedPassenger[0],
    };
  });
}

/**
 * Driver progresses ride lifecycle
 * MATCHED -> DRIVER_ARRIVED -> STARTED -> COMPLETED (+ CANCELLED)
 */
export async function transitionRide(driverId, { action, reason }) {
  return withTransaction(async (client) => {
    const { rows: rideRows } = await client.query(
      `SELECT rd.*, t.capacity AS tesla_capacity, t.id AS tesla_id
       FROM rides rd
       JOIN teslas t ON t.id = rd.tesla_id
       WHERE rd.driver_id = $1 AND rd.status IN ('matched', 'driver_arrived', 'started')
       FOR UPDATE`,
      [driverId],
    );

    const ride = rideRows[0];
    if (!ride) {
      throw new AppError(404, 'NOT_FOUND', 'No active ride found to update.');
    }

    const currentStatus = ride.status;

    if (action === 'arrive') {
      if (currentStatus !== 'matched') {
        throw new AppError(400, 'INVALID_TRANSITION', `Cannot mark arrived from status '${currentStatus}'.`);
      }
      await client.query(
        `UPDATE rides SET status = 'driver_arrived', arrived_at = NOW() WHERE id = $1`,
        [ride.id],
      );
      await client.query(
        `INSERT INTO ride_events (ride_id, actor_id, event_type, from_status, to_status)
         VALUES ($1, $2, 'DRIVER_ARRIVED', 'matched', 'driver_arrived')`,
        [ride.id, driverId],
      );
      return { status: 'driver_arrived', message: 'Marked arrived at pickup.' };
    }

    if (action === 'start') {
      if (currentStatus !== 'driver_arrived') {
        throw new AppError(400, 'INVALID_TRANSITION', `Cannot start trip from status '${currentStatus}'. Mark arrival first.`);
      }
      await client.query(
        `UPDATE rides SET status = 'started', started_at = NOW() WHERE id = $1`,
        [ride.id],
      );
      await client.query(
        `UPDATE ride_passengers SET status = 'in_progress' WHERE ride_id = $1 AND status = 'confirmed'`,
        [ride.id],
      );
      await client.query(
        `INSERT INTO ride_events (ride_id, actor_id, event_type, from_status, to_status)
         VALUES ($1, $2, 'TRIP_STARTED', 'driver_arrived', 'started')`,
        [ride.id, driverId],
      );
      return { status: 'started', message: 'Trip has started.' };
    }

    if (action === 'complete') {
      if (currentStatus !== 'started') {
        throw new AppError(400, 'INVALID_TRANSITION', `Cannot complete trip from status '${currentStatus}'. Trip must be started first.`);
      }

      // Mark ride completed
      await client.query(
        `UPDATE rides
         SET status = 'completed', completed_at = NOW(), occupied_seats = 0
         WHERE id = $1`,
        [ride.id],
      );

      // Mark all passengers on ride completed
      const { rows: passengers } = await client.query(
        `UPDATE ride_passengers
         SET status = 'completed'
         WHERE ride_id = $1 AND status = 'in_progress'
         RETURNING id, request_id, passenger_id, fare_paisa`,
        [ride.id],
      );

      // Mark all requests completed and simulate payment records
      let totalEarnedPaisa = 0;
      for (const p of passengers) {
        await client.query(
          `UPDATE ride_requests SET status = 'completed' WHERE id = $1`,
          [p.request_id],
        );

        // Record payment
        await client.query(
          `INSERT INTO payments (ride_passenger_id, amount_paisa, method, status)
           VALUES ($1, $2, 'tesla_pay', 'paid')`,
          [p.id, p.fare_paisa],
        );

        // Deduct from passenger wallet
        await client.query(
          `UPDATE wallets
           SET balance_paisa = GREATEST(0, balance_paisa - $1), updated_at = NOW()
           WHERE user_id = $2`,
          [p.fare_paisa, p.passenger_id],
        );

        totalEarnedPaisa += p.fare_paisa;
      }

      // Credit driver wallet
      await client.query(
        `UPDATE wallets
         SET balance_paisa = balance_paisa + $1, updated_at = NOW()
         WHERE user_id = $2`,
        [totalEarnedPaisa, driverId],
      );

      // Reset driver Tesla back to online
      await client.query(
        `UPDATE teslas SET ops_status = 'online' WHERE id = $1`,
        [ride.tesla_id],
      );

      // Audit event
      await client.query(
        `INSERT INTO ride_events (ride_id, actor_id, event_type, from_status, to_status, payload)
         VALUES ($1, $2, 'TRIP_COMPLETED', 'started', 'completed', $3)`,
        [ride.id, driverId, JSON.stringify({ totalEarnedPaisa, passengersCount: passengers.length })],
      );

      return {
        status: 'completed',
        message: 'Trip completed successfully!',
        totalEarnedPaisa,
        totalEarnedBDT: (totalEarnedPaisa / 100).toFixed(2),
      };
    }

    if (action === 'cancel') {
      await client.query(
        `UPDATE rides
         SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = $1, occupied_seats = 0
         WHERE id = $2`,
        [reason || 'Driver cancelled', ride.id],
      );

      // Return active passengers back to waiting status or cancel
      const { rows: passengers } = await client.query(
        `UPDATE ride_passengers
         SET status = 'cancelled'
         WHERE ride_id = $1 AND status IN ('confirmed', 'pending')
         RETURNING request_id`,
        [ride.id],
      );

      for (const p of passengers) {
        await client.query(
          `UPDATE ride_requests SET status = 'waiting' WHERE id = $1`,
          [p.request_id],
        );
      }

      // Reset Tesla status to online
      await client.query(
        `UPDATE teslas SET ops_status = 'online' WHERE id = $1`,
        [ride.tesla_id],
      );

      await client.query(
        `INSERT INTO ride_events (ride_id, actor_id, event_type, from_status, to_status, payload)
         VALUES ($1, $2, 'DRIVER_CANCELLED', $3, 'cancelled', $4)`,
        [ride.id, driverId, currentStatus, JSON.stringify({ reason })],
      );

      return { status: 'cancelled', message: 'Trip cancelled. Passengers returned to queue.' };
    }

    throw new AppError(400, 'INVALID_ACTION', `Unknown action: ${action}`);
  });
}

/**
 * Driver ride history
 */
export async function getDriverHistory(driverId) {
  const { rows } = await query(
    `SELECT
       rd.id,
       rd.status,
       rd.created_at,
       rd.started_at,
       rd.completed_at,
       t.name AS tesla_name,
       COUNT(rp.id) AS passenger_count,
       COALESCE(SUM(rp.fare_paisa), 0) AS total_fare_paisa
     FROM rides rd
     JOIN teslas t ON t.id = rd.tesla_id
     LEFT JOIN ride_passengers rp ON rp.ride_id = rd.id
     WHERE rd.driver_id = $1
     GROUP BY rd.id, t.name
     ORDER BY rd.created_at DESC
     LIMIT 20`,
    [driverId],
  );

  return rows.map((r) => ({
    ...r,
    total_fare_bdt: (Number(r.total_fare_paisa) / 100).toFixed(2),
  }));
}
