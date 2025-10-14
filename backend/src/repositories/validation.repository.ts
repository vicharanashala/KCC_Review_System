import Validation from '../models/validation.model';
import { IValidation } from '../interfaces/validation.interface';
import answerModel from '../models/answer.model';
import mongoose from "mongoose";
export default class ValidationRepository {
  async create(validationData: Partial<IValidation>): Promise<IValidation> {
    return Validation.create(validationData);
  }

  async findByValidationId(validationId: string): Promise<IValidation | null> {
    return Validation.findOne({ validation_id: validationId }).populate('answer_id moderator_id');
  }

  // async findByAnswerId(answerId: string): Promise<IValidation[]> {
  //   return Validation.find({ answer_id: answerId }).populate('answer moderator');
  // }

  async findByAnswerId(answerId: string): Promise<IValidation[]> {
    let answerObjectId = answerId;

    // If not a valid ObjectId, assume it's a custom answer_id like A_XXXX
    if (!/^[0-9a-fA-F]{24}$/.test(answerId)) {
      const answer = await answerModel.findOne({ answer_id: answerId });
      if (!answer) throw new Error(`Answer with id ${answerId} not found`);
      answerObjectId = answer._id.toString();
    }

    return Validation.find({ answer_id: answerObjectId })
      .populate('answer_id moderator_id')
      .sort({ created_at: -1 });
  }

  async countByAnswerId(answerId: string): Promise<number> {
    return Validation.countDocuments({ answer_id: answerId });
  }

