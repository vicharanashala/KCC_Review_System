import UserRepository from '../repositories/user.repository';
import QuestionRepository from '../repositories/question.repository';
import GoldenFAQRepository from '../repositories/goldenFAQ.repository';
import PeerValidationRepository from '../repositories/peerValidation.repository';
import NotificationRepository from '../repositories/notification.repository';
import ValidationRepository from '../repositories/validation.repository';
import { NotificationType, QuestionStatus, UserRole } from '../interfaces/enums';
import AnswerRepository from '../repositories/answer.repository';
import { IQuestion } from '../interfaces/question.interface';
import { Types } from 'mongoose';

const userRepo = new UserRepository();
const questionRepo = new QuestionRepository();
const goldenFAQRepo = new GoldenFAQRepository();
const notificationRepo = new NotificationRepository();
const answerRepo = new AnswerRepository()
const peerValidation=new PeerValidationRepository()
const validation=new ValidationRepository()
export default class DashboardService {
  async getStats(currentUserId: string): Promise<any> {
    const totalSpecialists = await userRepo.findAll(0, 0, UserRole.AGRI_SPECIALIST).then(u => u.length);
    const activeSpecialists = await userRepo.findAll(0, 0,UserRole.AGRI_SPECIALIST).then(u => u.filter((u: any) => u.is_active).length);
    const totalModerators = await userRepo.findAll(0, 0, UserRole.MODERATOR).then(u => u.length);
    const activeModerators = await userRepo.findAll(0, 0, UserRole.MODERATOR).then(u => u.filter((u: any) => u.is_active).length);

    const pendingQuestions = await questionRepo.findPending();
    const questionsInReview = await questionRepo.findInReview();
    const goldenFaqsCreated = await goldenFAQRepo.count();

    const unreadNotifications = await notificationRepo.countUnreadByUserId(currentUserId);

    const currentUser = await userRepo.findById(currentUserId);

    return {
      system_stats: {
        total_specialists: totalSpecialists,
        active_specialists: activeSpecialists,
        total_moderators: totalModerators,
        active_moderators: activeModerators,
        pending_questions: pendingQuestions,
        questions_in_review: questionsInReview,
        golden_faqs_created: goldenFaqsCreated,
      },
      user_stats: {
        role: currentUser?.role,
        workload_count: currentUser?.workload_count || 0,
        incentive_points: currentUser?.incentive_points || 0,
        notifications_unread: unreadNotifications,
      },
    };
  }

