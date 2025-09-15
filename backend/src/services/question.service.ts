import { v4 as uuidv4 } from 'uuid';
import QuestionRepository from '../repositories/question.repository';
import WorkflowService from './workFlow.service';
import { QuestionCreateDto, QuestionResponseDto } from '../interfaces/dto';
import logger from '../utils/logger.utils';
import { QuestionStatus } from '../interfaces/enums';

const questionRepo = new QuestionRepository();

export default class QuestionService {
  async create(questionData: QuestionCreateDto): Promise<QuestionResponseDto> {
    const question = await questionRepo.create({ ...questionData, question_id: `Q_${uuidv4().slice(0, 8).toUpperCase()}` });
    setImmediate(() => WorkflowService.assignQuestionToSpecialist(question.question_id));
    logger.info(`New question submitted: ${question.question_id}`);
    return {
      question_id: question.question_id,
      original_query_text: question.original_query_text,
      status: question.status,
      assigned_specialist: undefined,
      valid_count: question.valid_count,
      consecutive_peer_approvals: question.consecutive_peer_approvals,
      created_at: question.created_at,
    };
  }

  async getByQuestionId(questionId: string): Promise<any> {
    const question = await questionRepo.findByQuestionId(questionId);
    if (!question) throw new Error('Question not found');
    return question;
  }

  async getAssignedToUser(userId: string): Promise<any[]> {
    return questionRepo.findAssignedToUser(userId, [QuestionStatus.ASSIGNED_TO_SPECIALIST, QuestionStatus.NEEDS_REVISION, QuestionStatus.READY_FOR_GOLDEN_FAQ]);
  }
}