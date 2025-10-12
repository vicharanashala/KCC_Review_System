
import { Response, NextFunction } from 'express';
import DashboardService from '../services/dashboard.service';
import Joi from 'joi';
import logger from '../utils/logger.utils'; 
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const dashboardService = new DashboardService();

const daysSchema = Joi.object({
  days: Joi.number().integer().default(30).optional(),
});

type Middleware = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> | void;

export const getStats: Middleware[] = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = daysSchema.validate(req.query);
      if (error) {
        const errorMessage = error.details && error.details.length > 0 ? error.details[0]!.message : 'Invalid request parameters';
        res.status(400).json({ detail: errorMessage });
        return;
      }
      const userId = req.user._id.toString();
      const stats = await dashboardService.getStats(userId);
      res.json(stats);
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
];

export const getMyTasks: Middleware[] = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const currentUserId = req.user._id.toString();
      const currentRole = req.user.role;
      console.log("for commiting")
      const tasks = await dashboardService.getMyTasks(currentUserId, currentRole);
      res.json(tasks);
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
];
export const getUserPerformance: Middleware[] = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
     
      const currentUserId = req.user._id.toString();
      const currentRole = req.user.role;
      const tasks = await dashboardService.getUserPerformance(currentUserId, currentRole);
      res.json(tasks);
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
];
export const updateUserState: Middleware[] = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
   //  console.log("req.body====",req.params,req.body)
      const currentUserId = req.user._id.toString();
      const currentRole = req.user.role;
      const tasks = await dashboardService.updateUserState(currentUserId,req.body);
      res.json(tasks);
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
]