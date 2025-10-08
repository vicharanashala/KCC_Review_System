import UserRepository from "../repositories/user.repository";
import { QuestionStatus, UserRole } from "../interfaces/enums";
import QuestionRepository from "../repositories/question.repository";
import GoldenFAQ from "../models/goldenFAQ.model";
import User from "../models/user.model";
import { IUser } from "../interfaces/user.interface";
const userRepo = new UserRepository();
const questionRepo = new QuestionRepository();
export default class AdminService {
  async getAllUsers(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    role?: UserRole
  ): Promise<{ users: IUser[]; total: number }> {
    const users = await userRepo.findAll(skip, limit, role, search);
    const totalDocs = await userRepo.count(role, search);
    return { users, total: totalDocs };
  }

  async updateUserStatus(
    userId: string,
    isActive: boolean,
    isAvailable?: boolean
  ): Promise<any> {
    const user = await userRepo.updateStatus(userId, isActive, isAvailable);
    if (!user) throw new Error("User not found");
    return { message: `User ${user.name} status updated successfully` };
  }

  async updateUserDetails(
    userId: string,
    role: string,
    specializationField: string
  ): Promise<any> {
    const user = await userRepo.updateDetails(userId, role, specializationField);
    if (!user) throw new Error("User not found");
    return { message: `User ${user.name} status updated successfully` };
  }

  async getWorkflowPerformance(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const totalQuestions = await questionRepo.findByCreatedAt(startDate);
    const completedQuestions = await questionRepo.findByCreatedAtAndStatus(
      startDate,
      QuestionStatus.GOLDEN_FAQ_CREATED
    );

    // Avg processing time using aggregation
    const avgValidationTime = await GoldenFAQ.aggregate([
      { $match: { created_at: { $gte: startDate } } },
      {
        $lookup: {
          from: "questions",
          localField: "question_id",
          foreignField: "_id",
          as: "question",
        },
      },
      { $unwind: "$question" },
      {
        $group: {
          _id: null,
          avgHours: {
            $avg: {
              $divide: [
                { $subtract: ["$created_at", "$question.created_at"] },
                3600000,
              ],
            },
          },
        },
      },
    ]).then((res) => res[0]?.avgHours || 0);

    // Specialist performance using aggregation
    const specialistPerformance = await User.aggregate([
      { $match: { role: UserRole.AGRI_SPECIALIST } },
      {
        $lookup: {
          from: "questions",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$assigned_specialist_id", "$$userId"] },
                created_at: { $gte: startDate },
              },
            },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          as: "questions_handled",
        },
      },
      {
        $lookup: {
          from: "goldenfaqs",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$created_by", "$$userId"] },
                created_at: { $gte: startDate },
              },
            },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          as: "golden_faqs_created",
        },
      },
      {
        $project: {
          name: 1,
          user_id: 1,
          questions_handled: { $arrayElemAt: ["$questions_handled.count", 0] },
          golden_faqs_created: {
            $arrayElemAt: ["$golden_faqs_created.count", 0],
          },
        },
      },
      { $sort: { golden_faqs_created: -1 } },
    ]);

    return {
      period_days: days,
      total_questions: totalQuestions.length,
      completed_questions: completedQuestions.length,
      completion_rate:
        totalQuestions.length > 0
          ? (completedQuestions.length / totalQuestions.length) * 100
          : 0,
      avg_processing_time_hours: Math.round(avgValidationTime * 100) / 100,
      specialist_performance: specialistPerformance,
    };
  }
  async deleteUserDetails(
    userId: string,
    
  ): Promise<any> {
    const user = await userRepo.deleteUser(userId);
    if (!user) throw new Error("User not found");
    return { message: `User ${user.name} deleted successfully` };
  }
  async getAllQuestions(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    questionsSearch?:string
  ): Promise<{ questions: any[]; total: number }> {
   
    // Your repo function already returns { data, total }
    const { data, total } = await questionRepo.findAll(skip, limit, questionsSearch, search);
  
    return { questions: data, total };
  }

}
