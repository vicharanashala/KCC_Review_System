import mongoose, { Schema } from 'mongoose';
import { IValidation } from '../interfaces/validation.interface';
import { ValidationStatus } from '../interfaces/enums';
import { v4 as uuidv4 } from 'uuid';

const validationSchema = new Schema<IValidation>({
  validation_id: { type: String, unique: true, required: true, default: () => `V_${uuidv4().slice(0, 8).toUpperCase()}` },
  answer_id: { type: Schema.Types.ObjectId, ref: 'Answer', required: true },
  moderator_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  validation_status: { type: String, enum: Object.values(ValidationStatus), required: true },
  comments: { type: String, default: '' },
  validation_sequence: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<IValidation>('Validation', validationSchema);