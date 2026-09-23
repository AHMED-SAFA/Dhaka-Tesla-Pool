import { Router } from 'express';
import { listZones } from './zones.controller.js';

const router = Router();

router.get('/', listZones);

export default router;
