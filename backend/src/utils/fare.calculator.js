/**
 * Dhaka Tesla Pool - Fare Calculator
 * Money is calculated and stored in integer paisa (1 BDT = 100 paisa).
 *
 * Model:
 *   passengerFare = baseFare + distanceCharge - poolDiscount
 */

// Earth radius in km
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate Haversine distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = EARTH_RADIUS_KM * c;

  // Round to 1 decimal place, minimum 1.0 km in city traffic
  return Math.max(1.0, Math.round(km * 10) / 10);
}

// Pricing constants in paisa
export const FARE_CONFIG = {
  BASE_FARE_PAISA: 5000,       // 50 BDT
  PER_KM_PAISA: 2500,          // 25 BDT / km
  SEAT_EXTRA_PAISA: 2000,      // 20 BDT per additional seat beyond 1
  POOL_DISCOUNT_PERCENT: 20,   // 20% discount when pooling
};

/**
 * Calculates fare in integer paisa.
 *
 * @param {Object} params
 * @param {number} params.distanceKm
 * @param {number} params.seats
 * @param {boolean} [params.isPooled=false]
 */
export function calculateFare({ distanceKm, seats = 1, isPooled = false }) {
  const baseFare = FARE_CONFIG.BASE_FARE_PAISA;
  const distanceCharge = Math.round(distanceKm * FARE_CONFIG.PER_KM_PAISA);
  const seatExtra = Math.max(0, seats - 1) * FARE_CONFIG.SEAT_EXTRA_PAISA;

  const rawFare = baseFare + distanceCharge + seatExtra;

  let poolDiscount = 0;
  if (isPooled) {
    poolDiscount = Math.round((rawFare * FARE_CONFIG.POOL_DISCOUNT_PERCENT) / 100);
  }

  const finalFare = rawFare - poolDiscount;

  return {
    distanceKm,
    seats,
    baseFarePaisa: baseFare,
    distanceChargePaisa: distanceCharge,
    seatExtraPaisa: seatExtra,
    rawFarePaisa: rawFare,
    poolDiscountPaisa: poolDiscount,
    finalFarePaisa: finalFare,
    baseFareBDT: (baseFare / 100).toFixed(2),
    distanceChargeBDT: (distanceCharge / 100).toFixed(2),
    poolDiscountBDT: (poolDiscount / 100).toFixed(2),
    finalFareBDT: (finalFare / 100).toFixed(2),
  };
}
