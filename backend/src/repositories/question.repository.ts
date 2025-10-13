import Question from '../models/question.model';
import { IQuestion } from '../interfaces/question.interface';
import { QuestionStatus } from '../interfaces/enums';
import { HydratedDocument } from 'mongoose';
import LlmQuestionModel, { ILLMQuestion } from '../models/LlmQuestion.model';
export type QuestionDocument = HydratedDocument<IQuestion>
export default class QuestionRepository {
  async create(questionData: Partial<IQuestion>): Promise<IQuestion> {
    return Question.create(questionData);
  }

  async createMany(questionDatas: Partial<IQuestion>[]): Promise<QuestionDocument[]> {
  return Question.insertMany(questionDatas as IQuestion[])
}

  async findByQuestionId(questionId: string): Promise<IQuestion | null> {
    return Question.findOne({ question_id: questionId });
  }
  async findByQuestionObjectId(Id:any): Promise<IQuestion | null> {
    return Question.findOne({ _id: Id});
  }

  async findById(id: string): Promise<IQuestion | null> {
    return Question.findById(id);
  }

  async findByCreatedAt(startDate: Date): Promise<IQuestion[]> {
    return Question.find({ created_at: { $gte: startDate } }).populate('assigned_specialist_id');
  }

  async findByCreatedAtAndStatus(startDate: Date, status: QuestionStatus): Promise<IQuestion[]> {
    return Question.find({ created_at: { $gte: startDate }, status }).populate('assigned_specialist_id');
  }

  async findPending(): Promise<number> {
    return Question.countDocuments({ status: QuestionStatus.PENDING_ASSIGNMENT });
  }

  async findInReview(): Promise<number> {
    return Question.countDocuments({
      status: {
        $in: [
          QuestionStatus.ASSIGNED_TO_SPECIALIST,
          QuestionStatus.PENDING_PEER_REVIEW,
          QuestionStatus.PENDING_MODERATION,
          QuestionStatus.NEEDS_REVISION,
          QuestionStatus.READY_FOR_GOLDEN_FAQ,
        ],
      },
    });
  }
 

  
 async  findAndUpdateQuestion(
    question_id: string,
    questionData: any,
    status: QuestionStatus
  ) {
    try {
      const updatedQuestion = await Question.findOneAndUpdate(
        { question_id }, // ✅ make sure this matches your schema field name
        {
          $set: {
            ...questionData,
            status, // ensure status is stored as the enum value
            updated_at: new Date(),
            reviewed_by_Moderators:[]
          }
        },
        {
          new: true,          // ✅ return the *updated* document
          runValidators: true // ✅ enforce schema validation
        }
      ).lean(); // optional for plain JS object
  
      if (!updatedQuestion) {
        console.warn(`⚠️ No question found with ID ${question_id}`);
        return null;
      }
  
      console.log("✅ Question updated:", updatedQuestion.question_id);
      return updatedQuestion;
    } catch (err) {
      console.error("❌ Error updating question:", err);
      throw err;
    }
  }
  


  async findAssignedToUser(userId: string, statuses: QuestionStatus[]): Promise<IQuestion[]> {
    return Question.find({ assigned_specialist_id: userId, status: { $in: statuses } });
  }
  

  async updateStatus(questionId: string, status: QuestionStatus, updates: any): Promise<IQuestion | null> {
    return Question.findOneAndUpdate(
      { question_id: questionId },
      { ...updates, status, updated_at: new Date() },
      { new: true }
    );
  }
  async findAll(
    skip: number = 0,
    limit: number = 100,
    questionsSearch?: string,
    search?: string
  ): Promise<{ data: any[]; total: number }> {
    const userMatch: any = {};
    const orConditions: any[] = [];
    //if (role && role !== "all") userMatch.role = role;
    if (questionsSearch) {
      orConditions.push({ original_query_text: { $regex: questionsSearch, $options: "i" } });
    }
  
    if (search) {
      orConditions.push(
        { "user.name": { $regex: search, $options: "i" } },
        { "user.email": { $regex: search, $options: "i" } }
      );
    }
  
    // $match stage
    const matchStage: any = {};
    if (orConditions.length > 0) {
      matchStage.$or = orConditions;
    }
    const pipeline: any[] = [
      {
        $addFields: {
          userObjectId: {
            $cond: [
              { $eq: [{ $type: "$user_id" }, "objectId"] },
              "$user_id",
              {
                $cond: [
                  { $eq: [{ $type: "$user_id" }, "array"] },
                  {
                    $let: {
                      vars: { firstElem: { $arrayElemAt: ["$user_id", 0] } },
                      in: {
                        $cond: [
                          { $eq: [{ $type: "$$firstElem" }, "string"] },
                          { $toObjectId: { $trim: { input: "$$firstElem", chars: '"' } } },
                          null
                        ]
                      }
                    }
                  },
                  {
                    $cond: [
                      { $eq: [{ $type: "$user_id" }, "string"] },
                      { $toObjectId: { $trim: { input: "$user_id", chars: '"' } } },
                      null
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      { $lookup: { from: "users", localField: "userObjectId", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $match: matchStage },
      {
        $facet: {
          data: [
            { $sort: { created_at: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                question_id: 1,
                crop: 1,
                state: 1,
                district: 1,
                query_type: 1,
                season: 1,
                status: 1,
                user_id: 1,
                original_query_text: 1,
                created_at: 1,
                "user._id": 1,
                "user.name": 1,
                "user.email": 1,
                "user.phone": 1,
                "user.role": 1
              }
            }
          ],
          totalCount: [{ $count: "count" }]
        }
      },
      { $project: { data: 1, total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] } } }
    ];
  
    const result = await Question.aggregate(pipeline);
 
    return {
      data: result[0]?.data || [],
      total: result[0]?.total || 0
    };
  }
  

  async createLLmQuestion(data:ILLMQuestion){
    const result =await LlmQuestionModel.create(data)
    console.log("result after creating from repo ",result)
    return result._id
  }
  
  
  
}