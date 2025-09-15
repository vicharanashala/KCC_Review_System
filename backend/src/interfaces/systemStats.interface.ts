import { Document,Types } from 'mongoose';

export interface ISystemStats extends Document {
  _id: Types.ObjectId;
  total_specialists: number;
  active_specialists: number;
  total_moderators: number;
  active_moderators: number;
  pending_questions: number;
  questions_in_review: number;
  golden_faqs_created: number;
  updated_at: Date;
}