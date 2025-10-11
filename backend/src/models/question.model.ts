import mongoose, { Schema } from 'mongoose';
import { IQuestion } from '../interfaces/question.interface';
import { QuestionStatus } from '../interfaces/enums';
import { v4 as uuidv4 } from 'uuid';


const questionSchema = new Schema<IQuestion>({
  question_id: { type: String, unique: true, required: true, default: () => `Q_${uuidv4().slice(0, 8).toUpperCase()}` },
  crop: { type: String },
  state: { type: String },
  district: { type: String },
  block_name: { type: String },
  query_type: { type: String },
  season: { type: String },
  sector: { type: String },
  original_query_text: { type: String, required: true },
  refined_query_text: { type: String },
  latitude: { type: String },
  longitude: { type: String },
  status: { type: String, enum: Object.values(QuestionStatus), default: QuestionStatus.PENDING_ASSIGNMENT },
  assigned_specialist_id: { type: Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, default: 'medium' },
  valid_count: { type: Number, default: 0 },
  consecutive_peer_approvals: { type: Number, default: 0 },
  reviewed_by_specialists: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  reviewed_by_Moderators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  user_id: { type: String },
  KccAns:{type:String},
  question_approval: { type: Number, default: 0 },
});

questionSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model<IQuestion>('Question', questionSchema);