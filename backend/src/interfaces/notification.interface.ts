import { Document, Types } from 'mongoose';
import { NotificationType } from './enums';
import { IUser } from './user.interface';

export interface INotification extends Document {
  _id: Types.ObjectId;
  notification_id: string;
  user_id: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  created_at: Date;
  user: IUser;
}