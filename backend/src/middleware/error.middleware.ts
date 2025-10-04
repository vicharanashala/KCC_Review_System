import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.utils';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
};