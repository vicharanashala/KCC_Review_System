import { Document, Types } from 'mongoose';
import { IQuestion } from './question.interface';
import { IAnswer } from './answer.interface';
import { IUser } from './user.interface';

export interface IGoldenFAQ extends Document {
  _id: Types.ObjectId;
  faq_id: string;
  question_id: Types.ObjectId;
  final_answer_id: Types.ObjectId;
  question_text: string;
  final_answer_text: string;
  category?: string;
  crop?: string;
  sources?: { name: string; link: string }[];
  tags?: string[];
  created_by: Types.ObjectId;
  is_published: boolean;
  view_count: number;
  created_at: Date;
  question: IQuestion;
  final_answer: IAnswer;
  created_by_user: IUser;
}