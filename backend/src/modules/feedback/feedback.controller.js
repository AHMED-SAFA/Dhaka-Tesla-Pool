import { asyncHandler } from '../../middleware/errorHandler.js';
import * as service from './feedback.service.js';

export const submitFeedback = asyncHandler(async (req, res) => {
  const result = await service.submitFeedback({
    userId: req.user.id,
    role: req.user.role,
    requestId: req.body.requestId,
    rating: req.body.rating,
    complaint: req.body.complaint,
  });
  res.json({
    success: true,
    message: 'Feedback submitted successfully.',
    feedback: result,
  });
});

export const getRequestFeedback = asyncHandler(async (req, res) => {
  const result = await service.getFeedbackForRequest(req.params.requestId, req.user.id);
  res.json({ feedback: result });
});

export const getDriverFeedback = asyncHandler(async (req, res) => {
  const result = await service.getDriverFeedback(req.user.id);
  res.json(result);
});
