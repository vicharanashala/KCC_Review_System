import Question from '../models/question.model';
import { IQuestion } from '../interfaces/question.interface';
import { QuestionStatus } from '../interfaces/enums';
import { HydratedDocument } from 'mongoose';
export type QuestionDocument = HydratedDocument<IQuestion>
export default class QuestionRepository {
  async create(questionData: Partial<IQuestion>): Promise<IQuestion> {
    return Question.create(questionData);
  }

  async createMany(questionDatas: Partial<IQuestion>[]): Promise<QuestionDocument[]> {
  return Question.insertMany(questionDatas as IQuestion[])
}

  async findByQuestionId(questionId: string): Promise<IQuestion | null> {
    return Question.findOne({ question_id: questionId });
  }
  async findByQuestionObjectId(Id:any): Promise<IQuestion | null> {
    return Question.findOne({ _id: Id});
  }

  async findById(id: string): Promise<IQuestion | null> {
    return Question.findById(id);
  }

  async findByCreatedAt(startDate: Date): Promise<IQuestion[]> {
    return Question.find({ created_at: { $gte: startDate } }).populate('assigned_specialist_id');
  }

  async findByCreatedAtAndStatus(startDate: Date, status: QuestionStatus): Promise<IQuestion[]> {
    return Question.find({ created_at: { $gte: startDate }, status }).populate('assigned_specialist_id');
  }

  async findPending(): Promise<number> {
    return Question.countDocuments({ status: QuestionStatus.PENDING_ASSIGNMENT });
  }

  async findInReview(): Promise<number> {
    return Question.countDocuments({
      status: {
        $in: [
          QuestionStatus.ASSIGNED_TO_SPECIALIST,
          QuestionStatus.PENDING_PEER_REVIEW,
          QuestionStatus.PENDING_MODERATION,
          QuestionStatus.NEEDS_REVISION,
          QuestionStatus.READY_FOR_GOLDEN_FAQ,
        ],
      },
    });
  }

  async findAssignedToUser(userId: string, statuses: QuestionStatus[]): Promise<IQuestion[]> {
    return Question.find({ assigned_specialist_id: userId, status: { $in: statuses } });
  }

  async updateStatus(questionId: string, status: QuestionStatus, updates: any): Promise<IQuestion | null> {
    return Question.findOneAndUpdate(
      { question_id: questionId },
      { ...updates, status, updated_at: new Date() },
      { new: true }
    );
  }
}