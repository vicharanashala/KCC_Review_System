import Question from '../models/question.model';
import answerModel from '../models/answer.model';
import { IQuestion } from '../interfaces/question.interface';
import { QuestionStatus } from '../interfaces/enums';
import { HydratedDocument } from 'mongoose';
import LlmQuestionModel, { ILLMQuestion } from '../models/LlmQuestion.model';
export type QuestionDocument = HydratedDocument<IQuestion>
export default class QuestionRepository {
  async create(questionData: Partial<IQuestion>): Promise<IQuestion> {
    const existingQuestion = await Question.findOne({
      original_query_text: { $regex: new RegExp(`^${questionData.original_query_text}$`, 'i') },
    });
  
    if (existingQuestion) {
     
      throw new Error('Question with this original_query_text already exists');
      
    }
  
    try {
      return await Question.create(questionData);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Question with this original_query_text already exists');
      }
      throw error;
    }
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
          // reviewed_by_Moderators:[]
          }
        },
        {
          new: true,          // ✅ return the *updated* document
          runValidators: true // ✅ enforce schema validation
        }
      ).lean(); // optional for plain JS object
  
      if (!updatedQuestion) {
      //  console.warn(`⚠️ No question found with ID ${question_id}`);
        return null;
      }
  
     // console.log("✅ Question updated:", updatedQuestion.question_id);
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
    return result._id
  }

  async getAllLLMQuestions(){
    return await LlmQuestionModel.find()
  }
  
  async getLLMQuestionsBYUserId(userId:string){
    const questions = await LlmQuestionModel.find({assigned_moderator:userId,isDone:false })
    return questions
  }
  
  async markLLmAsRead(id:string){
    const result = await LlmQuestionModel.findByIdAndUpdate(id,{isDone:true})
    return result?._id
  }

  async findByrelatedQuestionId(questionId: string): Promise<any[]> {
    const question = await Question.findOne({ question_id: questionId }, { _id: 1, question_id: 1 });
  
    if (!question) {
      throw new Error("Question not found");
    }
  
    const result = await answerModel.aggregate([
      // 1️⃣ Match answers for this question
      { $match: { question_id: question._id } },
  
      // 2️⃣ Lookup peer validations (related_answer_id OR question_id string)
      {
        $lookup: {
          from: "peervalidations",
          let: { answerId: "$answer_id", },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ["$related_answer_id", "$$answerId"] },
                        
                      ]
                    },
                   
                  ]
                }
              }
            },
            {
              $project: {
                _id: 1,
                peer_validation_id: 1,
                reviewer_id: 1,
                status: 1,
                comments: 1,
                question_id: 1,
                related_answer_id: 1,
                created_at: 1,
                __v: 1
              }
            }
          ],
          as: "peer_validations"
        }
      },
  
      // 2.1️⃣ Lookup the "answer_created" peer_validation specifically
      {
        $lookup: {
          from: "peervalidations",
          let: { questionStringId: question.question_id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$question_id", "$$questionStringId"] },
                    { $eq: ["$status", "answer_created"] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "reviewer_id",
                foreignField: "_id",
                as: "reviewer"
              }
            },
            {
              $addFields: {
                reviewer_name: { $arrayElemAt: ["$reviewer.name", 0] },
                reviewer_email: { $arrayElemAt: ["$reviewer.email", 0] }
              }
            },
            { $project: { reviewer: 0 } }
          ],
          as: "answer_created_peer_validation"
        }
      },
  
      // 2.2️⃣ Merge the "answer_created" record into peer_validations
      {
        $addFields: {
          peer_validations: {
            $cond: {
              if: { $eq: ["$version", 1] },
              then: { $concatArrays: ["$answer_created_peer_validation", "$peer_validations"] },
              else: "$peer_validations"
            }
          }
        }
      },
  
      // 3️⃣ Lookup users for peer validations
      {
        $lookup: {
          from: "users",
          localField: "peer_validations.reviewer_id",
          foreignField: "_id",
          as: "reviewers"
        }
      },
  
      // 4️⃣ Lookup validations
      {
        $lookup: {
          from: "validations",
          localField: "answer_id",
          foreignField: "related_answer_id",
          as: "validations"
        }
      },
  
      // 5️⃣ Lookup users for validations (moderators)
      {
        $lookup: {
          from: "users",
          localField: "validations.moderator_id",
          foreignField: "_id",
          as: "moderators"
        }
      },
  
      // 6️⃣ Map peer validations with reviewer_name
      {
        $addFields: {
          peer_validations: {
            $map: {
              input: "$peer_validations",
              as: "pv",
              in: {
                _id: "$$pv._id",
                peer_validation_id: "$$pv.peer_validation_id",
                status: "$$pv.status",
                comments: "$$pv.comments",
                question_id: "$$pv.question_id",
                related_answer_id: "$$pv.related_answer_id",
                created_at: "$$pv.created_at",
                __v: "$$pv.__v",
                reviewer_name: {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: "$reviewers",
                            as: "r",
                            cond: { $eq: ["$$r._id", "$$pv.reviewer_id"] }
                          }
                        },
                        as: "matched",
                        in: "$$matched.name"
                      }
                    },
                    0
                  ]
                },
                reviewer_email: {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: "$reviewers",
                            as: "r",
                            cond: { $eq: ["$$r._id", "$$pv.reviewer_id"] }
                          }
                        },
                        as: "matched",
                        in: "$$matched.email"
                      }
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      },
  
      // 7️⃣ Map validations with moderator_name and moderator_email
      {
        $addFields: {
          validations: {
            $map: {
              input: "$validations",
              as: "v",
              in: {
                _id: "$$v._id",
                status: "$$v.validation_status",
                comments: "$$v.comments",
                created_at: "$$v.created_at",
                reviewer_name: {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: "$moderators",
                            as: "m",
                            cond: { $eq: ["$$m._id", "$$v.moderator_id"] }
                          }
                        },
                        as: "matched",
                        in: "$$matched.name"
                      }
                    },
                    0
                  ]
                },
                reviewer_email: {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: {
                          $filter: {
                            input: "$moderators",
                            as: "m",
                            cond: { $eq: ["$$m._id", "$$v.moderator_id"] }
                          }
                        },
                        as: "matched",
                        in: "$$matched.email"
                      }
                    },
                    0
                  ]
                }
              }
            }
          }
        }
      },
  
      // 8️⃣ Merge validations into peer_validations timeline
      {
        $addFields: {
          peer_validations: { $concatArrays: ["$peer_validations", "$validations"] }
        }
      },
  
      // 9️⃣ Sort peer_validations by created_at ascending
      {
        $addFields: {
          peer_validations: {
            $sortArray: { input: "$peer_validations", sortBy: { created_at: 1 } }
          }
        }
      },
  
      // 🔟 Final projection
      {
        $project: {
          _id: 0,
          answer_id: 1,
          version: 1,
          answer_text: 1,
          peer_validations: 1
        }
      },
  
      // 11️⃣ Sort answers by version ascending
      { $sort: { version: 1 } }
    ]);
  
    return result;
  }
  
  
  
}