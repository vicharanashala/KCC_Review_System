import { Document, Types } from 'mongoose';
import { IQuestion } from './question.interface';
import { IUser } from './user.interface';

export interface IAnswer extends Document {
  _id: Types.ObjectId;
  answer_id: string;
  question_id: Types.ObjectId | IQuestion;
  specialist_id: Types.ObjectId;
  answer_text: string;
  sources?: { name: string; link: string }[];
  version: number;
  is_current: boolean;
  created_at: Date;
  updated_at: Date;
  question: IQuestion;
  specialist: IUser;
  first_answered_person:Types.ObjectId | IQuestion
  original_query_text:string
  original_question_id:string;
  RevisedAnswer: boolean;
  RevisionSuccess: boolean;
  

  
}