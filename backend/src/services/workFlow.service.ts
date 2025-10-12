import { v4 as uuidv4 } from 'uuid';
import UserRepository from '../repositories/user.repository';
import QuestionRepository from '../repositories/question.repository';
import AnswerRepository from '../repositories/answer.repository';
import ValidationRepository from '../repositories/validation.repository';
import NotificationRepository from '../repositories/notification.repository';
import PeerValidationRepository from '../repositories/peerValidation.repository';
import mongoose from "mongoose";
import { QuestionStatus, NotificationType, ValidationStatus,PeerStatus } from '../interfaces/enums';
import logger from '../utils/logger.utils';

const userRepo = new UserRepository();
const questionRepo = new QuestionRepository();
const answerRepo = new AnswerRepository();
const validationRepo = new ValidationRepository();
const notificationRepo = new NotificationRepository();
const peerValidationRepo = new PeerValidationRepository();

export default class WorkflowService {
  static async getRandomAvailableSpecialist(currentUserObj?:any,questionObj?:any): Promise<any | null> {
    const specialists = await userRepo.getAvailableSpecialists(currentUserObj,questionObj);
    if (!specialists.length) return null;
    const minWorkload = Math.min(...specialists.map((s: any) => s.workload_count));
    const candidates = specialists.filter((s: any) => s.workload_count === minWorkload);
    return candidates[0];
  }

  static async getRandomAvailableModerator(currentUserObj?: any,questionObj?: any): Promise<any | null> {
    const moderators = await userRepo.getAvailableModerators(currentUserObj,questionObj);
    if (!moderators.length) return null;
    const minWorkload = Math.min(...moderators.map((m: any) => m.workload_count));
    const candidates = moderators.filter((m: any) => m.workload_count === minWorkload);
    return candidates[0];
  }

