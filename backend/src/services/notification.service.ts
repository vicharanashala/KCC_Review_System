import NotificationRepository from '../repositories/notification.repository';
import { NotificationType } from '../interfaces/enums';
const notificationRepo = new NotificationRepository()
export default class NotificationService {
  async getByUserId(userId: string, skip: number = 0, limit: number = 50): Promise<any[]> {
    return notificationRepo.findByUserId(userId, skip, limit);
  }

  async markRead(notificationId: string, userId: string): Promise<any> {
    return notificationRepo.markRead(notificationId, userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepo.countUnreadByUserId(userId);
  }

  async getUnreadByUserId(userId: string, type?: NotificationType): Promise<any[]> {
    return notificationRepo.findUnreadByUserId(userId, type);
  }
}