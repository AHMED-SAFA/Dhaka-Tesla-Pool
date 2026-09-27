import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './feedback.controller.js';
import { feedbackSchema, validate } from './feedback.validators.js';

const router = Router();

// Submit or update feedback (star rating and/or complaint)
router.post('/', requireAuth, validate(feedbackSchema), controller.submitFeedback);

// Get feedback for a specific request submitted by the logged-in user
router.get('/request/:requestId', requireAuth, controller.getRequestFeedback);

// Driver reviews and rating summary
router.get('/driver', requireAuth, requireRole('driver'), controller.getDriverFeedback);

export default router;
