import AnswerRepository from '../repositories/answer.repository';
import QuestionRepository from '../repositories/question.repository';
import UserRepository from '../repositories/user.repository';
import WorkflowService from './workFlow.service';
import { AnswerCreateDto } from '../interfaces/dto';
import { QuestionStatus } from '../interfaces/enums';
import logger from '../utils/logger.utils';
import { Types } from 'mongoose';

const answerRepo = new AnswerRepository();
const questionRepo = new QuestionRepository();
const userRepo = new UserRepository()
export default class AnswerService {
  async create(answerData: AnswerCreateDto, currentUserId: string): Promise<any> {
    
    const currentUser = await userRepo.findById(currentUserId)
    const question = await questionRepo.findByQuestionId(answerData.question_id);
    if (!question) throw new Error('Question not found');
    if (question.status === QuestionStatus.ASSIGNED_TO_SPECIALIST) {
      if (question.assigned_specialist_id!.toString() !== currentUserId) throw new Error('You are not assigned to this question');
    } else if (question.status === QuestionStatus.NEEDS_REVISION) {
      const currentAns = await answerRepo.findCurrentByQuestionId(question._id.toString());
  
      if (!currentAns || currentAns.specialist_id.toString() !== currentUserId) throw new Error('You are not authorized to revise this answer');
    } 
    else if(answerData.status==='Rejected'){
      // const currentAns = await answerRepo.findByAnswerId(question._id.toString());
       let currentAnswer=await answerRepo.findByExactQuestionId(answerData.questionObjId)
     
       currentAnswer.map(async (answer)=>{
        answer.RevisedAnswer = true;
        //  answer.sendBackToRevision="Revesion"
        //  answer.first_answered_person=question.assigned_specialist_id
          await answer.save();
       

       })
 
     }
    else {
      throw new Error('Cannot create answer in current status');
    }

    await answerRepo.markPreviousNotCurrent(question._id.toString());
   
    const version = await answerRepo.countVersionsByQuestionId(question._id.toString()) + 1;
    const userObjectId = new Types.ObjectId(currentUserId)
    const newAnswer = await answerRepo.create({
      ...answerData,
      question_id: question._id,
      specialist_id: userObjectId,
      answer_text: answerData.answer_text,
      sources: answerData.sources,
      version,
      answer_id: `A_${require('uuid').v4().slice(0, 8).toUpperCase()}`,
      first_answered_person:question.assigned_specialist_id,
     // original_query_text:question. original_query_text,
     // original_question_id:question.question_id
    });

    // Update question for peer review
    let reviewedBy = question.reviewed_by_specialists || [];
    if (!reviewedBy.includes(userObjectId)) reviewedBy.push(userObjectId);
    question.reviewed_by_specialists = reviewedBy;
    question.consecutive_peer_approvals = 0;
    question.status = QuestionStatus.PENDING_PEER_REVIEW;
    await question.save();
    await userRepo.updateWorkload(currentUserId,-1)
   
    setImmediate(() => WorkflowService.assignToPeerReviewer(newAnswer.answer_id,currentUser,question));

    logger.info(`Answer created: ${newAnswer.answer_id}, version: ${newAnswer.version}`);
    return { message: 'Answer created successfully', answer_id: newAnswer.answer_id, version: newAnswer.version };
  }
  async createRevisionAnswer(answerData: AnswerCreateDto, currentUserId: string): Promise<any> {
   
    const currentUser = await userRepo.findById(currentUserId)
    const question = await questionRepo.findByQuestionId(answerData.question_id);
    if (!question) throw new Error('Question not found');
    if (question.status === QuestionStatus.ASSIGNED_TO_SPECIALIST) {
      if (question.assigned_specialist_id!.toString() !== currentUserId) throw new Error('You are not assigned to this question');
    } else if (question.status === QuestionStatus.NEEDS_REVISION) {
      const currentAns = await answerRepo.findCurrentByQuestionId(question._id.toString());
      
      if (!currentAns || currentAns.specialist_id.toString() !== currentUserId) throw new Error('You are not authorized to revise this answer');
    } else {
     // throw new Error('Cannot create answer in current status');
    }

   // await answerRepo.markPreviousNotCurrent(question._id.toString());
   let currentAnswer=await answerRepo.findByExactQuestionId(answerData. questionObjId)
  
   currentAnswer.map((answer)=>{
    answer.RevisionSuccess = true
   })
  // currentAnswer.
  // currentAnswer.is_current
    const version = await answerRepo.countVersionsByQuestionId(question._id.toString()) + 1;
    const userObjectId = new Types.ObjectId(currentUserId)
    const newAnswer = await answerRepo.create({
      ...answerData,
      question_id: question._id,
      specialist_id: userObjectId,
      answer_text: answerData.answer_text,
      sources: answerData.sources,
      version,
      answer_id: `A_${require('uuid').v4().slice(0, 8).toUpperCase()}`,
      first_answered_person:question.assigned_specialist_id,
     // original_query_text:question. original_query_text,
     // original_question_id:question.question_id,
     
    });

    // Update question for peer review
    let reviewedBy = question.reviewed_by_specialists || [];
    if (!reviewedBy.includes(userObjectId)) reviewedBy.push(userObjectId);
    question.reviewed_by_specialists = reviewedBy;
    question.consecutive_peer_approvals = 0;
    question.status = QuestionStatus.PENDING_PEER_REVIEW;
    await question.save();
    await userRepo.updateWorkload(currentUserId,-1)
   
    setImmediate(() => WorkflowService.assignToPeerReviewer(newAnswer.answer_id,currentUser,question,answerData));

    logger.info(`Answer created: ${newAnswer.answer_id}, version: ${newAnswer.version}`);
    return { message: 'Answer created successfully', answer_id: newAnswer.answer_id, version: newAnswer.version };
  }

  async getByAnswerId(answerId: string): Promise<any> {
    return answerRepo.findByAnswerId(answerId);
  }

  async getCurrentByQuestionId(questionId: string): Promise<any> {
    return answerRepo.findCurrentByQuestionId(questionId);
  }
}