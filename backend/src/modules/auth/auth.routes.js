import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from './auth.controller.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Try again later.' } },
});

router.use(authLimiter);

router.post('/register', ...auth.register);
router.post('/login', ...auth.login);
router.post('/verify-email', ...auth.verifyEmail);
router.get('/verify-email', auth.verifyEmailLink);
router.post('/resend-verification', ...auth.resend);
router.post('/forgot-password', ...auth.forgot);
router.post('/reset-password', ...auth.reset);
router.get('/me', ...auth.me);

export default router;
