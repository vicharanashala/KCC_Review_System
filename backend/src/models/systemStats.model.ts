import mongoose, { Schema } from 'mongoose';
import { ISystemStats } from '../interfaces/systemStats.interface';

const systemStatsSchema = new Schema<ISystemStats>({
  total_specialists: { type: Number, default: 0 },
  active_specialists: { type: Number, default: 0 },
  total_moderators: { type: Number, default: 0 },
  active_moderators: { type: Number, default: 0 },
  pending_questions: { type: Number, default: 0 },
  questions_in_review: { type: Number, default: 0 },
  golden_faqs_created: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now },
});

systemStatsSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.model<ISystemStats>('SystemStats', systemStatsSchema);