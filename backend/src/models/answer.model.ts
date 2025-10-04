import mongoose, { Schema } from 'mongoose';
import { IAnswer } from '../interfaces/answer.interface';
import { v4 as uuidv4 } from 'uuid';
import { number } from 'joi';

const answerSchema = new Schema<IAnswer>({
  answer_id: { type: String, unique: true, required: true, default: () => `A_${uuidv4().slice(0, 8).toUpperCase()}`},
  question_id: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  specialist_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  answer_text: { type: String, required: true },
  sources: { type: [{ name: String, link: String,id:Number }], default: [] },
  version: { type: Number, default: 1 },
  is_current: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  first_answered_person: { type: Schema.Types.ObjectId, ref: 'Question'},
  original_query_text:{ type: String},
  original_question_id:{type:String},
  RevisedAnswer:{ type: Boolean, default: false}
});

answerSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model<IAnswer>('Answer', answerSchema);