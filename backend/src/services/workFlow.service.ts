import { v4 as uuidv4 } from 'uuid';
import UserRepository from '../repositories/user.repository';
import QuestionRepository from '../repositories/question.repository';
import AnswerRepository from '../repositories/answer.repository';
import ValidationRepository from '../repositories/validation.repository';
import NotificationRepository from '../repositories/notification.repository';
import { QuestionStatus, NotificationType, ValidationStatus } from '../interfaces/enums';
import logger from '../utils/logger.utils';

const userRepo = new UserRepository();
const questionRepo = new QuestionRepository();
const answerRepo = new AnswerRepository();
const validationRepo = new ValidationRepository();
const notificationRepo = new NotificationRepository();

export default class WorkflowService {
  static async getRandomAvailableSpecialist(): Promise<any | null> {
    const specialists = await userRepo.getAvailableSpecialists();
    if (!specialists.length) return null;
    const minWorkload = Math.min(...specialists.map((s: any) => s.workload_count));
    const candidates = specialists.filter((s: any) => s.workload_count === minWorkload);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  static async getRandomAvailableModerator(): Promise<any | null> {
    const moderators = await userRepo.getAvailableModerators();
    if (!moderators.length) return null;
    const minWorkload = Math.min(...moderators.map((m: any) => m.workload_count));
    const candidates = moderators.filter((m: any) => m.workload_count === minWorkload);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  static async assignQuestionToSpecialist(questionId: string): Promise<boolean> {
    const question = await questionRepo.findByQuestionId(questionId);
    if (!question) return false;

    const specialist = await this.getRandomAvailableSpecialist();
    if (!specialist) {
      logger.warning('No available specialists for assignment');
      return false;
    }

    question.assigned_specialist_id = specialist._id;
    question.status = QuestionStatus.ASSIGNED_TO_SPECIALIST;
    await question.save();

    await userRepo.updateWorkload(specialist._id.toString(), 1);

    await notificationRepo.create({
      user_id: specialist._id,
      type: NotificationType.QUESTION_ASSIGNED,
      title: 'New Question Assigned',
      message: `Question ${questionId} has been assigned to you.`,
      related_entity_type: 'question',
      related_entity_id: questionId,
    });

    logger.info(`Question ${questionId} assigned to specialist ${specialist.name}`);
    return true;
  }

  static async assignToPeerReviewer(answerId: string): Promise<boolean> {
    const answer = await answerRepo.findByAnswerId(answerId);
    if (!answer) return false;

    const question = await questionRepo.findById(answer.question_id.toString());
    if(!question){
      throw new Error("Question not found")
    }
    const excludedIds = [answer.specialist_id.toString(), ...question.reviewed_by_specialists.map((id: any) => id.toString())];

    const specialists = await userRepo.getAvailableSpecialists();
    const available = specialists.filter((s: any) => !excludedIds.includes(s._id.toString()));

    if (!available.length) {
      logger.warning(`No available peer reviewers for answer ${answerId}, fallback to moderator`);
      question.status = QuestionStatus.PENDING_MODERATION;
      await question.save();
      return await this.assignToModerator(answerId);
    }

    const minWorkload = Math.min(...available.map((s: any) => s.workload_count));
    const candidates = available.filter((s: any) => s.workload_count === minWorkload);
    const reviewer = candidates[Math.floor(Math.random() * candidates.length)];
    if(!reviewer){
      throw new Error("Reviewer not found")
    }
    await userRepo.updateWorkload(reviewer._id.toString(), 1);

    await notificationRepo.create({
      user_id: reviewer._id,
      type: NotificationType.PEER_REVIEW_REQUEST,
      title: 'New Peer Review Assignment',
      message: `Please review the answer for question ${question.question_id}.`,
      related_entity_type: 'answer',
      related_entity_id: answerId,
    });

    logger.info(`Peer review assigned: answer ${answerId} to ${reviewer.name}`);
    return true;
  }

  static async assignToModerator(answerId: string): Promise<boolean> {
    const answer = await answerRepo.findByAnswerId(answerId);
    if (!answer) return false;

    const moderator = await this.getRandomAvailableModerator();
    if (!moderator) {
      logger.warning('No available moderators for validation');
      return false;
    }

    await userRepo.updateWorkload(moderator._id.toString(), 1);

    await notificationRepo.create({
      user_id: moderator._id,
      type: NotificationType.VALIDATION_REQUEST,
      title: 'New Answer to Validate',
      message: `Answer ${answerId} is ready for validation.`,
      related_entity_type: 'answer',
      related_entity_id: answerId,
    });

    logger.info(`Validation assigned: answer ${answerId} to moderator ${moderator.name}`);
    return true;
  }

  static async processValidation(validationId: string): Promise<boolean> {
    const validation = await validationRepo.findByValidationId(validationId);
    if (!validation) return false;

    const answer = await answerRepo.findById(validation.answer_id.toString());
    if(!answer){
      throw new Error("answer not found")
    }
    const question = await questionRepo.findById(answer.question_id.toString());
    if(!question){
      throw new Error("Question not found")
    }
    if (validation.validation_status === ValidationStatus.VALID) {
      question.status = QuestionStatus.READY_FOR_GOLDEN_FAQ;
      question.valid_count = 1;
      await question.save();

      await notificationRepo.create({
        user_id: answer.specialist_id,
        type: NotificationType.READY_FOR_GOLDEN_FAQ,
        title: 'Ready for Golden FAQ Creation',
        message: `Your answer for question ${question.question_id} has been validated. Please create the Golden FAQ.`,
        related_entity_type: 'question',
        related_entity_id: question.question_id,
      });

      logger.info(`Question ${question.question_id} ready for Golden FAQ creation`);
    } else {
      question.status = QuestionStatus.NEEDS_REVISION;
      question.valid_count = 0;
      await question.save();

      await notificationRepo.create({
        user_id: answer.specialist_id,
        type: NotificationType.REVISION_NEEDED,
        title: 'Answer Revision Needed',
        message: `Your answer for question ${question.question_id} needs revision. Moderator comments: ${validation.comments}`,
        related_entity_type: 'answer',
        related_entity_id: answer.answer_id,
      });

      logger.info(`Question ${question.question_id} sent back for revision`);
    }

    return true;
  }
}