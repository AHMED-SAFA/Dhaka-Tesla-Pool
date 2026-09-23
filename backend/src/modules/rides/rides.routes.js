import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './rides.controller.js';
import { createRideRequestSchema, estimateSchema, validate } from './rides.validators.js';

const router = Router();

// Estimate fare (can be called by any authenticated user or passenger)
router.post('/estimate', requireAuth, validate(estimateSchema), controller.estimate);

// Passenger-specific endpoints
router.use(requireAuth, requireRole('passenger'));

router.post('/requests', validate(createRideRequestSchema), controller.createRequest);
router.get('/requests/active', controller.getActive);
router.post('/requests/:id/cancel', controller.cancelRequest);
router.get('/requests/history', controller.getHistory);

export default router;
