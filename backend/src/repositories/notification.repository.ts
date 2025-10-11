import Notification from "../models/notification.model";
import { INotification } from "../interfaces/notification.interface";
import { NotificationType } from "../interfaces/enums";
import { FilterQuery } from "mongoose";

export default class NotificationRepository {
  async create(
    notificationData: Partial<INotification>
  ): Promise<INotification> {
    return Notification.create(notificationData);
  }

  async findByUserId(
    userId: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<INotification[]> {
    return Notification.find({ user_id: userId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user_id");
  }

  async findAllByUserId(userId:string){
    const notifications=await Notification.find({user_id:userId})
    // console.log("Notificatons ",notifications)
    return notifications

  }

  async findUnreadByUserId(
    userId: string,
    type?: NotificationType
  ): Promise<INotification[]> {
    let query: FilterQuery<INotification> = { user_id: userId, is_read: false };
    if (type) query.type = type;
    return Notification.find(query).populate("user_id");
  }

  async markRead(
    notificationId: string,
    userId: string
  ): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { notification_id: notificationId, user_id: userId },
      { is_read: true },
      { new: true }
    ).populate("user_id");
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await Notification.updateMany(
      { user_id: userId, is_read: false },
      { $set: { is_read: true } }
    );

    return { modifiedCount: result.modifiedCount };
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return Notification.countDocuments({ user_id: userId, is_read: false });
  }
}