  async getMyTasks(
    currentUserId: string, 
    currentRole: string,
    skip: number,
  limit: number,
  search: string,
    ): Promise<any> {
    const tasks : any[] = [];
   
      const {notifications,total} = await notificationRepo.findNotificationWithUserId(currentUserId,skip,limit,search);
  //  console.log("the notifications coming===",notifications)
      if(notifications)
      await Promise.all(
        notifications.map(async(notif)=>{
          if (!notif.related_entity_id) return null;
          
          if(notif.type==='question_validation'|| notif.type==='question_rejected')
          {
            const peervalidationObj=await peerValidation.findByUserAndPeerValidation(currentUserId,notif.related_entity_id)
            const questionObj = await questionRepo.findByQuestionId(notif.related_entity_id);

           if(questionObj)
            {
              tasks.push({
                type: notif.type,
              question_id: questionObj.question_id, 
            question_text:questionObj.original_query_text,
            consecutive_approvals:questionObj.question_approval,
            created_at: notif.created_at,
             comments:peervalidationObj?.comments,
             question_type:questionObj.query_type||'',
             season:questionObj.season||'',
             state:questionObj.state,
             sector:questionObj.sector,
             crop:questionObj.crop,
             district:questionObj.district,
             kccAns:questionObj.KccAns,
             peer_validation_id:peervalidationObj?.peer_validation_id ||'',
             notification_id:notif.notification_id
               
              });
            }
          }

         
          else if(notif.type==='question_assigned'){// creating-answer
            const peervalidationObj=await peerValidation.findByUserAndPeerValidation(currentUserId,notif.related_entity_id)
            const questionObj = await questionRepo.findByQuestionId(notif.related_entity_id);

            if(questionObj)
            {
           tasks.push({
              type: 'create_answer',
              question_id: questionObj.question_id,
              question_text: questionObj.original_query_text,
              status: questionObj.status,
              valid_count: questionObj.valid_count,
              created_at: questionObj.created_at,
              KccAns:questionObj.KccAns,
              question_type:questionObj.query_type||'N/A',
            season:questionObj.season||'N/A',
            state:questionObj.state||'N/A',
            sector:questionObj.sector||'N/A',
            crop:questionObj.crop||'N/A',
            district:questionObj.district||'N/A',
            notification_id:notif.notification_id,
            peer_validation_id:peervalidationObj?.peer_validation_id ||''
            });
          }
          }
          else if(notif.type==='peer_review_request')
          {
            const peervalidationObj=await peerValidation.findByUserAndAnswerPeerValidation(currentUserId,notif.related_entity_id)
            const peerAnswer = await answerRepo.findByAnswerId(notif.related_entity_id as string);
            if (peerAnswer && peerAnswer.question_id && !(peerAnswer.question_id instanceof Types.ObjectId))
             {
              const q = peerAnswer.question_id as IQuestion;
              tasks.push({
                type: 'peer_review',
                answer_id: peerAnswer.answer_id,
                question_id: q.question_id,
                question_text:
                  q.original_query_text ,
                answer_preview:
                  peerAnswer.answer_text,
                consecutive_approvals: q.consecutive_peer_approvals,
                created_at: notif.created_at,
                 sources:peerAnswer.sources,
                 KccAns:q.KccAns,
                 question_type:q.query_type||'N/A',
                  season:q.season||'N/A',
                  state:q.state||'N/A',
                  sector:q.sector||'N/A',
                  crop:q.crop||'N/A',
                  district:q.district||'N/A',
                  notification_id:notif.notification_id,
                  peer_validation_id:peervalidationObj?.peer_validation_id ||'PV_2E',
                       
              });
            }

          }
          else if(notif.type=="validation_request")
          {
            const peervalidationObj=await validation.findByUserAndAnswerValidation(currentUserId,notif.related_entity_id)
            const peerAnswer = await answerRepo.findByAnswerId(notif.related_entity_id as string);
            if (peerAnswer && peerAnswer.question_id && !(peerAnswer.question_id instanceof Types.ObjectId))
             {
              const q = peerAnswer.question_id as IQuestion;
              tasks.push({
                type: 'validate_answer',
                answer_id: peerAnswer.answer_id,
                question_id: q.question_id,
                question_text:
                  q.original_query_text ,
                answer_preview:
                  peerAnswer.answer_text,
                consecutive_approvals: q.consecutive_peer_approvals,
                created_at: notif.created_at,
                 sources:peerAnswer.sources,
                 KccAns:q.KccAns,
                 question_type:q.query_type||'N/A',
                  season:q.season||'N/A',
                  state:q.state||'N/A',
                  sector:q.sector||'N/A',
                  crop:q.crop||'N/A',
                  district:q.district||'N/A',
                  notification_id:notif.notification_id,
                  peer_validation_id:peervalidationObj?.validation_id ||'PV_2E',
                       
              });
            }

          }
          else if(notif.type=="revision_needed"){
            const peervalidationObj=await peerValidation.findByUserAndAnswerPeerValidation(currentUserId,notif.related_entity_id)
            const peerAnswer = await answerRepo.findByAnswerId(notif.related_entity_id as string);
            if (peerAnswer && peerAnswer.question_id && !(peerAnswer.question_id instanceof Types.ObjectId))
             {
              const questionObj = peerAnswer.question_id as IQuestion;
              tasks.push({
                type: "Reject",
                question_id: questionObj.question_id,
                question_text:
                  questionObj.original_query_text ,
                status: "Rejected",
                valid_count: 0,
                created_at: questionObj.created_at,
                answer_text:peerAnswer.answer_text,
                sources: peerAnswer.sources,
                RejectedUser: peervalidationObj?.reviewer_id,
                questionObjId:questionObj._id,
                KccAns:questionObj.KccAns,
                comments:peervalidationObj?.comments,
                question_type:questionObj.query_type||'N/A',
              season:questionObj.season||'N/A',
              state:questionObj.state||'N/A',
              sector:questionObj.sector||'N/A',
              crop:questionObj.crop||'N/A',
              district:questionObj.district||'N/A',
              notification_id:notif.notification_id,
              peer_validation_id:peervalidationObj?.peer_validation_id||'PV_2E',
              });

             }

           

          }

        })
      )

    
    
    return { tasks ,totalCount:total};
  }
  async getUserPerformance(currentUserId: string, currentRole: string): Promise<any> {

if(currentRole===UserRole.AGRI_SPECIALIST)
{
const userPerformance=await peerValidation.findByReviewerId(currentUserId,UserRole.AGRI_SPECIALIST)

   
    if(userPerformance)
    {
      return {userPerformance}
    }
    else{
      const userCount=await userRepo.getAllUsersList(currentUserId,UserRole.AGRI_SPECIALIST)
      return {userPerformance:userCount[0]}
    }

}
else{
  const userPerformance=await validation.findByModeratorId(currentUserId,UserRole.MODERATOR)
  const questionPerformance=await peerValidation.findByModeratorQuestionStatus(currentUserId,UserRole.MODERATOR)
 // console.log("the question Performance====",questionPerf)
  
 
  if(userPerformance)
    {
      return {userPerformance,questionPerformance}
    }
    else{
      const userCount=await userRepo.getAllUsersList(currentUserId,UserRole.MODERATOR)
      return {userPerformance:userCount[0]}
    }
}
    
   
    
    
  }
  async updateUserState(currentUserId: string,locationDetails:any): Promise<any> {

    const userPerformance=await userRepo.updateUserState(currentUserId,locationDetails)
    if(userPerformance)
    {
      return{state:userPerformance.state}
    }
    else{
      return null
    }
    
  }

}