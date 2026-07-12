import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');

  const statusCode = err.status || err.statusCode || 500;
  
  if (err instanceof Error && err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message
    });
  }

  return res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
}
