import User from '../models/user.model';
import { IUser } from '../interfaces/user.interface';
import { UserRole } from '../interfaces/enums';

export default class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    return User.create(userData);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findAll(skip: number = 0, limit: number = 100, role?: UserRole): Promise<IUser[]> {
    const query = role ? { role } : {};
    return User.find(query).skip(skip).limit(limit).select('-hashed_password');
  }

  async updateStatus(userId: string, isActive: boolean, isAvailable?: boolean): Promise<IUser | null> {
    const update = { is_active: isActive };
    if (isAvailable !== undefined) update['is_available'] = isAvailable;
    return User.findByIdAndUpdate(userId, update, { new: true });
  }

  async getAvailableSpecialists(): Promise<IUser[]> {
    return User.find({ role: UserRole.AGRI_SPECIALIST, is_active: true, is_available: true }).sort({ workload_count: 1 });
  }

  async getAvailableModerators(): Promise<IUser[]> {
    return User.find({ role: UserRole.MODERATOR, is_active: true, is_available: true }).sort({ workload_count: 1 });
  }

  async updateWorkload(userId: string, increment: number): Promise<void> {
    await User.findByIdAndUpdate(userId, { $inc: { workload_count: increment } });
  }
}