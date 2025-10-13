import mongoose, { Schema } from 'mongoose';
import { INotification } from '../interfaces/notification.interface';
import { NotificationType } from '../interfaces/enums';
import { v4 as uuidv4 } from 'uuid';

const notificationSchema = new Schema<INotification>({
  notification_id: { type: String, unique: true, required: true, default: () => `N_${uuidv4().slice(0, 8).toUpperCase()}` },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: Object.values(NotificationType), required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  related_entity_type: { type: String },
  related_entity_id: { type: String },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  comments:{type: String},
  is_task_submitted: { type: Boolean, default: false }
});

export default mongoose.model<INotification>('Notification', notificationSchema);