import { Document, Types } from 'mongoose';
import { ValidationStatus } from './enums';
import { IAnswer } from './answer.interface';
import { IUser } from './user.interface';

export interface IValidation extends Document {
  _id: Types.ObjectId;
  validation_id: string;
  answer_id: Types.ObjectId;
  moderator_id: Types.ObjectId;
  validation_status: ValidationStatus;
  comments?: string;
  validation_sequence: number;
  created_at: Date;

  answer: IAnswer;
  moderator: IUser;
}