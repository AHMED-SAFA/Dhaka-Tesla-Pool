import { z } from 'zod';
import { AppError } from '../../middleware/errorHandler.js';

export const feedbackSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  rating: z
    .union([z.coerce.number().int().min(1).max(5), z.null(), z.undefined()])
    .optional(),
  complaint: z
    .union([z.string().max(2000), z.null(), z.undefined()])
    .optional(),
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