  static async assignQuestionToSpecialist(questionId: string,currentUserId?: string): Promise<boolean> {
    const question = await questionRepo.findByQuestionId(questionId);
    let currentUser
    let specialist
    if(currentUserId)
    {
       currentUser = await userRepo.findById(currentUserId)
       specialist = await this.getRandomAvailableSpecialist(currentUser,question);
    }
    else{
      specialist = await this.getRandomAvailableSpecialist();
    }
    
    if (!question) return false;
   
   // const specialist = await this.getRandomAvailableSpecialist();
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

  static async assignToPeerReviewer(answerId: string,currentUserObj?: any,questionObj?: any ,answerData?: any): Promise<boolean> {
    const answer = await answerRepo.findByAnswerId(answerId);
    if (!answer) return false;
    const questionId = answer.question_id?._id ? answer.question_id._id : answer.question_id
    const question = await questionRepo.findById(questionId.toString());
    if(!question){
      throw new Error("Question not found")
    }
    const excludedIds = [answer.specialist_id.toString(), ...question.reviewed_by_specialists.map((id: any) => id.toString())];
   
    if(question.assigned_specialist_id){
      excludedIds.push(question.assigned_specialist_id.toString())
    }
   // console.log("the exclude ids====",excludedIds)
    const specialists = await userRepo.getAvailableSpecialists(currentUserObj,questionObj,answerData);
    const available = specialists.filter((s: any) => !excludedIds.includes(s._id.toString()));

   // console.log("available userList====",specialists,available)

    if (!available.length) {
      logger.warning(`No available peer reviewers for answer ${answerId}, fallback to moderator`);
      question.status = QuestionStatus.PENDING_MODERATION;
      await question.save();
      return await this.assignToModerator(answerId);
    }

    const minWorkload = Math.min(...available.map((s: any) => s.workload_count));
    const candidates = available.filter((s: any) => s.workload_count === minWorkload);
    const reviewer = candidates[0];
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
    logger.info(`[DEBUG] assignToPeerReviewer called for ${answerId} from stack:`, new Error().stack);

    logger.info(`Peer review assigned: answer ${answerId} to ${reviewer.name}`);
    return true;
  }

  static async assignToModerator(answerId: string,currentUserObj?: any,questionObj?: any): Promise<boolean> {
    const answer = await answerRepo.findByAnswerId(answerId);
    if (!answer) return false;

    const moderator = await this.getRandomAvailableModerator(currentUserObj,questionObj);
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
    // const answer: any = validation.answer_id;
    const answer = await answerRepo.findById(validation.answer_id._id.toString());
    if(!answer){
      throw new Error("answer not found")
    }
    const question = await questionRepo.findById(answer.question_id._id.toString());
    if(!question){
      throw new Error("Question not found")
    }
      // question.status = QuestionStatus.NEEDS_REVISION;
      question.status = QuestionStatus.PENDING_PEER_REVIEW;
      question.consecutive_peer_approvals=0
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
      setImmediate(() => this.assignToPeerReviewer(answer.answer_id))
    // }

    return true;
  }
  static async assignQuestionToModerator(questionId: string,questionData:any): Promise<boolean> {
    const question = await questionRepo.findByQuestionId(questionId);
    let currentUser
    let specialist
    if(questionData.user_id)
    {
       currentUser = await userRepo.findById(questionData.user_id)
       specialist = await this.getRandomAvailableModerator(currentUser,question);
    }
    else{
      specialist = await this.getRandomAvailableModerator();
    }
    
    if (!question) return false;
   
   // const specialist = await this.getRandomAvailableSpecialist();
    if (!specialist) {
      logger.warning('No available specialists for assignment');
      return false;
    }
if(questionData.status=="revised")
{
 // const user_id = mongoose.Types.ObjectId.createFromHexString(question.user_id)
  question.assigned_specialist_id = mongoose.Types.ObjectId.createFromHexString(question.user_id);
    question.status = QuestionStatus.ASSIGNED_TO_MODERATION;
    question.reviewed_by_Moderators.push(mongoose.Types.ObjectId.createFromHexString(question.user_id))
    await question.save();

   await userRepo.updateWorkload(question.user_id.toString(), 1);
   const userDetails= await userRepo.findById(question.user_id)
  
    await notificationRepo.create({
      user_id: mongoose.Types.ObjectId.createFromHexString(question.user_id),
      type: NotificationType.QUESTION_REJECTED,
      title: 'Your Question Need Corrections',
      message: `Question ${questionId} has been assigned to you.`,
      related_entity_type: 'question',
      related_entity_id: questionId,
    });
    const newPeerVal = await peerValidationRepo.create({
     
      quetion_id: questionId,
      reviewer_id: mongoose.Types.ObjectId.createFromHexString(question.user_id),
      status: PeerStatus.QUESTION_SENDBACK_TO_OWNER,
      comments:questionData. comments || '',
      peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
    });
    
    logger.info(`Question ${questionId} assigned to original user ${userDetails?.email}`);
}
else{
    question.assigned_specialist_id = specialist._id;
    question.status = QuestionStatus.ASSIGNED_TO_MODERATION;
    question.reviewed_by_Moderators=specialist._id
    await question.save();

    await userRepo.updateWorkload(specialist._id.toString(), 1);

    await notificationRepo.create({
      user_id: specialist._id,
      type: NotificationType.QUESTION_VALIDATION,
      title: 'New Question Assigned',
      message: `Question ${questionId} has been assigned to you.`,
      related_entity_type: 'question',
      related_entity_id: questionId,
    });
    const newPeerVal = await peerValidationRepo.create({
     
      quetion_id: questionId,
      reviewer_id: specialist._id,
      status: PeerStatus.ASSIGNED_TO_MODERATION,
      comments:questionData. comments || '',
      peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
    });
    //console.log("new peer validation created====",newPeerVal)
    logger.info(`Question ${questionId} assigned to Modirator ${specialist.name}`);
  }

  
  

    

   
    return true;
  }
}