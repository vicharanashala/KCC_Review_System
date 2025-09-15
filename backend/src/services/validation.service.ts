import ValidationRepository from '../repositories/validation.repository';
import AnswerRepository from '../repositories/answer.repository';
import WorkflowService from './workFlow.service';
import { ValidationCreateDto } from '../interfaces/dto';
import logger from '../utils/logger.utils';
import { v4 as uuidv4 } from 'uuid';
import UserRepository from '../repositories/user.repository';
import { UserRole } from '../interfaces/enums';
import { Types } from 'mongoose';

const validationRepo = new ValidationRepository();
const answerRepo = new AnswerRepository();
const userRepo = new UserRepository()
export default class ValidationService {
  async create(validationData: ValidationCreateDto, currentUserId: string): Promise<any> {
    const currentUser = await userRepo.findById(currentUserId)
    if(!currentUser){
      throw new Error('User not found');
    }
    if (currentUser.role !== UserRole.MODERATOR) throw new Error('Only Moderators can validate answers');

    const answer = await answerRepo.findByAnswerId(validationData.answer_id);
    if (!answer) throw new Error('Answer not found');

    const existing = await validationRepo.findByAnswerAndModerator(answer._id.toString(), currentUserId);
    if (existing) throw new Error('You have already validated this answer');

    const sequence = await validationRepo.countByAnswerId(answer._id.toString()) + 1;
    const userObjectId = new Types.ObjectId(currentUserId)
    const newValidation = await validationRepo.create({
      ...validationData,
      answer_id: answer._id,
      moderator_id: userObjectId,
      validation_status: validationData.validation_status,
      comments: validationData.comments || '',
      validation_sequence: sequence,
      validation_id: `V_${uuidv4().slice(0, 8).toUpperCase()}`,
    });

    setImmediate(() => WorkflowService.processValidation(newValidation.validation_id));

    // Decrement workload
    await userRepo.updateWorkload(currentUserId, -1);

    logger.info(`Validation submitted: ${newValidation.validation_id}`);
    return { message: 'Validation submitted successfully', validation_id: newValidation.validation_id };
  }

  async getHistoryByAnswerId(answerId: string): Promise<any[]> {
    return validationRepo.findByAnswerId(answerId);
  }
}