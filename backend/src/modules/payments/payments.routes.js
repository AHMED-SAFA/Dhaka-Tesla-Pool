import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './payments.controller.js';

const router = Router();

// Public config to get publishable key
router.get('/config', controller.getConfig);

// Passenger endpoints for initiating and confirming Stripe payments
router.post('/create-intent', requireAuth, requireRole('passenger'), controller.createIntent);
router.post('/confirm', requireAuth, requireRole('passenger'), controller.confirm);

export default router;
