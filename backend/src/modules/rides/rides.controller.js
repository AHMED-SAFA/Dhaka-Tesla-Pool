import { asyncHandler } from '../../middleware/errorHandler.js';
import * as service from './rides.service.js';

export const estimate = asyncHandler(async (req, res) => {
  const result = await service.estimateRide(req.body);
  res.json(result);
});

export const createRequest = asyncHandler(async (req, res) => {
  const result = await service.createRideRequest({
    passengerId: req.user.id,
    ...req.body,
  });
  res.status(201).json(result);
});

export const getActive = asyncHandler(async (req, res) => {
  const result = await service.getActivePassengerRide(req.user.id);
  res.json({ activeRide: result });
});

export const cancelRequest = asyncHandler(async (req, res) => {
  const result = await service.cancelRideRequest({
    passengerId: req.user.id,
    requestId: req.params.id,
  });
  res.json(result);
});

export const getHistory = asyncHandler(async (req, res) => {
  const result = await service.getPassengerHistory(req.user.id);
  res.json({ history: result });
});
