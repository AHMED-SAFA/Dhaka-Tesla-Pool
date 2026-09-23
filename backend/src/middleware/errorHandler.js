export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = err.status || 500;
  const body = {
    error: {
      code: err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR'),
      message: status === 500 ? 'Something went wrong.' : err.message,
      ...(err.details ? { details: err.details } : {}),
    },
  };

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json(body);
}
