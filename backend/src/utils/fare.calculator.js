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
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = EARTH_RADIUS_KM * c;

  // Round to 1 decimal place, minimum 1.0 km in city traffic
  return Math.max(1.0, Math.round(km * 10) / 10);
}

// Pricing constants in paisa
export const FARE_CONFIG = {
  BASE_FARE_PAISA: 5000, // 50 BDT
  PER_KM_PAISA: 2500, // 25 BDT / km
  SEAT_EXTRA_PAISA: 2000, // 20 BDT per additional seat beyond 1
  POOL_DISCOUNT_PERCENT: 10, // 10% discount when pooling
  MAX_DRIVER_EARNINGS_PER_KM_PAISA: 2500, // Shared ride revenue cap per route km
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
    poolDiscount = Math.round(
      (rawFare * FARE_CONFIG.POOL_DISCOUNT_PERCENT) / 100,
    );
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

export function allocatePooledFare(passengers) {
  if (!passengers.length) {
    return {
      totalSoloFarePaisa: 0,
      pooledTotalPaisa: 0,
      maxAllowedPaisa: 0,
      allocations: [],
    };
  }

  const totalSoloFarePaisa = passengers.reduce(
    (sum, passenger) => sum + passenger.soloFarePaisa,
    0,
  );
  const maxDistanceKm = Math.max(
    ...passengers.map((passenger) => passenger.distanceKm),
  );
  const maxAllowedPaisa =
    FARE_CONFIG.BASE_FARE_PAISA +
    Math.round(maxDistanceKm * FARE_CONFIG.MAX_DRIVER_EARNINGS_PER_KM_PAISA);
  const discountedTotalPaisa = Math.round(
    (totalSoloFarePaisa * (100 - FARE_CONFIG.POOL_DISCOUNT_PERCENT)) / 100,
  );
  const pooledTotalPaisa = Math.min(discountedTotalPaisa, maxAllowedPaisa);

  const exactShares = passengers.map(
    (passenger) =>
      (pooledTotalPaisa * passenger.soloFarePaisa) / totalSoloFarePaisa,
  );
  const allocations = exactShares.map((share, index) => ({
    ...passengers[index],
    pooledFarePaisa: Math.floor(share),
    remainder: share - Math.floor(share),
  }));
  let remainingPaisa =
    pooledTotalPaisa -
    allocations.reduce((sum, item) => sum + item.pooledFarePaisa, 0);
  allocations
    .sort((left, right) => right.remainder - left.remainder)
    .forEach((allocation) => {
      if (remainingPaisa > 0) {
        allocation.pooledFarePaisa += 1;
        remainingPaisa -= 1;
      }
    });

  return {
    totalSoloFarePaisa,
    pooledTotalPaisa,
    maxAllowedPaisa,
    allocations: allocations.map(({ remainder, ...allocation }) => ({
      ...allocation,
      poolSavingsPaisa: allocation.soloFarePaisa - allocation.pooledFarePaisa,
    })),
  };
}
