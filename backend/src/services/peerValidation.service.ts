import PeerValidationRepository from '../repositories/peerValidation.repository';
import AnswerRepository from '../repositories/answer.repository';
import QuestionRepository from '../repositories/question.repository';
import UserRepository from '../repositories/user.repository';
import WorkflowService from './workFlow.service';
import { PeerValidateCreateDto } from '../interfaces/dto';
import { NotificationType, PeerStatus, QuestionStatus, UserRole } from '../interfaces/enums';
import logger from '../utils/logger.utils';
import { v4 as uuidv4 } from 'uuid';
import NotificationRepository from '../repositories/notification.repository';
import { Types } from 'mongoose';

const peerValidationRepo = new PeerValidationRepository();
const answerRepo = new AnswerRepository();
const questionRepo = new QuestionRepository();
const userRepo = new UserRepository();
const notificationRepo = new NotificationRepository();
export default class PeerValidationService {
  async create(peerData: PeerValidateCreateDto, currentUserId: string): Promise<any> {
    const currentUser = await userRepo.findById(currentUserId)
    if(!currentUser){
      throw new Error("User not found")
    }
    if (currentUser.role !== UserRole.AGRI_SPECIALIST) throw new Error('Only Agri Specialists can peer validate');

    const answer = await answerRepo.findByAnswerId(peerData.answer_id);
    if (!answer || !answer.is_current) throw new Error('Answer not found');

    const question = await questionRepo.findById(answer.question_id.toString());
    if(!question){
      throw new Error("No question found")
    }
    
    const notification = await notificationRepo.findUnreadByUserId(currentUserId, NotificationType.PEER_REVIEW_REQUEST).then(n => n.find(n => n.related_entity_id === peerData.answer_id));
    if (!notification) throw new Error('You are not assigned to peer review this answer');

    await notificationRepo.markRead(notification.notification_id, currentUserId);
    const userObjectId = new Types.ObjectId(currentUserId)
    const newPeerVal = await peerValidationRepo.create({
      ...peerData,
      answer_id: answer._id,
      reviewer_id: userObjectId,
      status: peerData.status,
      comments: peerData.comments || '',
      peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
    });

    let reviewedBy = question!.reviewed_by_specialists || [];
    if (!reviewedBy.includes(userObjectId)) reviewedBy.push(userObjectId);
    question.reviewed_by_specialists = reviewedBy;

    if (peerData.status === PeerStatus.APPROVED) {
      const lastPeer = await peerValidationRepo.findLastByAnswerId(answer._id.toString());
      if (lastPeer && lastPeer.status === PeerStatus.APPROVED) {
        question.consecutive_peer_approvals += 1;
      } else {
        question.consecutive_peer_approvals = 1;
      }
      await question.save();

      if (question.consecutive_peer_approvals >= 3) {
        question.status = QuestionStatus.PENDING_MODERATION;
        await question.save();
        setImmediate(() => WorkflowService.assignToModerator(answer.answer_id));
        logger.info(`3 consecutive peer approvals for answer ${answer.answer_id}, assigned to moderator`);
      } else {
        setImmediate(() => WorkflowService.assignToPeerReviewer(answer.answer_id));
        logger.info(`Peer approved answer ${answer.answer_id}, consecutive: ${question.consecutive_peer_approvals}`);
      }
    } else {
      question.consecutive_peer_approvals = 0;
      if (peerData.revised_answer_text) {
        answer.is_current = false;
        await answer.save();

        const newAnswer = await answerRepo.create({
          question_id: question._id,
          specialist_id: userObjectId,
          answer_text: peerData.revised_answer_text,
          sources: answer.sources,
          version: answer.version + 1,
          answer_id: `A_${uuidv4().slice(0, 8).toUpperCase()}`,
        });

        question.status = QuestionStatus.PENDING_PEER_REVIEW;
        await question.save();

        setImmediate(() => WorkflowService.assignToPeerReviewer(newAnswer.answer_id));
        logger.info(`Peer revised answer ${answer.answer_id} to new version ${newAnswer.version}`);
      } else {
        logger.warning(`Peer revised without new text for answer ${answer.answer_id}`);
      }
      await question.save();
    }

    // Decrement workload
    await userRepo.updateWorkload(currentUserId, -1);

    return { message: 'Peer validation submitted successfully', peer_validation_id: newPeerVal.peer_validation_id };
  }

  async getHistoryByAnswerId(answerId: string): Promise<any[]> {
    return peerValidationRepo.findByAnswerId(answerId);
  }
}