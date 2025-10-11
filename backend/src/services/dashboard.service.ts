import UserRepository from '../repositories/user.repository';
import QuestionRepository from '../repositories/question.repository';
import GoldenFAQRepository from '../repositories/goldenFAQ.repository';
import PeerValidationRepository from '../repositories/peerValidation.repository';
import NotificationRepository from '../repositories/notification.repository';
import { NotificationType, QuestionStatus, UserRole } from '../interfaces/enums';
import AnswerRepository from '../repositories/answer.repository';
import { IQuestion } from '../interfaces/question.interface';
import { Types } from 'mongoose';
import { boolean } from 'joi';

const userRepo = new UserRepository();
const questionRepo = new QuestionRepository();
const goldenFAQRepo = new GoldenFAQRepository();
const notificationRepo = new NotificationRepository();
const answerRepo = new AnswerRepository()
const peerValidation=new PeerValidationRepository()
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

  async getMyTasks(currentUserId: string, currentRole: string): Promise<any> {
    const tasks = [];
    if (currentRole === UserRole.AGRI_SPECIALIST) {
      const assignedQuestions = await questionRepo.findAssignedToUser(currentUserId, [
        QuestionStatus.ASSIGNED_TO_SPECIALIST,
        QuestionStatus.NEEDS_REVISION,
        QuestionStatus.READY_FOR_GOLDEN_FAQ,
      ]);
      for (const question of assignedQuestions) {
        let taskType = 'create_answer';
        if (question.status === QuestionStatus.READY_FOR_GOLDEN_FAQ) {
          const currentAns = await answerRepo.findCurrentByQuestionId(question._id.toString());
          if (currentAns && currentAns.specialist_id.toString() === currentUserId) taskType = 'create_golden_faq';
        } else if (question.status === QuestionStatus.NEEDS_REVISION) {
          const currentAns = await answerRepo.findCurrentByQuestionId(question._id.toString());
          if (currentAns && currentAns.specialist_id.toString() === currentUserId) taskType = 'revise_answer';
          else continue;
        }

        tasks.push({
          type: taskType,
          question_id: question.question_id,
          question_text: question.original_query_text,
          status: question.status,
          valid_count: question.valid_count,
          created_at: question.created_at,
          KccAns:question.KccAns,
          question_type:question.query_type||'N/A',
        season:question.season||'N/A',
        state:question.state||'N/A',
        sector:question.sector||'N/A',
        crop:question.crop||'N/A',
        district:question.district||'N/A'
        });
      }

      // const peerNotifications = await notificationRepo.findUnreadByUserId(currentUserId, NotificationType.PEER_REVIEW_REQUEST);
      const peerNotifications = await notificationRepo.findAllByUserId(currentUserId)
      for (const notification of peerNotifications) {
  const peerAnswer = await answerRepo.findByAnswerId(notification.related_entity_id as string);
    
  if (peerAnswer && peerAnswer.question_id && !(peerAnswer.question_id instanceof Types.ObjectId)) {
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
      created_at: notification.created_at,
       sources:peerAnswer.sources,
       KccAns:q.KccAns,
       question_type:q.query_type||'N/A',
        season:q.season||'N/A',
        state:q.state||'N/A',
        sector:q.sector||'N/A',
        crop:q.crop||'N/A',
        district:q.district||'N/A',
             
    });
  }
}
    } else if (currentRole === UserRole.MODERATOR) {
      // const validationNotifications = await notificationRepo.findUnreadByUserId(currentUserId, NotificationType.VALIDATION_REQUEST);
      const validationNotifications = await notificationRepo.findAllByUserId(currentUserId);
      for (const notification of validationNotifications) {
        const answer = await answerRepo.findByAnswerId(notification.related_entity_id as string);
        if (answer && answer.question_id && !(answer.question_id instanceof Types.ObjectId)) {
          const q = answer.question_id as IQuestion;

          if (q.status === QuestionStatus.PENDING_MODERATION) {
            tasks.push({
              type: "validate_answer",
              answer_id: answer.answer_id,
              question_id: q.question_id,
              question_text:
                q.original_query_text,
              answer_preview:
                answer.answer_text,
              current_valid_count: q.valid_count,
              consecutive_approvals: q.consecutive_peer_approvals,
              created_at: notification.created_at,
              question_type:q.query_type||'N/A',
              season:q.season||'N/A',
              state:q.state||'N/A',
              sector:q.sector||'N/A',
              crop:q.crop||'N/A',
              district:q.district||'N/A',
            });
          }
        }
      }
    }
    
      const validationNotifications = await peerValidation.findUnreadByUserId(currentUserId, QuestionStatus.ASSIGNED_TO_MODERATION);
     // console.log("the notifications====",validationNotifications)
      if (validationNotifications && validationNotifications.length > 0) {
        const questionList = await Promise.all(
          validationNotifications.map(async (notif) => {
            if (!notif.quetion_id) return null; 
            const questionObj = await questionRepo.findByQuestionId(notif.quetion_id);
            if(questionObj&&questionObj.question_approval<2)
            {
              tasks.push({
                
              type: "question_validation",
             // question: questionObj,
              question_id: questionObj.question_id, 
           question_text:questionObj.original_query_text,
            consecutive_approvals:questionObj.question_approval,
            created_at: notif.created_at,
             comments:notif.comments,
             question_type:questionObj.query_type||'',
             season:questionObj.season||'',
             state:questionObj.state,
             sector:questionObj.sector,
             crop:questionObj.crop,
             district:questionObj.district,
             kccAns:questionObj.KccAns,
             peer_validation_id:notif.peer_validation_id
               
              });
            }
          })
        );
      
        // You can now use `questionList` (e.g., send to frontend)
       
      
      

    }
    const validationNotificationsRject = await peerValidation.findUnreadByUserId(currentUserId, QuestionStatus.QUESTION_SENDBACK_TO_OWNER);
    
    if (validationNotificationsRject && validationNotificationsRject.length > 0) {
      const questionList = await Promise.all(
        validationNotificationsRject.map(async (notif) => {
          if (!notif.quetion_id) return null; 
          const questionObj = await questionRepo.findByQuestionId(notif.quetion_id);
          if(questionObj&&questionObj.question_approval<2)
          {
            tasks.push({
              type: "question_rejected",
             // question: questionObj,
              question_id: questionObj.question_id, 
           question_text:questionObj.original_query_text,
            consecutive_approvals:questionObj.question_approval,
            created_at: notif.created_at,
             comments:notif.comments,
             question_type:questionObj.query_type||'',
             season:questionObj.season||'',
             state:questionObj.state,
             sector:questionObj.sector,
             crop:questionObj.crop,
             district:questionObj.district,
             kccAns:questionObj.KccAns,
             peer_validation_id:notif.peer_validation_id

            });
          }
        })
      );
    
      // You can now use `questionList` (e.g., send to frontend)
     
    
    

  }

    const status=false
    const revisionSuccess=true
    const rejectedAnswers= await answerRepo.findRejectedQuestions(currentUserId,status,revisionSuccess)
    if(rejectedAnswers)
    {
      await Promise.all(
        rejectedAnswers.map(async (answer) => {
          const questionObj = await questionRepo.findByQuestionObjectId(answer.question_id);
          const peerValidationObj=await peerValidation.findByAnswerObjId(answer._id)
          
          const comments = peerValidationObj?.[0]?.comments;
          
      if(questionObj)
      {
        tasks.push({
          type: "Reject",
          question_id: questionObj.question_id,
          question_text:
            questionObj.original_query_text ,
          status: "Rejected",
          valid_count: 0,
          created_at: questionObj.created_at,
          answer_text:answer.answer_text,
          sources: answer.sources,
          RejectedUser: answer.specialist_id,
          questionObjId:answer.question_id,
          KccAns:questionObj.KccAns,
          comments:comments,
          question_type:questionObj.query_type||'N/A',
        season:questionObj.season||'N/A',
        state:questionObj.state||'N/A',
        sector:questionObj.sector||'N/A',
        crop:questionObj.crop||'N/A',
        district:questionObj.district||'N/A',
        });
      }
         
        })
      );
      
     

    }
  

    return { tasks };
  }
  async getUserPerformance(currentUserId: string, currentRole: string): Promise<any> {

    const userPerformance=await peerValidation.findByReviewerId(currentUserId)
   // console.log("userPerformance====",userPerformance)
    const userCount=await userRepo.getAllUsersList(currentUserId)
   
    if(userPerformance)
    {
      return userPerformance
    }
    else{
      return userCount[0]
    }
    
  }
  async updateUserState(currentUserId: string,locationDetails:any): Promise<any> {

    const userPerformance=await userRepo.updateUserState(currentUserId,locationDetails)
  // console.log("userper===",userPerformance)
    if(userPerformance)
    {
      return{state:userPerformance.state}
    }
    else{
      return null
    }
    
  }

}