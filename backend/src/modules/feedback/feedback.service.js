import { query } from '../../db/pool.js';
import { AppError } from '../../middleware/errorHandler.js';

let tableInitPromise = null;

export async function ensureFeedbackTable() {
  if (!tableInitPromise) {
    tableInitPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS ride_feedback (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_id UUID NOT NULL REFERENCES ride_requests (id) ON DELETE CASCADE,
          ride_id UUID REFERENCES rides (id) ON DELETE CASCADE,
          ride_passenger_id UUID REFERENCES ride_passengers (id) ON DELETE CASCADE,
          passenger_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
          driver_id UUID REFERENCES users (id) ON DELETE SET NULL,
          submitted_by UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
          rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
          complaint TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT uq_ride_feedback_request_user UNIQUE (request_id, submitted_by)
        );
        CREATE INDEX IF NOT EXISTS idx_ride_feedback_passenger ON ride_feedback (passenger_id);
        CREATE INDEX IF NOT EXISTS idx_ride_feedback_driver ON ride_feedback (driver_id);
        CREATE INDEX IF NOT EXISTS idx_ride_feedback_ride ON ride_feedback (ride_id);
        CREATE INDEX IF NOT EXISTS idx_ride_feedback_request ON ride_feedback (request_id);
      `);
    })().catch((err) => {
      tableInitPromise = null;
      console.error('Failed to ensure ride_feedback table:', err);
    });
  }
  return tableInitPromise;
}

/**
 * Submit or update rating & complaint for a ride
 */
export async function submitFeedback({ userId, role, requestId, rating, complaint }) {
  await ensureFeedbackTable();

  // 1. Fetch ride request and associated ride info
  const { rows } = await query(
    `SELECT
       req.id AS request_id,
       req.passenger_id,
       rp.id AS ride_passenger_id,
       rp.ride_id,
       rd.driver_id
     FROM ride_requests req
     LEFT JOIN ride_passengers rp ON rp.request_id = req.id
     LEFT JOIN rides rd ON rd.id = rp.ride_id
     WHERE req.id = $1`,
    [requestId],
  );

  const rideInfo = rows[0];
  if (!rideInfo) {
    throw new AppError(404, 'NOT_FOUND', 'Ride request not found.');
  }

  // 2. Validate authorization
  const isPassenger = rideInfo.passenger_id === userId;
  const isDriver = rideInfo.driver_id === userId;

  if (!isPassenger && !isDriver) {
    throw new AppError(403, 'FORBIDDEN', 'You are not authorized to submit feedback for this ride.');
  }

  const cleanRating = rating !== undefined && rating !== null && rating !== '' ? Number(rating) : null;
  const cleanComplaint = complaint !== undefined && complaint !== null && typeof complaint === 'string' && complaint.trim() !== ''
    ? complaint.trim()
    : null;

  // 3. Upsert feedback into ride_feedback
  const { rows: savedRows } = await query(
    `INSERT INTO ride_feedback (
       request_id,
       ride_id,
       ride_passenger_id,
       passenger_id,
       driver_id,
       submitted_by,
       rating,
       complaint,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (request_id, submitted_by)
     DO UPDATE SET
       rating = EXCLUDED.rating,
       complaint = EXCLUDED.complaint,
       updated_at = NOW()
     RETURNING *`,
    [
      rideInfo.request_id,
      rideInfo.ride_id,
      rideInfo.ride_passenger_id,
      rideInfo.passenger_id,
      rideInfo.driver_id,
      userId,
      cleanRating,
      cleanComplaint,
    ],
  );

  const feedback = savedRows[0];

  // 4. Log event
  try {
    await query(
      `INSERT INTO ride_events (ride_id, request_id, actor_id, event_type, payload)
       VALUES ($1, $2, $3, 'FEEDBACK_SUBMITTED', $4)`,
      [
        rideInfo.ride_id,
        rideInfo.request_id,
        userId,
        JSON.stringify({
          rating: cleanRating,
          has_complaint: Boolean(cleanComplaint),
          feedback_id: feedback.id,
        }),
      ],
    );
  } catch (err) {
    console.error('Could not log feedback ride_event:', err.message);
  }

  return feedback;
}

/**
 * Get feedback for a specific request submitted by the user
 */
export async function getFeedbackForRequest(requestId, userId) {
  await ensureFeedbackTable();

  const { rows } = await query(
    `SELECT * FROM ride_feedback WHERE request_id = $1 AND submitted_by = $2`,
    [requestId, userId],
  );
  return rows[0] || null;
}

/**
 * Get driver feedback summary & recent feedbacks
 */
export async function getDriverFeedback(driverId) {
  await ensureFeedbackTable();

  const { rows: stats } = await query(
    `SELECT
       COUNT(rating) AS total_ratings,
       ROUND(AVG(rating)::numeric, 1) AS avg_rating,
       COUNT(CASE WHEN complaint IS NOT NULL AND complaint <> '' THEN 1 END) AS total_complaints
     FROM ride_feedback
     WHERE driver_id = $1 AND submitted_by <> $1`,
    [driverId],
  );

  const { rows: list } = await query(
    `SELECT
       rf.id,
       rf.rating,
       rf.complaint,
       rf.created_at,
       u.full_name AS passenger_name,
       pz.name AS pickup_zone,
       dz.name AS dropoff_zone
     FROM ride_feedback rf
     JOIN users u ON u.id = rf.passenger_id
     JOIN ride_requests req ON req.id = rf.request_id
     JOIN zones pz ON pz.id = req.pickup_zone_id
     JOIN zones dz ON dz.id = req.dropoff_zone_id
     WHERE rf.driver_id = $1 AND rf.submitted_by <> $1
     ORDER BY rf.created_at DESC
     LIMIT 20`,
    [driverId],
  );

  return {
    stats: {
      totalRatings: Number(stats[0]?.total_ratings || 0),
      avgRating: stats[0]?.avg_rating ? Number(stats[0].avg_rating) : null,
      totalComplaints: Number(stats[0]?.total_complaints || 0),
    },
    feedbacks: list,
  };
}
