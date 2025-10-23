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
import { sendNotification } from '../controllers/notification.controller';
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
  static async getRandomAvailableModeratorList(currentUserObj?: any,questionObj?: any): Promise<any | null> {
    const moderators = await userRepo.getAvailableModeratorList(currentUserObj,questionObj);
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
    const newPeerVal = await peerValidationRepo.create({
     
      question_id: questionId,
      reviewer_id: specialist._id,
      status: PeerStatus.ASSIGNED_TO_AGRISPECILIST,
      comments: '',
      peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
    });
    console.log('specialist email ',specialist.email)
    await sendNotification(specialist._id,'A new Question has been assigned to you. Please check your dashboard.')
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
      logger.info(`No available peer reviewers for answer ${answerId}, fallback to specilist for 2nd review`);
      question.status = QuestionStatus.PENDING_MODERATION;
      await question.save();
      //return await this.assignToModerator(answerId);
    }
 
    const minWorkload = Math.min(...available.map((s: any) => s.workload_count));
    const candidates = available.filter((s: any) => s.workload_count === minWorkload);
    const reviewer = candidates[0] || specialists[0];
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
   /* const newPeerVal = await peerValidationRepo.create({
      ...peerData,
      answer_id: answer._id,
      reviewer_id: userObjectId,
      status: peerData.status,
      comments: peerData.comments || "",
      peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
    });*/
    const newPeerVal = await peerValidationRepo.create({
     
      answer_id: answer._id,
      related_answer_id:answer.answer_id,
      reviewer_id: reviewer._id,
      status: PeerStatus.ASSIGNED_TO_AGRISPECILIST,
      comments: '',
      peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
    });
   
    logger.info(`[DEBUG] assignToPeerReviewer called for ${answerId} from stack:`, new Error().stack);

    logger.info(`Peer review assigned: answer ${answerId} to ${reviewer.name}`);
    await sendNotification(reviewer._id.toString(),'A new review has been assigned to you. Please check your dashboard.')
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
    const sequence = await validationRepo.countByAnswerId(answer._id.toString()) + 1;
    const newValidation = await validationRepo.create({
     
      answer_id: answer._id,
      moderator_id: moderator._id,
      validation_status: ValidationStatus.VALIDATION_REQUEST,
      comments:  '',
      validation_sequence: sequence,
      validation_id: `V_${uuidv4().slice(0, 8).toUpperCase()}`,
      related_answer_id:answer.answer_id
    });

    logger.info(`Validation assigned: answer ${answerId} to moderator ${moderator.name}`);
    await sendNotification(moderator._id,'A new Validation has been assigned to you. Please check your dashboard.')
    return true;
  }

  static async processValidation(validationId: string,comments?:string): Promise<boolean> {
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
      question.valid_count = 0
       question.reviewed_by_specialists=[]
      await question.save();

      await notificationRepo.create({
        user_id: answer.specialist_id,
        type: NotificationType.REVISION_NEEDED,
        title: 'Answer Revision Needed',
        message: `Your answer for question ${question.question_id} needs revision. Moderator comments: ${comments}`,
        related_entity_type: 'answer',
        related_entity_id: answer.answer_id,
      });
      const newPeerVal = await peerValidationRepo.create({
       
        answer_id: answer._id,
        reviewer_id: answer.specialist_id,
        status:PeerStatus.REVISED,
        comments: comments || "",
        peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
        related_answer_id:answer.answer_id
      });
     // console.log("newperrr====",newPeerVal)
     logger.info(`Answer sent back for revision ${ answer.specialist_id} `);
     await sendNotification(answer.specialist_id.toString(),'Your answer has been rejected. Please check your dashboard.')
      logger.info(`Answer ${question.question_id} sent back for revision`);
     // setImmediate(() => this.assignToPeerReviewer(answer.answer_id))
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
       specialist = await this.getRandomAvailableModeratorList(currentUser,question);
    }
    else{
      specialist = await this.getRandomAvailableModeratorList();
    }
    
    if (!question) return false;
   
   // const specialist = await this.getRandomAvailableSpecialist();
    if (!specialist) {
      logger.warning('No available specialists for assignment');
      return false;
    }

if(questionData.status=="revised")
{
 // console.log("the revised condition")
 // const user_id = mongoose.Types.ObjectId.createFromHexString(question.user_id)
  question.assigned_specialist_id = mongoose.Types.ObjectId.createFromHexString(question.user_id);
    question.status = QuestionStatus.ASSIGNED_TO_MODERATION;
    question.reviewed_by_Moderators.push(mongoose.Types.ObjectId.createFromHexString(question.user_id))
    await question.save();

  
   const userDetails= await userRepo.findById(question.user_id)
    if(!userDetails){
      throw new Error("User Not found")
    }
    await notificationRepo.create({
      user_id: mongoose.Types.ObjectId.createFromHexString(question.user_id),
      type: NotificationType.QUESTION_REJECTED,
      title: 'Your Question Need Corrections',
      message: `Question ${questionId} has been assigned to you.`,
      related_entity_type: 'question',
      related_entity_id: questionId,
    });
    const newPeerVal = await peerValidationRepo.create({
     
      question_id: questionId,
      reviewer_id: mongoose.Types.ObjectId.createFromHexString(question.user_id),
      status: PeerStatus.QUESTION_SENDBACK_TO_OWNER,
      comments:questionData. comments || '',
      peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
    });
  // console.log("the newPeervali=====",newPeerVal)
  const workload = await userRepo.updateWorkload(questionData.user_id, -1);
    logger.info(`Question ${questionId} assigned to original user ${userDetails?.email}`);
    await sendNotification(userDetails?._id.toString(),'Your Question has been rejected. Please check your dashboard.')
}
else {
  
 // console.log("the condition approved")
    question.assigned_specialist_id = specialist._id;
    question.status = QuestionStatus.ASSIGNED_TO_MODERATION;
   // question.reviewed_by_Moderators.push(specialist._id)
    questionData.reviewed_by_Moderators = 
    question.reviewed_by_Moderators.push(specialist._id)
    
   // question.reviewed_by_Moderators=specialist._id
    //await question.save();
    try {
      await question.save();
     // console.log('Saved successfully');
    } catch (err) {
     // console.error('Save failed:', err);
    }
   // console.log("the condition approved",specialist._id)
    await userRepo.updateWorkload(specialist._id.toString(), 1);

    await notificationRepo.create({
      user_id: specialist._id,
      type: NotificationType.QUESTION_VALIDATION,
      title: 'New Question Assigned',
      message: `Question ${questionId} has been assigned to you.`,
      related_entity_type: 'question',
      related_entity_id: questionId,
    });
   // question.reviewed_by_Moderators.push(specialist._id)
    const newPeerVal = await peerValidationRepo.create({
     
      question_id: questionId,
      reviewer_id: specialist._id,
      status: PeerStatus.ASSIGNED_TO_MODERATION,
      comments:questionData. comments || '',
      peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
    });
    //console.log("new peer validation created====",newPeerVal)
    logger.info(`Question ${questionId} assigned to Modirator ${specialist.name}`);
    await sendNotification(specialist._id,'A new Question has been assigned to you. Please check your dashboard.')
  }
  

  
  if(questionData.status=="approved")
  {
    const workload = await userRepo.updateWorkload(questionData.user_id, -1);
  }

    

   
    return true;
  }
}