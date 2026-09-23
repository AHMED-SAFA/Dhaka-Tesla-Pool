import { z } from 'zod';
import { AppError } from '../../middleware/errorHandler.js';

export const estimateSchema = z
  .object({
    pickupZoneId: z.string().uuid('Invalid pickup zone ID'),
    dropoffZoneId: z.string().uuid('Invalid dropoff zone ID'),
    seats: z.coerce.number().int().min(1).max(3).default(1),
    pickupLat: z.coerce.number().optional(),
    pickupLng: z.coerce.number().optional(),
    dropoffLat: z.coerce.number().optional(),
    dropoffLng: z.coerce.number().optional(),
  })
  .refine((data) => data.pickupZoneId !== data.dropoffZoneId, {
    message: 'Pickup and dropoff zones cannot be the same',
    path: ['dropoffZoneId'],
  });

export const createRideRequestSchema = z
  .object({
    pickupZoneId: z.string().uuid('Invalid pickup zone ID'),
    dropoffZoneId: z.string().uuid('Invalid dropoff zone ID'),
    seats: z.coerce.number().int().min(1).max(3).default(1),
    pickupLat: z.coerce.number().optional(),
    pickupLng: z.coerce.number().optional(),
    dropoffLat: z.coerce.number().optional(),
    dropoffLng: z.coerce.number().optional(),
  })
  .refine((data) => data.pickupZoneId !== data.dropoffZoneId, {
    message: 'Pickup and dropoff zones cannot be the same',
    path: ['dropoffZoneId'],
  });

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      next(new AppError(400, 'VALIDATION_ERROR', issue?.message || 'Invalid input', parsed.error.format()));
      return;
    }
    req[source] = parsed.data;
    next();
  };
}
