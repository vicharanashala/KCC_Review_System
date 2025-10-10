import { v4 as uuidv4 } from 'uuid';
import QuestionRepository from '../repositories/question.repository';
import NotificationRepository from '../repositories/notification.repository';
import WorkflowService from './workFlow.service';
import { QuestionCreateDto, QuestionResponseDto } from '../interfaces/dto';
import logger from '../utils/logger.utils';
import { QuestionStatus ,NotificationType} from '../interfaces/enums';
import mongoose from "mongoose";
import PeerValidationRepository from '../repositories/peerValidation.repository';


const questionRepo = new QuestionRepository();
const notificationRepo = new NotificationRepository();
const peerValidationRepo = new PeerValidationRepository();

export default class QuestionService {
  async create(questionData: QuestionCreateDto): Promise<any> {
    console.log("the question data===",questionData)
   
    if(questionData.question_id)
    {
      console.log("the first loop")
      const question=await questionRepo.findByQuestionId(questionData.question_id)
      if(question)
      {
        let peer_validation
        if(questionData.peer_validation_id)
        {
          peer_validation=questionData.peer_validation_id
        
        const peervalidation=await peerValidationRepo.findByPeerValidation(peer_validation)
       
          if(questionData.status=="approved")
          { 
            question.question_approval=(question.question_approval|| 0) + 1
            await question.save()
            
          // console.log("the question approved====",questionData,question)
           // const convertUserid = mongoose.Types.ObjectId.createFromHexString(question.user_id)
           console.log("?????***********peervalidation======",peervalidation)
            if(peervalidation)
            {
              console.log("***********peervalidation======",peervalidation)
            const result=  await peerValidationRepo.updatePeerValidationBypeerId(peer_validation,QuestionStatus.PENDING_PEER_MODERATION_REVIEW)
            console.log("the value is updated===",result)
             // peervalidation.status=QuestionStatus.PENDING_PEER_MODERATION_REVIEW
            // await peervalidation.save()
             /* await Promise.all(
                peervalidation.map(async(notify)=>{
                  try {
                   // await notificationRepo.updateNotificationsByUserAndQuestion(notify.reviewer_id.toString(),NotificationType.QUESTION_VALIDATION_SUCCESS,question.question_id);
                     } catch (err) {
                    console.error(`❌ Failed to update notification ${notify._id}:`, err);
                  }
                })
               
              )*/
            }
           if(question.question_approval>=2)
        {
          console.log("the question approved====********",question)
          setImmediate(() => WorkflowService.assignQuestionToSpecialist(question.question_id,questionData.user_id));
        logger.info(`New question submitted To modarator: ${question.question_id}`);
        }
        else{
            setImmediate(() => WorkflowService.assignQuestionToModerator(question.question_id,questionData));
        }
           
          }
          else if(questionData.status=="revised")
          {
            
            const convertUserid = mongoose.Types.ObjectId.createFromHexString(question.user_id)
            question.question_approval= 0 
            await question.save()
            logger.info(`Question Assigned back to original question creater ${question.question_id},${question.user_id}`);
           
            if(peervalidation)
            {
              const result=  await peerValidationRepo.updatePeerValidationBypeerId(peer_validation,QuestionStatus.QUESTION_REJECTED )
            console.log("the value is updated===",result)
            }
            setImmediate(() => WorkflowService.assignQuestionToModerator(question.question_id,questionData));
            }
       else {
              console.log("second loop===")
           const updatedQuestion=   await questionRepo.findAndUpdateQuestion(question.question_id,questionData, questionData.status as QuestionStatus)
           console.log("update question===",updatedQuestion)
              if(peervalidation)
              {
                const result=  await peerValidationRepo.updatePeerValidationBypeerId(peer_validation,QuestionStatus.QUESTION_CORRECTED)
                console.log("the value is updated===",result)
              }
              setImmediate(() => WorkflowService.assignQuestionToModerator(question.question_id,questionData));
              console.log("the else is executing====")

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
      const question = await questionRepo.create({ ...questionData, status: questionData.status as QuestionStatus,question_id: `Q_${uuidv4().slice(0, 8).toUpperCase()}` });
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
}