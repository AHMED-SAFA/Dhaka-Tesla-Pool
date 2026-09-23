import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import zonesRoutes from './modules/zones/zones.routes.js';
import ridesRoutes from './modules/rides/rides.routes.js';
import driversRoutes from './modules/drivers/drivers.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  if (env.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }
  app.use(helmet());
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'dhaka-tesla-pool-api' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/zones', zonesRoutes);
  app.use('/api/rides', ridesRoutes);
  app.use('/api/drivers', driversRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
  });
  app.use(errorHandler);
  return app;
}