  async findByAnswerAndModerator(answerId: string, moderatorId: string): Promise<IValidation | null> {
    return Validation.findOne({ answer_id: answerId, moderator_id: moderatorId }).populate('answer_id moderator_id');
  }
  async findByModeratorId(reviewer_id: string, role: string) {
    const reviewerStats = await Validation.aggregate([
      // 1️⃣ Filter by reviewer
      {
        $match: {
          moderator_id: new mongoose.Types.ObjectId(reviewer_id),
        },
      },
  
      // 2️⃣ Join with Answers
      {
        $lookup: {
          from: "answers",
          localField: "answer_id",
          foreignField: "_id",
          as: "answer",
        },
      },
      { $unwind: "$answer" },
  
      // 3️⃣ Join with Questions
      {
        $lookup: {
          from: "questions",
          localField: "answer.question_id",
          foreignField: "_id",
          as: "question",
        },
      },
      { $unwind: "$question" },
  
      // 4️⃣ Sort reviews chronologically
      { $sort: { created_at: 1 } },
  
      // 5️⃣ Capture previous review for fastest review calc
      {
        $setWindowFields: {
          partitionBy: "$reviewer_id",
          sortBy: { created_at: 1 },
          output: {
            prevCreatedAt: { $shift: { output: "$created_at", by: -1 } },
          },
        },
      },
  
      // 6️⃣ Helper fields
      {
        $addFields: {
          reviewDiffSeconds: {
            $cond: [
              { $ifNull: ["$prevCreatedAt", false] },
              { $divide: [{ $subtract: ["$created_at", "$prevCreatedAt"] }, 1000] },
              null,
            ],
          },
          reviewDurationMinutes: {
            $divide: [{ $subtract: ["$created_at", "$answer.created_at"] }, 1000 * 60],
          },
          reviewHour: { $hour: "$created_at" },
          reviewDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
          },
        },
      },
  
      // 7️⃣ Group reviewer stats
      {
        $group: {
          _id: "$moderator_id",
          totalAssigned: { $sum: 1 },
          approvedCount: {
            $sum: {
              $cond: [{ $eq: ["$validation_status", "valid"] }, 1, 0],
            },
          },
          revisedCount: {
            $sum: {
              $cond: [{ $eq: ["$validation_status", "invalid"] }, 1, 0],
            },
          },
          rejectedCount: {
            $sum: {
              $cond: [{ $eq: ["$validation_status", ""] }, 1, 0],
            },
          },
          latestApproved: {
            $max: {
              $cond: [
                { $eq: ["$validation_status", "valid"] },
                "$created_at",
                null,
              ],
            },
          },
          latestRevised: {
            $max: {
              $cond: [
                { $eq: ["$validation_status", "invalid"] },
                "$created_at",
                null,
              ],
            },
          },
          reviewDates: { $addToSet: "$reviewDate" },
          peakHours: { $push: "$reviewHour" },
          fastestReviewSeconds: { $min: "$reviewDiffSeconds" },
          totalReviewMinutes: { $sum: "$reviewDurationMinutes" },
          reviews: {
            $push: {
              status: "$status",
              createdAt: "$created_at",
              questionId: "$question._id",
              questionText: "$question.original_query_text",
              answerId: "$answer._id",
            },
          },
        },
      },
  
      // 8️⃣ Compute latest approved/revised
      {
        $addFields: {
          latestApprovedQuestion: {
            $first: {
              $filter: {
                input: "$reviews",
                as: "r",
                cond: { $eq: ["$$r.createdAt", "$latestApproved"] },
              },
            },
          },
          latestRevisedQuestion: {
            $first: {
              $filter: {
                input: "$reviews",
                as: "r",
                cond: { $eq: ["$$r.createdAt", "$latestRevised"] },
              },
            },
          },
        },
      },
  
      // 9️⃣ Derived metrics
      {
        $addFields: {
          approvalRate: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalAssigned", 0] },
                  0,
                  { $multiply: [{ $divide: ["$approvedCount", "$totalAssigned"] }, 100] },
                ],
              },
              2,
            ],
          },
          activeDays: { $size: "$reviewDates" },
          QperDay: {
            $round: [
              {
                $cond: [
                  { $eq: [{ $size: "$reviewDates" }, 0] },
                  0,
                  { $divide: ["$totalAssigned", { $size: "$reviewDates" }] },
                ],
              },
              2,
            ],
          },
          fastestReviewMinutes: {
            $round: [{ $divide: ["$fastestReviewSeconds", 60] }, 2],
          },
          averageReviewHours: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalAssigned", 0] },
                  0,
                  {
                    $divide: [
                      "$totalReviewMinutes",
                      { $multiply: [60, "$totalAssigned"] },
                    ],
                  },
                ],
              },
              2,
            ],
          },
        },
      },
  
      // 🔟 Lookup rank info (add role filter here 🟩)
      {
        $lookup: {
          from: "users",
          let: { reviewerId: "$_id" },
          pipeline: [
            // 🟩 Only include users of the given role
            ...(role ? [{ $match: { role } }] : []),
  
            { $sort: { incentive_points: -1 } },
            {
              $setWindowFields: {
                sortBy: { incentive_points: -1 },
                partitionBy: role ? "$role" : undefined, // rank within same role
                output: { rank: { $rank: {} } },
              },
            },
            { $match: { $expr: { $eq: ["$_id", "$$reviewerId"] } } },
            {
              $lookup: {
                from: "users",
                pipeline: [
                  ...(role ? [{ $match: { role } }] : []),
                  { $count: "totalUsers" },
                ],
                as: "userCount",
              },
            },
            { $unwind: { path: "$userCount", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                rank: 1,
                incentive_points: 1,
                penality: 1,
                totalUsers: "$userCount.totalUsers",
              },
            },
          ],
          as: "rankInfo",
        },
      },
      { $unwind: { path: "$rankInfo", preserveNullAndEmptyArrays: true } },
  
      // 11️⃣ Milestone + ranking %
      {
        $addFields: {
          milestoneTarget: 200,
          milestoneProgress: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalAssigned", 0] },
                  0,
                  { $multiply: [{ $divide: ["$totalAssigned", 200] }, 100] },
                ],
              },
              2,
            ],
          },
          rankingPercentage: {
            $round: [
              {
                $cond: [
                  {
                    $and: [
                      { $gt: ["$rankInfo.totalUsers", 0] },
                      { $ifNull: ["$rankInfo.rank", false] },
                    ],
                  },
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $add: [
                              {
                                $subtract: [
                                  "$rankInfo.totalUsers",
                                  "$rankInfo.rank",
                                ],
                              },
                              1,
                            ],
                          },
                          "$rankInfo.totalUsers",
                        ],
                      },
                      100,
                    ],
                  },
                  0,
                ],
              },
              2,
            ],
          },
        },
      },
  
      // 12️⃣ Final projection
      {
        $project: {
          _id: 0,
          totalAssigned: 1,
          approvedCount: 1,
          revisedCount: 1,
          rejectedCount: 1,
          approvalRate: 1,
          activeDays: 1,
          QperDay: 1,
          fastestReviewMinutes: 1,
          averageReviewHours: 1,
          milestoneTarget: 1,
          milestoneProgress: 1,
          currentRank: "$rankInfo.rank",
          totalUsers: "$rankInfo.totalUsers",
          incentivePoints: { $round: ["$rankInfo.incentive_points", 2] },
          penality: "$rankInfo.penality",
          rankingPercentage: 1,
          latestApprovedQuestion: 1,
          latestRevisedQuestion: 1,
        },
      },
    ]);
  
    if (reviewerStats.length > 0) {
      const stats = reviewerStats[0];
      stats.rankMessage =
        stats.currentRank && stats.totalUsers
          ? `#${stats.currentRank} out of ${stats.totalUsers} ${role}s`
          : null;
      return stats;
    }
  
    return null;
  }
  
}