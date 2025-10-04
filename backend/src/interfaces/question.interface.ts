import { Document, Types } from 'mongoose';
import { QuestionStatus } from './enums';

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  question_id: string;
  crop?: string;
  state?: string;
  district?: string;
  block_name?: string;
  query_type?: string;
  season?: string;
  sector?: string;
  original_query_text: string;
  refined_query_text?: string;
  latitude?: string;
  longitude?: string;
  status: QuestionStatus;
  assigned_specialist_id?: Types.ObjectId;
  priority?: string;
  valid_count: number;
  consecutive_peer_approvals: number;
  reviewed_by_specialists: Types.ObjectId[];
  created_at: Date;
  updated_at: Date;
  user_id:string;
  KccAns:string;
}