import { v4 as uuidv4 } from 'uuid';
import QuestionRepository from '../repositories/question.repository';
import NotificationRepository from '../repositories/notification.repository';
import WorkflowService from './workFlow.service';
import { QuestionCreateDto, QuestionResponseDto } from '../interfaces/dto';
import logger from '../utils/logger.utils';
import { QuestionStatus ,NotificationType} from '../interfaces/enums';
import mongoose from "mongoose";
import PeerValidationRepository from '../repositories/peerValidation.repository';
import UserRepository from '../repositories/user.repository';
import { ILLMQuestion } from '../models/LlmQuestion.model';
const userRepo = new UserRepository();
const questionRepo = new QuestionRepository();
const notificationRepo = new NotificationRepository();
const peerValidationRepo = new PeerValidationRepository();

export default class QuestionService {
  async create(questionData: QuestionCreateDto): Promise<any> {
   // console.log("the question data===",questionData)
   
    if(questionData.question_id)
    {
     // console.log("the first loop")
      if(questionData.user_id && questionData.notification_id)
      {
        
          await notificationRepo.markReadAndSubmit(
            questionData.notification_id,
            questionData.user_id
          );
        

      }
     
      const question=await questionRepo.findByQuestionId(questionData.question_id)
      if(question)
      {
        const convertUserid = mongoose.Types.ObjectId.createFromHexString(question.user_id)
        let peer_validation
        if(questionData.peer_validation_id)
        {
          peer_validation=questionData.peer_validation_id
        
        const peervalidation=await peerValidationRepo.findByPeerValidation(peer_validation)
       
          if(questionData.status=="approved")
          { 
          //  console.log("approve________________")
            await userRepo.updateIncentive(question.user_id, 1)
            
            question.question_approval=(question.question_approval|| 0) + 1
            await question.save()
            
          // console.log("the question approved====",questionData,question)
           // const convertUserid = mongoose.Types.ObjectId.createFromHexString(question.user_id)
          
            if(peervalidation)
            {
             
            const result=  await peerValidationRepo.updatePeerValidationBypeerId(peer_validation,"approved")
          // console.log("the peer validation--------------",result)
             
            }
        if(question.question_approval>=2)
        {
          await userRepo.updateWorkload(question.user_id, 1);
         // console.log("the question approved====********",question)
          question.reviewed_by_Moderators=[]
          await question.save();
          setImmediate(() => WorkflowService.assignQuestionToSpecialist(question.question_id,questionData.user_id));
        logger.info(`New question submitted To Agri Specilist: ${question.question_id}`);
        }
        else{
         // console.log("the else block is executing====")
            setImmediate(() => WorkflowService.assignQuestionToModerator(question.question_id,questionData));
            logger.info(`second question review submitted To modarator: ${question.question_id}`);
        }
           
          }
          else if(questionData.status=="revised")
          {
            question.reviewed_by_Moderators=[]
          await question.save();
            await userRepo.updatePenality(question.user_id, 1)
            await userRepo.updateWorkload(question.user_id, 1);
            const convertUserid = mongoose.Types.ObjectId.createFromHexString(question.user_id)
            question.question_approval= 0 
           // question.reviewed_by_Moderators=[]
            
         
            await question.save()
            logger.info(`Question Assigned back to original question creater ${question.question_id},${question.user_id}`);
           
            if(peervalidation)
            {
              const result=  await peerValidationRepo.updatePeerValidationBypeerId(peer_validation,"revised" )
           
            }
            setImmediate(() => WorkflowService.assignQuestionToModerator(question.question_id,questionData));
            }
       else {
        if (questionData.reviewed_by_Moderators) {
          questionData.reviewed_by_Moderators.push(
            new mongoose.Types.ObjectId(questionData.user_id)
          );
        } else {
          questionData.reviewed_by_Moderators = [
            new mongoose.Types.ObjectId(questionData.user_id)
          ];
        }
        if (questionData.user_id) {
           await userRepo.updateWorkload(questionData.user_id, -1);
        }
        
       
              
           const updatedQuestion=   await questionRepo.findAndUpdateQuestion(question.question_id,questionData, questionData.status as QuestionStatus)
          
              if(peervalidation)
              {
                const result=  await peerValidationRepo.updatePeerValidationBypeerId(peer_validation,QuestionStatus.QUESTION_CORRECTED)
               
              }
              setImmediate(() => WorkflowService.assignQuestionToModerator(question.question_id,questionData));
              

            }
           
          
          }
          
         
        
        return {
          question_id: question.question_id,
          original_query_text: question.original_query_text,
          status: question.status,
          assigned_specialist: undefined,
          valid_count: question.valid_count,
          consecutive_peer_approvals: question.consecutive_peer_approvals,
          created_at: question.created_at,
          question_owner:questionData.user_id
        }; 
      }
      
    }
    else{ 
      if (questionData.reviewed_by_Moderators) {
        questionData.reviewed_by_Moderators.push(
          new mongoose.Types.ObjectId(questionData.user_id)
        );
      } else {
        questionData.reviewed_by_Moderators = [
          new mongoose.Types.ObjectId(questionData.user_id)
        ];
      }
      
      const question = await questionRepo.create({ ...questionData, status: questionData.status as QuestionStatus,question_id: `Q_${uuidv4().slice(0, 8).toUpperCase()}`, });
      setImmediate(() => WorkflowService.assignQuestionToModerator(question.question_id,questionData));
      return {
        question_id: question.question_id,
        original_query_text: question.original_query_text,
        status: question.status,
        assigned_specialist: undefined,
        valid_count: question.valid_count,
        consecutive_peer_approvals: question.consecutive_peer_approvals,
        created_at: question.created_at,
        question_owner:questionData.user_id
      }; 
    }
   
   
   
    
  }

