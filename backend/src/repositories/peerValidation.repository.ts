import PeerValidation from '../models/peerValidation.model';
import { IPeerValidation } from '../interfaces/peerValidation.interface';
import answerModel from '../models/answer.model';
import mongoose from "mongoose";
interface ReviewerStats {
  _id: string;
  totalAssigned: number;
  approvedCount: number;
  revisedCount: number;
  rejectedCount: number;
  pendingCount: number;
  approvalRate: number;
  recentApprovalTime: Date | null;
  recentRejectionTime: Date | null;
}
export default class PeerValidationRepository {
  async create(peerValidationData: Partial<IPeerValidation>): Promise<IPeerValidation> {
    return PeerValidation.create(peerValidationData);
  }

  async findByPeerValidationId(peerValidationId: string): Promise<IPeerValidation | null> {
    return PeerValidation.findOne({ peer_validation_id: peerValidationId }).populate('answer reviewer');
  }
  
   async findByAnswerObjId(answerId:any): Promise<IPeerValidation[]> {
     return PeerValidation.find({ answer_id: answerId, status: 'revised' })
   }

  async findByAnswerId(answerId: string): Promise<IPeerValidation[]> {
    let answerObjectId = answerId;
    if (!/^[0-9a-fA-F]{24}$/.test(answerId)) {
      const answer = await answerModel.findOne({ answer_id: answerId });
      if (!answer) throw new Error(`Answer with id ${answerId} not found`);
      answerObjectId = answer._id.toString();
    }
    return PeerValidation.find({ answer_id: answerObjectId })
      .populate('answer_id reviewer_id')
      .sort({ created_at: -1 });
  }

