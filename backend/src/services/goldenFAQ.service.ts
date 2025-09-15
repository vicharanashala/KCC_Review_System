import GoldenFAQRepository from '../repositories/goldenFAQ.repository';
import QuestionRepository from '../repositories/question.repository';
import AnswerRepository from '../repositories/answer.repository';
import UserRepository from '../repositories/user.repository';
import { GoldenFAQCreateDto } from '../interfaces/dto';
import { QuestionStatus, UserRole } from '../interfaces/enums';
import logger from '../utils/logger.utils';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';

const goldenFAQRepo = new GoldenFAQRepository();
const questionRepo = new QuestionRepository();
const answerRepo = new AnswerRepository();
const userRepo = new UserRepository();

export default class GoldenFAQService {
  async create(goldenFAQData: GoldenFAQCreateDto, currentUserId: string): Promise<any> {
    const currentUser = await userRepo.findById(currentUserId)
    if(!currentUser){
      throw new Error('User not found');
    }
    if (currentUser.role !== UserRole.AGRI_SPECIALIST) throw new Error('Only Agri Specialists can create Golden FAQs');

    const question = await questionRepo.findByQuestionId(goldenFAQData.question_id);
    if (!question) throw new Error('Question not found');

    if (question.status !== QuestionStatus.READY_FOR_GOLDEN_FAQ) throw new Error('Question is not ready for Golden FAQ creation');

    const currentAnswer = await answerRepo.findCurrentByQuestionId(question._id.toString());
    if (!currentAnswer) throw new Error('No current answer found');

    if (currentAnswer.specialist_id.toString() !== currentUserId) throw new Error('You are not the author of the current answer');
    const userObjectId =new Types.ObjectId(currentUserId)
    const newGoldenFAQ = await goldenFAQRepo.create({
      ...goldenFAQData,
      question_id: question._id,
      final_answer_id: currentAnswer._id,
      question_text: question.original_query_text,
      final_answer_text: goldenFAQData.final_answer_text,
      category: goldenFAQData.category,
      crop: question.crop,
      sources: currentAnswer.sources,
      tags: goldenFAQData.tags,
      created_by: userObjectId,
      faq_id: `FAQ_${uuidv4().slice(0, 8).toUpperCase()}`,
    });

    question.status = QuestionStatus.GOLDEN_FAQ_CREATED;
    await question.save();

    await userRepo.updateWorkload(currentUserId, -1);

    logger.info(`Golden FAQ created: ${newGoldenFAQ.faq_id} for question ${question.question_id}`);
    return { message: 'Golden FAQ created successfully', faq_id: newGoldenFAQ.faq_id };
  }

  async getAll(skip: number = 0, limit: number = 50, search?: string, category?: string, crop?: string): Promise<any[]> {
    return goldenFAQRepo.findAll(skip, limit, search, category, crop);
  }
}