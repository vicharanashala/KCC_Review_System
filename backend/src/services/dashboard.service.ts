import UserRepository from '../repositories/user.repository';
import QuestionRepository from '../repositories/question.repository';
import GoldenFAQRepository from '../repositories/goldenFAQ.repository';
import NotificationRepository from '../repositories/notification.repository';
import { NotificationType, QuestionStatus, UserRole } from '../interfaces/enums';
import AnswerRepository from '../repositories/answer.repository';

const userRepo = new UserRepository();
const questionRepo = new QuestionRepository();
const goldenFAQRepo = new GoldenFAQRepository();
const notificationRepo = new NotificationRepository();
const answerRepo = new AnswerRepository()
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
          question_text: question.original_query_text.length > 100 ? question.original_query_text.slice(0, 100) + '...' : question.original_query_text,
          status: question.status,
          valid_count: question.valid_count,
          created_at: question.created_at,
        });
      }

      const peerNotifications = await notificationRepo.findUnreadByUserId(currentUserId, NotificationType.PEER_REVIEW_REQUEST);
      for (const notification of peerNotifications) {
        const peerAnswer = await answerRepo.findByAnswerId(notification.related_entity_id as string);
        if (peerAnswer) {
          tasks.push({
            type: 'peer_review',
            answer_id: peerAnswer.answer_id,
            question_id: peerAnswer.question.question_id,
            question_text: peerAnswer.question.original_query_text.length > 100 ? peerAnswer.question.original_query_text.slice(0, 100) + '...' : peerAnswer.question.original_query_text,
            answer_preview: peerAnswer.answer_text.length > 200 ? peerAnswer.answer_text.slice(0, 200) + '...' : peerAnswer.answer_text,
            consecutive_approvals: peerAnswer.question.consecutive_peer_approvals,
            created_at: notification.created_at,
          });
        }
      }
    } else if (currentRole === UserRole.MODERATOR) {
      const validationNotifications = await notificationRepo.findUnreadByUserId(currentUserId, NotificationType.VALIDATION_REQUEST);
      for (const notification of validationNotifications) {
        const answer = await answerRepo.findByAnswerId(notification.related_entity_id as string);
        if (answer && answer.question.status === QuestionStatus.PENDING_MODERATION) {
          tasks.push({
            type: 'validate_answer',
            answer_id: answer.answer_id,
            question_id: answer.question.question_id,
            question_text: answer.question.original_query_text.length > 100 ? answer.question.original_query_text.slice(0, 100) + '...' : answer.question.original_query_text,
            answer_preview: answer.answer_text.length > 200 ? answer.answer_text.slice(0, 200) + '...' : answer.answer_text,
            current_valid_count: answer.question.valid_count,
            created_at: notification.created_at,
          });
        }
      }
    }

    return { tasks };
  }
}