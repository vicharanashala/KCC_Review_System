import ValidationRepository from '../repositories/validation.repository';
import AnswerRepository from '../repositories/answer.repository';
import NotificationRepository from '../repositories/notification.repository';
import WorkflowService from './workFlow.service';
import { ValidationCreateDto } from '../interfaces/dto';
import logger from '../utils/logger.utils';
import { v4 as uuidv4 } from 'uuid';
import UserRepository from '../repositories/user.repository';
import { UserRole } from '../interfaces/enums';
import { Types } from 'mongoose';
import GoldenFAQService from './goldenFAQ.service';

const validationRepo = new ValidationRepository();
const answerRepo = new AnswerRepository();
const userRepo = new UserRepository()
const goldenFAQService = new GoldenFAQService()
const notificationRepo=new NotificationRepository()
export default class ValidationService {
  async create(validationData: ValidationCreateDto, currentUserId: string): Promise<any> {
    const currentUser = await userRepo.findById(currentUserId)
    if(!currentUser){
      throw new Error('User not found');
    }
    if (currentUser.role !== UserRole.MODERATOR) throw new Error('Only Moderators can validate answers');

    const answer = await answerRepo.findByAnswerId(validationData.answer_id);
    if (!answer) throw new Error('Answer not found');

   /* const existing = await validationRepo.findByAnswerAndModerator(answer._id.toString(), currentUserId);
    if (existing) throw new Error('You have already validated this answer');*/

    const sequence = await validationRepo.countByAnswerId(answer._id.toString()) + 1;
    const userObjectId = new Types.ObjectId(currentUserId)
   /* const newValidation = await validationRepo.create({
      ...validationData,
      answer_id: answer._id,
      moderator_id: userObjectId,
      validation_status: validationData.validation_status,
      comments: validationData.comments || '',
      validation_sequence: sequence,
      validation_id: `V_${uuidv4().slice(0, 8).toUpperCase()}`,
    });*/
   // console.log("the validation data coming===",validationData)
    if(validationData.validation_status && validationData.peer_validation_id)
    {
      const result=  await validationRepo.updateValidationBypeerId(validationData.peer_validation_id,validationData.validation_status)
     
      if(validationData.notification_id)
      {
        await notificationRepo.markReadAndSubmit(
          validationData.notification_id,
          validationData.userId
        );
      }

    }
    
    // setImmediate(() => WorkflowService.processValidation(newValidation.validation_id));

    if (validationData.validation_status === 'valid') {
      // NEW: Directly create Golden FAQ if valid
      try {
        logger.info(`Validation submitted: ${validationData.peer_validation_id}`);
        const result = await goldenFAQService.createGoldenFAQFromValidation(answer, currentUserId);
        // Update question status (handled in GoldenFAQService)
        // await userRepo.updateWorkload(answer.specialist_id._id.toString(), -1); 
        await userRepo.updateWorkload(currentUserId, -1); 
        logger.info(`Validation approved and Golden FAQ created: ${result.faq_id} for answer ${answer.answer_id}`);
        // await userRepo.updateWorkload(currentUserId, -1);

        return { 
          message: 'Validation approved and Golden FAQ created successfully', 
          validation_id: validationData.peer_validation_id, 
          faq_id: result.faq_id 
        };
      } catch (error: any) {
        logger.error(`Failed to create Golden FAQ after validation: ${error.message}`);
        throw new Error(`Validation approved but Golden FAQ creation failed: ${error.message}`);
      }
    } else {
      // Existing: Handle invalid (revision needed)
      if(validationData.peer_validation_id)
      {
        const validation_id=validationData.peer_validation_id
        const validation_comments=validationData.comments
        setImmediate(() => WorkflowService.processValidation(validation_id,validation_comments));
      }
      
      logger.info(`Validation rejected: ${validationData.peer_validation_id}, sent for revision`);
      // await userRepo.updateWorkload(currentUserId, -1);
      // await userRepo.updateWorkload(answer.specialist_id._id.toString(), -1);
      await userRepo.updateWorkload(currentUserId, -1);
      return { message: 'Validation rejected, revision needed', validation_id: validationData.peer_validation_id };
    }

  }

  async getHistoryByAnswerId(answerId: string): Promise<any[]> {
    return validationRepo.findByAnswerId(answerId);
  }
}