import { z } from 'zod';
import { AppError } from '../../middleware/errorHandler.js';

export const updateTeslaSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  capacity: z.coerce.number().int().min(1).max(8).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['online', 'offline']),
});

export const acceptRequestSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
});

export const transitionSchema = z.object({
  action: z.enum(['arrive', 'start', 'complete', 'cancel']),
  reason: z.string().trim().max(200).optional(),
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
