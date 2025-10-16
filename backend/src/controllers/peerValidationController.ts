import { Request, Response } from 'express';
import PeerValidationService from '../services/peerValidation.service';
import { PeerValidateCreateDto } from '../interfaces/dto';
import Joi from 'joi';
import logger from '../utils/logger.utils';
import { authenticateToken, AuthRequest, restrictTo } from '../middleware/auth.middleware';
import { UserRole } from '../interfaces/enums';

const peerValidationService = new PeerValidationService();

const createSchema = Joi.object({
  answer_id: Joi.string().required(),
  status: Joi.string().valid('approved', 'revised').required(),
  // comments: Joi.string().optional(),
  comments: Joi.string().when('status', {
    is: 'revised',
    then: Joi.string().required().messages({
      'string.empty': 'Comments are required when status is revised',
      'any.required': 'Comments are required when status is revised',
    }),
    otherwise: Joi.string().optional().allow('').default(''),
  }),
  // revised_answer_text: Joi.string().optional(),
  revised_answer_text: Joi.string().when('status', {
    is: 'revised',
    then: Joi.string().required().messages({
      'string.empty': 'Revised answer text is required when status is revised',
      'any.required': 'Revised answer text is required when status is revised',
    }),
    otherwise: Joi.string().optional().allow('').default(''),
  }),
  question_id:Joi.string().optional(),
  peer_validation_id:Joi.string().optional(),
  notification_id:Joi.string().optional(),
  userId:Joi.string().optional()
});

export const peerValidate = [
  authenticateToken,
  restrictTo(UserRole.AGRI_SPECIALIST),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = createSchema.validate(req.body);
      if (error) {
        res.status(400).json({ detail: error.details[0]!.message });
        return;
      }
      const peerData: PeerValidateCreateDto = req.body;
      const currentUser = (req as any).user;
      const result = await peerValidationService.create(peerData, currentUser);
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

export const getPeerValidationHistory = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { answer_id } = req.params;
      const history = await peerValidationService.getHistoryByAnswerId(answer_id as string);
      res.json({ peer_validation_history: history });
    } catch (error: any) {
      logger.error(error);
      res.status(404).json({ detail: error.message });
    }
  },
];
export const peerQuestionValidate = [
  authenticateToken,
  restrictTo(UserRole.MODERATOR),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = createSchema.validate(req.body);
      if (error) {
        res.status(400).json({ detail: error.details[0]!.message });
        return;
      }
      const peerData: PeerValidateCreateDto = req.body;
      const currentUser = (req as any).user;
      const result = await peerValidationService.create(peerData, currentUser);
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