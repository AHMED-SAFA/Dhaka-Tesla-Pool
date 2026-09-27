import { asyncHandler } from '../../middleware/errorHandler.js';
import * as service from './payments.service.js';

export const getConfig = asyncHandler(async (req, res) => {
  const config = service.getStripeConfig();
  res.json(config);
});

export const createIntent = asyncHandler(async (req, res) => {
  const { requestId, ridePassengerId } = req.body || {};
  const result = await service.createPaymentIntent({
    passengerId: req.user.id,
    requestId,
    ridePassengerId,
  });
  res.json(result);
});

export const confirm = asyncHandler(async (req, res) => {
  const { paymentId, requestId, paymentIntentId, isDummy } = req.body || {};
  const result = await service.confirmPayment({
    passengerId: req.user.id,
    paymentId,
    requestId,
    paymentIntentId,
    isDummy: Boolean(isDummy),
  });
  res.json(result);
});
