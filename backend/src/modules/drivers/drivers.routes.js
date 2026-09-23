import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './drivers.controller.js';
import {
  acceptRequestSchema,
  transitionSchema,
  updateStatusSchema,
  updateTeslaSchema,
  validate,
} from './drivers.validators.js';

const router = Router();

// Driver authentication & role check
router.use(requireAuth, requireRole('driver'));

router.get('/tesla', controller.getTesla);
router.patch('/tesla', validate(updateTeslaSchema), controller.updateTesla);
router.post('/status', validate(updateStatusSchema), controller.updateStatus);
router.get('/active-ride', controller.getActiveRide);
router.get('/available-requests', controller.getAvailableRequests);
router.post('/rides/accept', validate(acceptRequestSchema), controller.acceptRequest);
router.post('/rides/transition', validate(transitionSchema), controller.transition);
router.get('/history', controller.getHistory);

export default router;
