import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  if (status >= 500) {
    logger.error(err.message, { stack: env.NODE_ENV === 'development' ? err.stack : undefined });
  } else if (status === 401 || status === 404) {
    logger.info(err.message, { status, path: req.path });
  } else {
    logger.warn(err.message, { status, path: req.path });
  }
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' && status >= 500 ? 'An unexpected error occurred' : err.message,
    },
  });
}

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
