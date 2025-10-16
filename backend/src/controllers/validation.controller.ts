import { Request, Response } from 'express';
import ValidationService from '../services/validation.service';
import { ValidationCreateDto } from '../interfaces/dto';
import Joi from 'joi';
import logger from '../utils/logger.utils';
import { authenticateToken, AuthRequest, restrictTo } from '../middleware/auth.middleware';
import { UserRole } from '../interfaces/enums';

const validationService = new ValidationService();

const createSchema = Joi.object({
  answer_id: Joi.string().required(),
  validation_status: Joi.string().valid('valid', 'invalid').required(),
  comments: Joi.string().optional(),
  peer_validation_id:Joi.string().optional(),
  notification_id:Joi.string().optional(),
  userId:Joi.string().optional(),
});

export const validateAnswer = [
  authenticateToken,
  restrictTo(UserRole.MODERATOR),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = createSchema.validate(req.body);
      if (error) {
        res.status(400).json({ detail: error.details[0]!.message });
        return;
      }
      const validationData: ValidationCreateDto = req.body;
      const currentUser = (req as any).user;
      const result = await validationService.create(validationData, currentUser);
      res.json(result);
    } catch (error: any) {
      logger.error(error);
      if (error.message.includes('403')) {
        res.status(403).json({ detail: error.message });
      } else if (error.message.includes('400')) {
        res.status(400).json({ detail: error.message });
      } else {
        res.status(404).json({ detail: error.message });
      }
    }
  },
];

export const getValidationHistory = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { answer_id } = req.params;
      const history = await validationService.getHistoryByAnswerId(answer_id as string);
      res.json({ validation_history: history });
    } catch (error: any) {
      logger.error(error);
      res.status(404).json({ detail: error.message });
    }
  },
];
