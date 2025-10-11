import mongoose, { Schema } from 'mongoose';
import { IPeerValidation } from '../interfaces/peerValidation.interface';
import { PeerStatus } from '../interfaces/enums';
import { v4 as uuidv4 } from 'uuid';

const peerValidationSchema = new Schema<IPeerValidation>({
  peer_validation_id: { type: String, unique: true, required: true, default: () => `PV_${uuidv4().slice(0, 8).toUpperCase()}` },
  answer_id: { type: Schema.Types.ObjectId, ref: 'Answer', },
  reviewer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: Object.values(PeerStatus), required: true },
  comments: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  quetion_id:{type: String,}
});

export default mongoose.model<IPeerValidation>('PeerValidation', peerValidationSchema);