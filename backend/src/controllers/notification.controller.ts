import { Request, Response } from "express";
import NotificationService from "../services/notification.service";
import Joi from "joi";
import logger from "../utils/logger.utils";
import { authenticateToken, AuthRequest } from "../middleware/auth.middleware";
import webPush from '../utils/webPushConfig';
import { Subscription } from '../models/Subscription';
const notificationService = new NotificationService();

const skipLimitSchema = Joi.object({
  skip: Joi.number().integer().default(0).optional(),
  limit: Joi.number().integer().default(50).optional(),
});



// Save subscription
export const saveSubscription = async (req: Request, res: Response) => {
  try {
    console.log("reaching save Subscription ")
    let { userId, subscription } = req.body;
    userId = userId.toString()
    await Subscription.findOneAndUpdate(
      { userId },
      { ...subscription },
      { upsert: true, new: true }
    );
    res.status(201).json({ message: 'Subscription saved.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving subscription.' });
  }
};

// Send notification (called when new review is assigned)
export const sendNotification = async (userId: string, message: string) => {
  try {
    const sub = await Subscription.findOne({ userId });
    console.log("sub ",sub)
    if (!sub) return console.log('No subscription found for user');

    const payload = JSON.stringify({ title: 'New Task For You!!', body: message });

    await webPush.sendNotification(sub, payload)
    .then(() => console.log('Push sent successfully'))
    .catch((err) => console.error('Push error:', err));
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};


export const getNotifications = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = skipLimitSchema.validate(req.query);
      if (error) {
        res.status(400).json({ detail: error.details[0]!.message });
        return;
      }
      const { skip = 0, limit = 50 } = req.query;
      const userId = (req as any).user._id.toString();
      const notifications = await notificationService.getByUserId(
        userId,
        parseInt(skip as string),
        parseInt(limit as string)
      );
      res.json({ notifications });
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
];

export const markNotificationRead = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { notification_id } = req.params;
      const userId = (req as any).user._id.toString();
      const notification = await notificationService.markRead(
        notification_id as string,
        userId
      );
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      logger.error(error);
      res.status(404).json({ detail: error.message });
    }
  },
];
export const markAllAsRead = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user._id.toString();
      await notificationService.markAllAsRead(userId);
      res.json({ message: "Notifications marked as read" });
    } catch (error: any) {
      logger.error(error);
      res.status(404).json({ detail: error.message });
    }
  },
];
