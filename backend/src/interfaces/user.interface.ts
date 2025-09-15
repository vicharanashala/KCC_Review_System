import { Document, Types } from 'mongoose';
import { UserRole } from './enums';

export interface IUser extends Document {
  _id: Types.ObjectId;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  hashed_password: string;
  specialization?: string[];
  is_active: boolean;
  is_available: boolean;
  workload_count: number;
  incentive_points:number;
  created_at: Date;
  updated_at: Date;
  comparePassword(password: string): boolean;
}