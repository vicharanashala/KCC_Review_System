import { Request, Response } from 'express';
import AnswerService from '../services/answer.service';
import { AnswerCreateDto } from '../interfaces/dto';
import Joi from 'joi';
import logger from '../utils/logger.utils';
import { authenticateToken, AuthRequest, restrictTo } from '../middleware/auth.middleware';
import { UserRole } from '../interfaces/enums';

const answerService = new AnswerService();

const createSchema = Joi.object({
  question_id: Joi.string().required(),
  answer_text: Joi.string().required(),
  userId:Joi.string().optional(),
  sources: Joi.array().items(Joi.object({ name: Joi.string().required(), link: Joi.string().required(),id:Joi.number().required(),errorsList:Joi.object().required(),_id:Joi.string().optional() })).required(),
  RejectedUser:Joi.string().optional(),
  status:Joi.string().optional()

});

export const createAnswer = [
  authenticateToken,
  restrictTo(UserRole.AGRI_SPECIALIST),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = createSchema.validate(req.body);
      if (error) {
        res.status(400).json({ detail: error.details[0]!.message });
        return;
      }
      const answerData: AnswerCreateDto = req.body;
      if(req.body.status &&req.body.status=='Rejected' )
      {
        const currentUserId = (req as any).user._id.toString();
        const result = await answerService.create(answerData, currentUserId);
        res.json(result);
      }
      else{
        const currentUserId = (req as any).user._id.toString();
      const result = await answerService.create(answerData, currentUserId);
      res.json(result);
      }
     
      
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

export const getAnswerDetails = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { answer_id } = req.params;
      const answer = await answerService.getByAnswerId(answer_id as string);
      res.json(answer);
    } catch (error: any) {
      logger.error(error);
      res.status(404).json({ detail: error.message });
    }
  },
];