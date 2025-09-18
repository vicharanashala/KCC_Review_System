import Answer from '../models/answer.model';
import { IAnswer } from '../interfaces/answer.interface';
import questionModel from '../models/question.model';

export default class AnswerRepository {
  async create(answerData: Partial<IAnswer>): Promise<IAnswer> {
    return Answer.create(answerData);
  }

  async findByAnswerId(answerId: string): Promise<IAnswer | null> {
  let answer = await Answer.findOne({ answer_id: answerId }).populate('question_id specialist_id');
  if(!answer){
    if(/^[0-9a-fA-F]{24}$/.test(answerId)){
      answer = await Answer.findById(answerId).populate('question_id specialist_id');
    }
  }
  return answer;
}

  async findById(id: string): Promise<IAnswer | null> {
    return Answer.findById(id).populate('question_id specialist_id');
  }


  async findCurrentByQuestionId(questionId: string): Promise<IAnswer | null> {
    let questionObjectId = questionId;

    // if not an ObjectId → assume it's a custom question_id and resolve it
    if (!/^[0-9a-fA-F]{24}$/.test(questionId)) {
      const question = await questionModel.findOne({ question_id: questionId });
      if (!question) throw new Error(`Question with id ${questionId} not found`);
      questionObjectId = question._id.toString();
    }

    return Answer.findOne({ question_id: questionObjectId, is_current: true })
      .populate('question_id specialist_id');
  }

  async markPreviousNotCurrent(questionId: string): Promise<void> {
    await Answer.updateMany({ question_id: questionId }, { is_current: false });
  }

  async findByQuestionId(questionId: string): Promise<IAnswer[]> {
    return Answer.find({ question_id: questionId }).populate('question_id specialist_id');
  }

  async countVersionsByQuestionId(questionId: string): Promise<number> {
    return Answer.countDocuments({ question_id: questionId });
  }
}