  async createMany(questionDatas: QuestionCreateDto[]): Promise<QuestionResponseDto[]> {
  const preparedDatas = questionDatas.map(data => ({
    ...data,
    question_id: `Q_${uuidv4().slice(0, 8).toUpperCase()}`,
    // Ensure defaults if not provided (though schema handles)
    status: QuestionStatus.PENDING_ASSIGNMENT,
    valid_count: 0,
    consecutive_peer_approvals: 0,
    // Other defaults as per schema
  }));

  const questions = await questionRepo.createMany(preparedDatas);

  // Trigger workflow for each
  for (const question of questions) {
    await WorkflowService.assignQuestionToSpecialist(question.question_id);
  }

  logger.info(`Batch questions submitted: ${questions.length} questions`);

  // Map to DTOs
  return questions.map(question => ({
    question_id: question.question_id,
    original_query_text: question.original_query_text,
    status: question.status,
    assigned_specialist: undefined,
    valid_count: question.valid_count,
    consecutive_peer_approvals: question.consecutive_peer_approvals,
    created_at: question.created_at,
  }));
}

  async getByQuestionId(questionId: string): Promise<any> {
    const question = await questionRepo.findByQuestionId(questionId);
    if (!question) throw new Error('Question not found');
    return question;
  }

  async getAssignedToUser(userId: string): Promise<any[]> {
    const data = questionRepo.findAssignedToUser(userId, [QuestionStatus.ASSIGNED_TO_SPECIALIST, QuestionStatus.NEEDS_REVISION, QuestionStatus.READY_FOR_GOLDEN_FAQ]);
    return data
  }

  async createLLMQuestions(data:ILLMQuestion){
    return await questionRepo.createLLmQuestion(data)
  }

  async getAllLLMQuestions(){
    return await questionRepo.getAllLLMQuestions()
  }

  async getLLmQuestionsByUserId(userId:string){
    return await questionRepo.getLLMQuestionsBYUserId(userId)
  }

  async markLlmAsRead(id:string){
    return await questionRepo.markLLmAsRead(id)
  }
}