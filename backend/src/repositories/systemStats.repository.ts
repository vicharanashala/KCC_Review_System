import SystemStats from '../models/systemStats.model';
import { ISystemStats } from '../interfaces/systemStats.interface';

export default class SystemStatsRepository {
  async createOrUpdate(stats: Partial<ISystemStats>): Promise<ISystemStats> {
    return SystemStats.findOneAndUpdate({}, stats, { upsert: true, new: true });
  }

  async findOne(): Promise<ISystemStats | null> {
    return SystemStats.findOne();
  }
}