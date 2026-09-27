import Stripe from "stripe";
import { query, withTransaction } from "../../db/pool.js";
import { env, isDev } from "../../config/env.js";
import { AppError } from "../../middleware/errorHandler.js";

let stripeInstance = null;
const useDummyMode = env.stripeDummyMode && isDev;
if (
  !useDummyMode &&
  env.stripeSecretKey &&
  !env.stripeSecretKey.includes("your_secret_key")
) {
  try {
    stripeInstance = new Stripe(env.stripeSecretKey);
  } catch (err) {
    console.error("Failed to initialize Stripe client:", err.message);
  }
}

export function getStripeConfig() {
  const publishableKey =
    env.stripePublishableKey &&
    !env.stripePublishableKey.includes("your_publishable_key")
      ? env.stripePublishableKey
      : "";
  return {
    publishableKey,
    hasSecretKey: Boolean(stripeInstance),
    isDummyMode: useDummyMode || !stripeInstance || !publishableKey,
  };
}

/**
 * Create or retrieve a payment intent for a passenger's completed ride
 */
export async function createPaymentIntent({
  passengerId,
  requestId,
  ridePassengerId,
}) {
  // 1. Fetch passenger ride booking & fare
  let rpQuery = `
    SELECT
      rp.id AS ride_passenger_id,
      rp.ride_id,
      rp.passenger_id,
      rp.request_id,
      rp.fare_paisa,
      rp.status AS passenger_status,
      rd.status AS ride_status,
      rd.driver_id,
      u.full_name AS passenger_name,
      pz.name AS pickup_zone_name,
      dz.name AS dropoff_zone_name
    FROM ride_passengers rp
    JOIN rides rd ON rd.id = rp.ride_id
    JOIN users u ON u.id = rp.passenger_id
    JOIN zones pz ON pz.id = rp.pickup_zone_id
    JOIN zones dz ON dz.id = rp.dropoff_zone_id
    WHERE rp.passenger_id = $1
  `;
  const params = [passengerId];

  if (ridePassengerId) {
    rpQuery += " AND rp.id = $2";
    params.push(ridePassengerId);
  } else if (requestId) {
    rpQuery += " AND rp.request_id = $2";
    params.push(requestId);
  } else {
    rpQuery +=
      " AND rd.status IN ('started', 'completed') ORDER BY rp.created_at DESC LIMIT 1";
  }

  const { rows: rpRows } = await query(rpQuery, params);
  const booking = rpRows[0];

  if (!booking) {
    throw new AppError(
      404,
      "NOT_FOUND",
      "Active or completed ride booking not found for payment.",
    );
  }

  const amountPaisa = Number(booking.fare_paisa);
  const amountBDT = (amountPaisa / 100).toFixed(2);

  // 2. Check for existing payment record
  const { rows: payRows } = await query(
    `SELECT * FROM payments WHERE ride_passenger_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [booking.ride_passenger_id],
  );
  let payment = payRows[0];

  if (payment && payment.status === "paid") {
    return {
      alreadyPaid: true,
      paymentId: payment.id,
      amountPaisa,
      amountBDT,
      paidAt: payment.paid_at,
      message: "This trip has already been paid for.",
    };
  }

  if (!payment) {
    const { rows: inserted } = await query(
      `INSERT INTO payments (ride_passenger_id, amount_paisa, method, status, acknowledged_by_driver)
       VALUES ($1, $2, 'stripe', 'pending', FALSE)
       RETURNING *`,
      [booking.ride_passenger_id, amountPaisa],
    );
    payment = inserted[0];
  }

  // 3. Attempt Stripe PaymentIntent if Stripe secret key is available
  if (stripeInstance && !useDummyMode) {
    try {
      let paymentIntent;
      if (
        payment.stripe_payment_intent_id &&
        !payment.stripe_payment_intent_id.startsWith("dummy_")
      ) {
        try {
          paymentIntent = await stripeInstance.paymentIntents.retrieve(
            payment.stripe_payment_intent_id,
          );
        } catch {
          paymentIntent = null;
        }
      }

      if (!paymentIntent || paymentIntent.status === "canceled") {
        try {
          // Attempt BDT currency (1 BDT = 100 paisa)
          paymentIntent = await stripeInstance.paymentIntents.create({
            amount: amountPaisa,
            currency: "bdt",
            description: `Dhaka Tesla Pool: ${booking.pickup_zone_name} to ${booking.dropoff_zone_name}`,
            metadata: {
              payment_id: payment.id,
              ride_id: booking.ride_id,
              passenger_id: passengerId,
              passenger_name: booking.passenger_name,
            },
          });
        } catch (currencyErr) {
          // If BDT is not supported by Stripe account, fallback to USD cents (approx 1 USD = 120 BDT)
          console.warn(
            "Stripe BDT currency error, falling back to USD:",
            currencyErr.message,
          );
          const usdCents = Math.max(50, Math.round(amountPaisa / 120));
          paymentIntent = await stripeInstance.paymentIntents.create({
            amount: usdCents,
            currency: "usd",
            description: `Dhaka Tesla Pool: ${booking.pickup_zone_name} to ${booking.dropoff_zone_name} (${amountBDT} BDT)`,
            metadata: {
              payment_id: payment.id,
              ride_id: booking.ride_id,
              passenger_id: passengerId,
              amount_bdt: amountBDT,
            },
          });
        }

        await query(
          `UPDATE payments
           SET stripe_payment_intent_id = $1, stripe_client_secret = $2
           WHERE id = $3`,
          [paymentIntent.id, paymentIntent.client_secret, payment.id],
        );
      }

      return {
        paymentId: payment.id,
        amountPaisa,
        amountBDT,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        isDummy: false,
      };
    } catch (stripeErr) {
      console.error("Stripe PaymentIntent creation failed:", stripeErr.message);
      throw new AppError(
        502,
        "PAYMENT_UNAVAILABLE",
        "Stripe could not start this payment. Please try again.",
      );
    }
  }

  // 4. Dummy test mode (if Stripe is not configured or in sandbox test simulation)
  if (!isDev) {
    throw new AppError(
      503,
      "PAYMENT_UNAVAILABLE",
      "Stripe payments are not configured.",
    );
  }
  const dummyClientSecret = `dummy_secret_${payment.id}_${Date.now()}`;
  const dummyIntentId = `pi_test_dummy_${payment.id}`;

  await query(
    `UPDATE payments
     SET stripe_payment_intent_id = $1,
       stripe_client_secret = $2
     WHERE id = $3`,
    [dummyIntentId, dummyClientSecret, payment.id],
  );

  return {
    paymentId: payment.id,
    amountPaisa,
    amountBDT,
    clientSecret: dummyClientSecret,
    paymentIntentId: dummyIntentId,
    isDummy: true,
  };
}

/**
 * Confirm payment and settle fare for passenger and driver
 */
export async function confirmPayment({
  passengerId,
  paymentId,
  requestId,
  paymentIntentId,
  isDummy = false,
}) {
  return withTransaction(async (client) => {
    // 1. Locate payment record
    let findQuery = `
      SELECT
        p.*,
        rp.ride_id,
        rp.request_id,
        rp.passenger_id,
        rd.driver_id,
        u.full_name AS passenger_name,
        pz.name AS pickup_zone_name,
        dz.name AS dropoff_zone_name
      FROM payments p
      JOIN ride_passengers rp ON rp.id = p.ride_passenger_id
      JOIN rides rd ON rd.id = rp.ride_id
      JOIN users u ON u.id = rp.passenger_id
      JOIN zones pz ON pz.id = rp.pickup_zone_id
      JOIN zones dz ON dz.id = rp.dropoff_zone_id
      WHERE rp.passenger_id = $1
    `;
    const params = [passengerId];

    if (paymentId) {
      findQuery += " AND p.id = $2 FOR UPDATE OF p";
      params.push(paymentId);
    } else if (requestId) {
      findQuery += " AND rp.request_id = $2 FOR UPDATE OF p";
      params.push(requestId);
    } else {
      findQuery +=
        " AND p.status = 'pending' ORDER BY p.created_at DESC LIMIT 1 FOR UPDATE OF p";
    }

    const { rows } = await client.query(findQuery, params);
    const payment = rows[0];

    if (!payment) {
      throw new AppError(404, "NOT_FOUND", "Payment record not found.");
    }

    if (payment.status === "paid") {
      return {
        success: true,
        alreadyPaid: true,
        message: "Payment has already been settled.",
        amountBDT: (Number(payment.amount_paisa) / 100).toFixed(2),
        paymentId: payment.id,
        transactionId: payment.stripe_payment_intent_id,
      };
    }

    // The server-side payment record, not the client flag, determines test mode.
    const isDummyIntent =
      payment.stripe_payment_intent_id?.startsWith("pi_test_dummy");
    let finalTxId = payment.stripe_payment_intent_id;
    if (isDummyIntent) {
      if (!isDev || (!useDummyMode && stripeInstance) || !isDummy) {
        throw new AppError(
          400,
          "INVALID_PAYMENT",
          "Test payment confirmation is not allowed.",
        );
      }
    } else {
      if (
        !stripeInstance ||
        !paymentIntentId ||
        paymentIntentId !== payment.stripe_payment_intent_id
      ) {
        throw new AppError(
          400,
          "INVALID_PAYMENT",
          "A valid Stripe payment is required.",
        );
      }
      try {
        const intent =
          await stripeInstance.paymentIntents.retrieve(paymentIntentId);
        if (intent.status !== "succeeded") {
          throw new AppError(
            400,
            "PAYMENT_NOT_SUCCEEDED",
            `Stripe payment status is ${intent.status}`,
          );
        }
        finalTxId = intent.id;
      } catch (err) {
        if (err instanceof AppError) throw err;
        console.error("Could not verify Stripe intent:", err.message);
        throw new AppError(
          502,
          "PAYMENT_VERIFICATION_FAILED",
          "Stripe payment could not be verified.",
        );
      }
    }

    // 3. Mark payment as paid
    await client.query(
      `UPDATE payments
       SET status = 'paid',
           method = 'stripe',
           stripe_payment_intent_id = $1,
           paid_at = NOW(),
           acknowledged_by_driver = FALSE
       WHERE id = $2`,
      [finalTxId, payment.id],
    );

    // 4. Mark ride passenger and ride request completed
    await client.query(
      `UPDATE ride_passengers SET status = 'completed' WHERE id = $1`,
      [payment.ride_passenger_id],
    );
    await client.query(
      `UPDATE ride_requests SET status = 'completed' WHERE id = $1`,
      [payment.request_id],
    );

    // 5. Credit driver's wallet with the earned fare!
    await client.query(
      `UPDATE wallets
       SET balance_paisa = balance_paisa + $1, updated_at = NOW()
       WHERE user_id = $2`,
      [payment.amount_paisa, payment.driver_id],
    );

    // 6. Record audit event
    await client.query(
      `INSERT INTO ride_events (ride_id, request_id, actor_id, event_type, from_status, to_status, payload)
       VALUES ($1, $2, $3, 'PAYMENT_COMPLETED', 'pending', 'paid', $4)`,
      [
        payment.ride_id,
        payment.request_id,
        passengerId,
        JSON.stringify({
          amount_paisa: payment.amount_paisa,
          amount_bdt: (payment.amount_paisa / 100).toFixed(2),
          method: "stripe",
          transaction_id: finalTxId,
        }),
      ],
    );

    return {
      success: true,
      message: "Payment completed successfully via Stripe!",
      amountBDT: (payment.amount_paisa / 100).toFixed(2),
      paymentId: payment.id,
      transactionId: finalTxId,
      paidAt: new Date().toISOString(),
    };
  });
}
