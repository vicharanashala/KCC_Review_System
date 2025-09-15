import GoldenFAQ from '../models/goldenFAQ.model';
import { IGoldenFAQ } from '../interfaces/goldenFAQ.interface';
import { FilterQuery } from 'mongoose';

export default class GoldenFAQRepository {
  async create(goldenFAQData: Partial<IGoldenFAQ>): Promise<IGoldenFAQ> {
    return GoldenFAQ.create(goldenFAQData);
  }

  async findByFaqId(faqId: string): Promise<IGoldenFAQ | null> {
    return GoldenFAQ.findOne({ faq_id: faqId }).populate('question final_answer created_by_user');
  }

  async findAll(skip: number = 0, limit: number = 50, search?: string, category?: string, crop?: string): Promise<IGoldenFAQ[]> {
    let query:FilterQuery<IGoldenFAQ> = { is_published: true };

    if (search) {
      query = { ...query, $or: [{ question_text: { $regex: search, $options: 'i' } }, { final_answer_text: { $regex: search, $options: 'i' } }] };
    }
    if (category) query.category = category;
    if (crop) query.crop = crop;

    return GoldenFAQ.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).populate('question final_answer created_by_user');
  }

  async count(): Promise<number> {
    return GoldenFAQ.countDocuments({ is_published: true });
  }
}