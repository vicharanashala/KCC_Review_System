import mongoose, { Schema } from 'mongoose';
import { IQuestion } from '../interfaces/question.interface';
import { QuestionStatus } from '../interfaces/enums';
import { v4 as uuidv4 } from 'uuid';


export interface ILLMQuestion {
  _id?: string;            
  crop?: string;
  state?: string;
  district?: string;
  query_type?: string;
  season?: string;
  sector?: string;
  original_query_text: string;  
  KccAns?: string;              
  created_at?: Date;
  updated_at?: Date;
}

const LLMQuestionSchema = new Schema<ILLMQuestion>({
  crop: { type: String },
  state: { type: String },
  district: { type: String },
  query_type: { type: String },
  season: { type: String },
  sector: { type: String },
  original_query_text: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  KccAns:{type:String},
});

LLMQuestionSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model<ILLMQuestion>('LLMQuestion', LLMQuestionSchema);



