import { asyncHandler } from '../../middleware/errorHandler.js';
import * as service from './drivers.service.js';

export const getTesla = asyncHandler(async (req, res) => {
  const result = await service.getDriverTesla(req.user.id);
  res.json({ tesla: result });
});

export const updateTesla = asyncHandler(async (req, res) => {
  const result = await service.updateDriverTesla(req.user.id, req.body);
  res.json({ tesla: result });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const result = await service.updateDriverStatus(req.user.id, req.body.status);
  res.json({ tesla: result });
});

export const getActiveRide = asyncHandler(async (req, res) => {
  const result = await service.getActiveDriverRide(req.user.id);
  res.json({ activeRide: result });
});

export const getAvailableRequests = asyncHandler(async (req, res) => {
  const result = await service.getAvailableRequests(req.user.id);
  res.json(result);
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const result = await service.acceptRideRequest(req.user.id, req.body.requestId);
  res.json(result);
});

export const transition = asyncHandler(async (req, res) => {
  const result = await service.transitionRide(req.user.id, req.body);
  res.json(result);
});

export const getHistory = asyncHandler(async (req, res) => {
  const result = await service.getDriverHistory(req.user.id);
  res.json({ history: result });
});

export const getPaymentAlerts = asyncHandler(async (req, res) => {
  const alerts = await service.getDriverPaymentAlerts(req.user.id);
  res.json({ alerts });
});

export const dismissPaymentAlert = asyncHandler(async (req, res) => {
  const result = await service.dismissDriverPaymentAlert(req.user.id, req.params.id);
  res.json(result);
});
