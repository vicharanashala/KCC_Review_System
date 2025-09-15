import Validation from '../models/validation.model';
import { IValidation } from '../interfaces/validation.interface';
import answerModel from '../models/answer.model';

export default class ValidationRepository {
  async create(validationData: Partial<IValidation>): Promise<IValidation> {
    return Validation.create(validationData);
  }

  async findByValidationId(validationId: string): Promise<IValidation | null> {
    return Validation.findOne({ validation_id: validationId }).populate('answer moderator');
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
      .populate('answer moderator')
      .sort({ created_at: -1 });
  }

  async countByAnswerId(answerId: string): Promise<number> {
    return Validation.countDocuments({ answer_id: answerId });
  }

  async findByAnswerAndModerator(answerId: string, moderatorId: string): Promise<IValidation | null> {
    return Validation.findOne({ answer_id: answerId, moderator_id: moderatorId }).populate('answer moderator');
  }
}