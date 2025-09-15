import Validation from '../models/validation.model';
import { IValidation } from '../interfaces/validation.interface';

export default class ValidationRepository {
  async create(validationData: Partial<IValidation>): Promise<IValidation> {
    return Validation.create(validationData);
  }

  async findByValidationId(validationId: string): Promise<IValidation | null> {
    return Validation.findOne({ validation_id: validationId }).populate('answer moderator');
  }

  async findByAnswerId(answerId: string): Promise<IValidation[]> {
    return Validation.find({ answer_id: answerId }).populate('answer moderator');
  }

  async countByAnswerId(answerId: string): Promise<number> {
    return Validation.countDocuments({ answer_id: answerId });
  }

  async findByAnswerAndModerator(answerId: string, moderatorId: string): Promise<IValidation | null> {
    return Validation.findOne({ answer_id: answerId, moderator_id: moderatorId }).populate('answer moderator');
  }
}