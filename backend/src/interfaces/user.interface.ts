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
  penality:number;
  created_at: Date;
  updated_at: Date;
  comparePassword(password: string): boolean;
  specializationField:string,
  district:string,
  state:string,
  //coordinates:number[],
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}