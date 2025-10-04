import mongoose, { Schema } from 'mongoose';
import { IGoldenFAQ } from '../interfaces/goldenFAQ.interface';
import { v4 as uuidv4 } from 'uuid';

const goldenFAQSchema = new Schema<IGoldenFAQ>({
  faq_id: { type: String, unique: true, required: true, default: () => `FAQ_${uuidv4().slice(0, 8).toUpperCase()}` },
  question_id: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  final_answer_id: { type: Schema.Types.ObjectId, ref: 'Answer', required: true },
  question_text: { type: String, required: true },
  final_answer_text: { type: String, required: true },
  category: { type: String },
  crop: { type: String },
  sources: { type: [{ name: String, link: String }], default: [] },
  tags: { type: [String], default: [] },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  is_published: { type: Boolean, default: true },
  view_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IGoldenFAQ>('GoldenFAQ', goldenFAQSchema);