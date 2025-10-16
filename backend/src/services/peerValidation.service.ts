import PeerValidationRepository from "../repositories/peerValidation.repository";
import AnswerRepository from "../repositories/answer.repository";
import QuestionRepository from "../repositories/question.repository";
import UserRepository from "../repositories/user.repository";
import WorkflowService from "./workFlow.service";
import { PeerValidateCreateDto } from "../interfaces/dto";
import {
  NotificationType,
  PeerStatus,
  QuestionStatus,
  UserRole,
} from "../interfaces/enums";
import logger from "../utils/logger.utils";
import { v4 as uuidv4 } from "uuid";
import NotificationRepository from "../repositories/notification.repository";
import { Types } from "mongoose";

const peerValidationRepo = new PeerValidationRepository();
const answerRepo = new AnswerRepository();
const questionRepo = new QuestionRepository();
const userRepo = new UserRepository();
const notificationRepo = new NotificationRepository();
export default class PeerValidationService {
  async create(
    peerData: PeerValidateCreateDto,
    currentUserId: string
  ): Promise<any> {
  
    const currentUser = await userRepo.findById(currentUserId);
    if (!currentUser) {
      throw new Error("User not found");
    }
    if (currentUser.role !== UserRole.AGRI_SPECIALIST)
      throw new Error("Only Agri Specialists can peer validate");

    const answer = await answerRepo.findByAnswerId(peerData.answer_id);
    if (!answer || !answer.is_current) throw new Error("Answer not found");
    let questionId: string;

    if (typeof answer.question_id === "object" && answer.question_id._id) {
      questionId = answer.question_id._id.toString();
    } else {
      questionId = answer.question_id.toString();
    }

    const question = await questionRepo.findById(questionId);
    // const question = await questionRepo.findById(answer.question_id.toString());
    if (!question) {
      throw new Error("No question found");
    }
    if(peerData.status && peerData.peer_validation_id)
    {
     // console.log("the peer validation status====",peerData)
      const result=  await peerValidationRepo.updatePeerValidationBypeerId(peerData.peer_validation_id,peerData.status)
    // console.log("the result coming====",result)
      if(peerData.notification_id)
      {

        await notificationRepo.markReadAndSubmit(
          peerData.notification_id,
          peerData.userId
        );
      }

    }

    // const notification = await notificationRepo.findUnreadByUserId(currentUserId, NotificationType.PEER_REVIEW_REQUEST).then(n => n.find(n => n.related_entity_id === peerData.answer_id));
  /*  const notification = await notificationRepo
      .findAllByUserId(currentUserId)
      .then((n) => n.find((n) => n.related_entity_id === peerData.answer_id));
    if (!notification)
      throw new Error("You are not assigned to peer review this answer");*/

   
    const userObjectId = new Types.ObjectId(currentUserId);
    let reviewedBy = question!.reviewed_by_specialists || [];
    if (!reviewedBy.includes(userObjectId)) reviewedBy.push(userObjectId);
    question.reviewed_by_specialists = reviewedBy;
    // const originalSpecialistId =answer.specialist_id.toString()
    if (peerData.status === PeerStatus.APPROVED) {
      const originalSpecialistId =
        typeof answer.specialist_id === "object" &&
        "_id" in answer.specialist_id
          ? answer.specialist_id._id.toString()
          : answer.specialist_id;
      const updateIncentive = await userRepo.updateIncentive(
        originalSpecialistId,
        1
      );
      const lastPeer = await peerValidationRepo.findLastByAnswerId(
        answer._id.toString()
      );
      /*if (lastPeer && lastPeer.status === PeerStatus.APPROVED) {
        question.consecutive_peer_approvals += 1;
      } else {
        question.consecutive_peer_approvals = 1;
      }*/
      question.consecutive_peer_approvals += 1;
      await question.save();

      if (question.consecutive_peer_approvals >= 3) {
        question.status = QuestionStatus.PENDING_MODERATION;
        await question.save();
        setImmediate(() =>
          WorkflowService.assignToModerator(
            answer.answer_id,
            currentUser,
            question
          )
        );
        logger.info(
          `3 consecutive peer approvals for answer ${answer.answer_id}, assigned to moderator`
        );
      } 
      else {
        setImmediate(() =>
          WorkflowService.assignToPeerReviewer(
            answer.answer_id,
            currentUser,
            question
          )
        );
        logger.info(
          `Peer approved answer ${answer.answer_id}, consecutive: ${question.consecutive_peer_approvals}`
        );
      }
    /*  await notificationRepo.markReadAndSubmit(
        notification.notification_id,
        currentUserId
      );*/
      
    /*  const newPeerVal = await peerValidationRepo.create({
        ...peerData,
        answer_id: answer._id,
        reviewer_id: userObjectId,
        status: peerData.status,
        comments: peerData.comments || "",
        peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
        related_answer_id:answer.answer_id
      });*/
      const workload = await userRepo.updateWorkload(currentUserId, -1);
   
    } else {
      const originalSpecialistId =
        typeof answer.specialist_id === "object" &&
        "_id" in answer.specialist_id
          ? answer.specialist_id._id.toString()
          : answer.specialist_id;
      await userRepo.updatePenality(originalSpecialistId, 1);
      await userRepo.updateWorkload(originalSpecialistId,1)
      logger.info(
        `Incentive -1 applied to specialist ${originalSpecialistId} for revised peer review`
      );
      const revisionMessage = peerData.comments
        ? `Peer review requires changes to your answer for question ${question.question_id}. Suggested changes: ${peerData.comments}`
        : `Peer review requires changes to your answer for question ${question.question_id}. Please revise based on feedback.`;
      // console.log("Question_id",question)
      // console.log("current user===",currentUser)
      await notificationRepo.create({
        user_id: question.assigned_specialist_id,
        type: NotificationType.REVISION_NEEDED,
        title: "Peer Review Revision Needed",
        message: revisionMessage,
        related_entity_type: "answer",
        related_entity_id: answer.answer_id,
      });
      const newPeerVal = await peerValidationRepo.create({
       
        answer_id: answer._id,
        reviewer_id: question.assigned_specialist_id,
        status:PeerStatus.REVISED,
        comments: peerData.comments || "",
        peer_validation_id: `PV_${uuidv4().slice(0, 8).toUpperCase()}`,
        related_answer_id:answer.answer_id
      });
      logger.info(
        `Revision notification sent to original specialist for answer ${question.assigned_specialist_id}`
      );
    /*  await notificationRepo.markReadAndSubmit(
        notification.notification_id,
        currentUserId
      );*/
      question.consecutive_peer_approvals = 0;
      question.reviewed_by_specialists=[]
       await question.save()
     // if (peerData.revised_answer_text) {
        console.log("reaching hereeeeee")
        answer.is_current = false;
        //  answer.sendBackToRevision="Revesion"
        //  answer.first_answered_person=question.assigned_specialist_id
         await answer.save();
      /*  const newAnswer = await answerRepo.create({
          question_id: question._id,
          specialist_id: userObjectId,
          answer_text: peerData.revised_answer_text,
          sources: answer.sources,
          version: answer.version + 1,
          answer_id: `A_${uuidv4().slice(0, 8).toUpperCase()}`,
          first_answered_person: question.assigned_specialist_id,
          //original_query_text:question. original_query_text,
          // original_question_id:question.question_id
        });*/

        // question.status = QuestionStatus.PENDING_PEER_REVIEW;
        question.status = QuestionStatus.NEEDS_REVISION;
        await question.save();

        //  setImmediate(() => WorkflowService.assignToPeerReviewer(newAnswer.answer_id,currentUser,question));
        logger.info(`Revision Send back to${question.assigned_specialist_id} `);
        if (question && question.assigned_specialist_id) {
          const user = await userRepo.findById(
            question?.assigned_specialist_id.toString()
          );
          logger.info(`Peer Review Submitted Successfully to---${user?.name} `);

       // logger.info(`Peer revised answer ${answer.answer_id} to new version ${newAnswer.version}`);
       // }

        return {
          message: "Answer Revise Submitted Successfully",
          peer_validation_id:'No Applicable'
        };
      } else {
        logger.warning(
          `Peer revised without new text for answer ${answer.answer_id}`
        );
      }
      // await question.save();
    }
   
    return {
      message: "Peer validation submitted successfully",
     // peer_validation_id: newPeerVal.peer_validation_id,
    };
    // Decrement workload
    
  }

  async getHistoryByAnswerId(answerId: string): Promise<any[]> {
    return peerValidationRepo.findByAnswerId(answerId);
  }
}