  async findLastByAnswerId(answerId: string): Promise<IPeerValidation | null> {
    let answerObjectId = answerId;
    if (!/^[0-9a-fA-F]{24}$/.test(answerId)) {
      const answer = await answerModel.findOne({ answer_id: answerId });
      if (!answer) throw new Error(`Answer with id ${answerId} not found`);
      answerObjectId = answer._id.toString();
    }
    return PeerValidation.findOne({ answer_id: answerObjectId }).sort({ created_at: -1 }).populate('answer_id reviewer_id');
  }
  async findByReviewerId(reviewer_id: string) {
    const reviewerStats = await PeerValidation.aggregate([
      // Filter by reviewer
      { $match: { reviewer_id: new mongoose.Types.ObjectId(reviewer_id) } },
  
      // Join with Answers
      {
        $lookup: {
          from: 'answers',
          localField: 'answer_id',
          foreignField: '_id',
          as: 'answer'
        }
      },
      { $unwind: '$answer' },
  
      // Join with Questions
      {
        $lookup: {
          from: 'questions',
          localField: 'answer.question_id',
          foreignField: '_id',
          as: 'question'
        }
      },
      { $unwind: '$question' },
  
      // Sort reviews chronologically
      { $sort: { created_at: 1 } },
  
      // Capture previous review for fastest review calc
      {
        $setWindowFields: {
          partitionBy: '$reviewer_id',
          sortBy: { created_at: 1 },
          output: { prevCreatedAt: { $shift: { output: '$created_at', by: -1 } } }
        }
      },
  
      // Helper fields
      {
        $addFields: {
          reviewDiffSeconds: {
            $cond: [
              { $ifNull: ['$prevCreatedAt', false] },
              { $divide: [{ $subtract: ['$created_at', '$prevCreatedAt'] }, 1000] },
              null
            ]
          },
          reviewDurationMinutes: {
            $divide: [{ $subtract: ['$created_at', '$answer.created_at'] }, 1000 * 60]
          },
          reviewHour: { $hour: '$created_at' },
          reviewDate: { $dateToString: { format: "%Y-%m-%d", date: '$created_at' } }
        }
      },
  
      // Group reviewer stats
      {
        $group: {
          _id: '$reviewer_id',
          totalAssigned: { $sum: 1 },
          approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          revisedCount: { $sum: { $cond: [{ $eq: ['$status', 'revised'] }, 1, 0] } },
          rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          latestApproved: { $max: { $cond: [{ $eq: ['$status', 'approved'] }, '$created_at', null] } },
          latestRevised: { $max: { $cond: [{ $eq: ['$status', 'revised'] }, '$created_at', null] } },
          reviewDates: { $addToSet: '$reviewDate' },
          peakHours: { $push: '$reviewHour' },
          fastestReviewSeconds: { $min: '$reviewDiffSeconds' },
          totalReviewMinutes: { $sum: '$reviewDurationMinutes' },
          reviews: {
            $push: {
              status: '$status',
              createdAt: '$created_at',
              questionId: '$question._id',
              questionText: '$question.original_query_text',
              answerId: '$answer._id'
            }
          }
        }
      },
  
      // Compute latest approved and revised
      {
        $addFields: {
          latestApprovedQuestion: {
            $first: {
              $filter: {
                input: '$reviews',
                as: 'r',
                cond: { $eq: ['$$r.createdAt', '$latestApproved'] }
              }
            }
          },
          latestRevisedQuestion: {
            $first: {
              $filter: {
                input: '$reviews',
                as: 'r',
                cond: { $eq: ['$$r.createdAt', '$latestRevised'] }
              }
            }
          }
        }
      },
  
      // Derived metrics
      {
        $addFields: {
          approvalRate: {
            $round: [
              {
                $cond: [
                  { $eq: ['$totalAssigned', 0] },
                  0,
                  { $multiply: [{ $divide: ['$approvedCount', '$totalAssigned'] }, 100] }
                ]
              },
              2
            ]
          },
          activeDays: { $size: '$reviewDates' },
          QperDay: {
            $round: [
              {
                $cond: [
                  { $eq: [{ $size: '$reviewDates' }, 0] },
                  0,
                  { $divide: ['$totalAssigned', { $size: '$reviewDates' }] }
                ]
              },
              2
            ]
          },
          fastestReviewMinutes: { $round: [{ $divide: ['$fastestReviewSeconds', 60] }, 2] },
          averageReviewHours: {
            $round: [
              {
                $cond: [
                  { $eq: ['$totalAssigned', 0] },
                  0,
                  { $divide: ['$totalReviewMinutes', { $multiply: [60, '$totalAssigned'] }] }
                ]
              },
              2
            ]
          },
          peakReviewHour: {
            $let: {
              vars: { hoursArray: '$peakHours' },
              in: {
                $arrayElemAt: [
                  {
                    $map: {
                      input: {
                        $slice: [
                          {
                            $sortArray: {
                              input: {
                                $map: {
                                  input: { $setUnion: ['$$hoursArray', []] },
                                  as: 'h',
                                  in: {
                                    hour: '$$h',
                                    count: {
                                      $size: {
                                        $filter: {
                                          input: '$peakHours',
                                          as: 'r',
                                          cond: { $eq: ['$$r', '$$h'] }
                                        }
                                      }
                                    }
                                  }
                                }
                              },
                              sortBy: { count: -1 }
                            }
                          },
                          1
                        ]
                      },
                      as: 'item',
                      in: '$$item.hour'
                    }
                  },
                  0
                ]
              }
            }
          }
        }
      },
  
      // Ranking info + include penality field
      {
        $lookup: {
          from: 'users',
          let: { reviewerId: '$_id' },
          pipeline: [
            { $sort: { incentive_points: -1 } },
            { $setWindowFields: { sortBy: { incentive_points: -1 }, output: { rank: { $rank: {} } } } },
            { $match: { $expr: { $eq: ['$_id', '$$reviewerId'] } } },
            { $lookup: { from: 'users', pipeline: [{ $count: 'totalUsers' }], as: 'userCount' } },
            { $unwind: { path: '$userCount', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                rank: 1,
                incentive_points: 1,
                penality: 1, // ✅ include penality field
                totalUsers: '$userCount.totalUsers'
              }
            }
          ],
          as: 'rankInfo'
        }
      },
      { $unwind: { path: '$rankInfo', preserveNullAndEmptyArrays: true } },
  
      // Add milestone + ranking percentage
      {
        $addFields: {
          milestoneTarget: 200,
          milestoneProgress: {
            $round: [
              {
                $cond: [
                  { $eq: ['$totalAssigned', 0] },
                  0,
                  { $multiply: [{ $divide: ['$totalAssigned', 200] }, 100] }
                ]
              },
              2
            ]
          },
          rankingPercentage: {
            $round: [
              {
                $cond: [
                  {
                    $and: [
                      { $gt: ['$rankInfo.totalUsers', 0] },
                      { $ifNull: ['$rankInfo.rank', false] }
                    ]
                  },
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $add: [{ $subtract: ['$rankInfo.totalUsers', '$rankInfo.rank'] }, 1] },
                          '$rankInfo.totalUsers'
                        ]
                      },
                      100
                    ]
                  },
                  0
                ]
              },
              2
            ]
          }
        }
      },
  
      // Final projection
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
          peakReviewHour: 1,
          fastestReviewMinutes: 1,
          averageReviewHours: 1,
          milestoneTarget: 1,
          milestoneProgress: 1,
          currentRank: '$rankInfo.rank',
          totalUsers: '$rankInfo.totalUsers',
          incentivePoints: { $round: ['$rankInfo.incentive_points', 2] },
          penality: '$rankInfo.penality', // ✅ added to final output
          rankingPercentage: 1,
          latestApprovedQuestion: 1,
          latestRevisedQuestion: 1
        }
      }
    ]);
  
    if (reviewerStats.length > 0) {
      const stats = reviewerStats[0];
      stats.rankMessage = stats.currentRank && stats.totalUsers
        ? `#${stats.currentRank} out of ${stats.totalUsers} users`
        : null;
      return stats;
    }
  
    return null;
  }
  
  
 
}