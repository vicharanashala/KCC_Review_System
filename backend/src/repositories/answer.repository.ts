import Answer from '../models/answer.model';
import { IAnswer } from '../interfaces/answer.interface';

export default class AnswerRepository {
  async create(answerData: Partial<IAnswer>): Promise<IAnswer> {
    return Answer.create(answerData);
  }

  async findByAnswerId(answerId: string): Promise<IAnswer | null> {
    return Answer.findOne({ answer_id: answerId }).populate('question specialist');
  }

  async findById(id: string): Promise<IAnswer | null> {
    return Answer.findById(id).populate('question specialist');
  }

  async findCurrentByQuestionId(questionId: string): Promise<IAnswer | null> {
    return Answer.findOne({ question_id: questionId, is_current: true }).populate('question specialist');
  }

  async markPreviousNotCurrent(questionId: string): Promise<void> {
    await Answer.updateMany({ question_id: questionId }, { is_current: false });
  }

  async findByQuestionId(questionId: string): Promise<IAnswer[]> {
    return Answer.find({ question_id: questionId }).populate('question specialist');
  }

  async countVersionsByQuestionId(questionId: string): Promise<number> {
    return Answer.countDocuments({ question_id: questionId });
  }
}