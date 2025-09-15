import mongoose, { Schema } from 'mongoose';
import { IUser } from '../interfaces/user.interface';
import { UserRole } from '../interfaces/enums';
import bcryptUtil from '../utils/bcrypt.utils';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new Schema<IUser>({
  user_id: { type: String, unique: true, required: true, default: () => `USER_${uuidv4().slice(0, 8).toUpperCase()}` },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  role: { type: String, enum: Object.values(UserRole), required: true },
  hashed_password: { type: String, required: true },
  specialization: { type: [String], default: [] },
  is_active: { type: Boolean, default: true },
  is_available: { type: Boolean, default: true },
  workload_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

userSchema.pre('save', function (next) {
  if (this.isModified('hashed_password')) {
    this.hashed_password = bcryptUtil.hashSync(this.hashed_password as string);
  }
  this.updated_at = new Date();
  next();
});

userSchema.methods.comparePassword = function (password: string): boolean {
  return bcryptUtil.compareSync(password, this.hashed_password);
};

export default mongoose.model<IUser>('User', userSchema);