import Notification from "../models/notification.model";
import { INotification } from "../interfaces/notification.interface";
import { NotificationType } from "../interfaces/enums";
import { FilterQuery } from "mongoose";
import mongoose, { Types } from "mongoose";

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

  async findByQuestion(question_id: string): Promise<INotification[]> {
    const notification= await Notification.find({  related_entity_id:question_id});
  //  console.log("the first notificaj===",notification)
    return notification
  }
  /*async findAndUpdateNotification(
    userId: string | Types.ObjectId,
    type:string
  ): Promise<boolean> {
    try {
      console.log("**********the updated document=======",userId)
      const result = await Notification.updateMany(
        { user_id: new mongoose.Types.ObjectId(userId) },
        { $set: { type:  type} }
      );
  console.log("the updated document=======",result)
      if (!result) {
        console.warn(`⚠️ Notification not found: ${userId}`);
        return false;
      }
  
      return true;
    } catch (err) {
      console.error("❌ Error updating notification:", err);
      return false;
    }
  }*/
  async  updateNotificationsByUserAndQuestion(
    userId: string,
    newType:string,
    questionId: string,
    
  ): Promise<number> {
    try {
      const result = await Notification.updateMany(
        {
          user_id: new mongoose.Types.ObjectId(userId), // filter by user
          related_entity_id: questionId,               // filter by question
        },
        { $set: { type: newType } }
      );
  
      console.log(`✅ Updated ${result.modifiedCount} notifications for user ${userId} and question ${questionId}`);
      return result.modifiedCount;
    } catch (err) {
      console.error("❌ Error updating notifications:", err);
      return 0;
    }
  }
}
