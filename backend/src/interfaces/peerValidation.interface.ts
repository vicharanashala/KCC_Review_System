import { Document, Types } from 'mongoose';
import { PeerStatus } from './enums';
import { IAnswer } from './answer.interface';
import { IUser } from './user.interface';

export interface IPeerValidation extends Document {
  _id: Types.ObjectId;
  peer_validation_id: string;
  answer_id?: Types.ObjectId;
  reviewer_id: Types.ObjectId;
  status: PeerStatus;
  comments?: string;
  created_at: Date;
  answer: IAnswer;
  reviewer: IUser;
  question_id?:string;
  related_answer_id?:string
}