
import { Response, NextFunction } from 'express';
import QuestionService from '../services/question.service';
import { QuestionCreateDto } from '../interfaces/dto';
import Joi from 'joi';
import logger from '../utils/logger.utils';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const questionService = new QuestionService();

const createSchema = Joi.object({
  crop: Joi.string().optional(),
  state: Joi.string().optional(),
  district: Joi.string().optional(),
  block_name: Joi.string().optional(),
  query_type: Joi.string().optional(),
  season: Joi.string().optional(),
  sector: Joi.string().optional(),
  original_query_text: Joi.string().required(),
  refined_query_text: Joi.string().optional(),
  latitude: Joi.string().optional(),
  longitude: Joi.string().optional(),
  priority: Joi.string().default('medium').optional(),
});

// Define Middleware type for consistency
type Middleware = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> | void;

export const submitQuestion: Middleware[] = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = createSchema.validate(req.body);
      if (error) {
        const errorMessage = error.details && error.details.length > 0 ? error.details[0]!.message : 'Invalid request body';
        res.status(400).json({ detail: errorMessage });
        return;
      }
      const questionData: QuestionCreateDto = req.body;
      const question = await questionService.create(questionData);
      res.status(201).json(question);
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
];

export const getQuestionDetails: Middleware[] = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { question_id } = req.params;
      const question = await questionService.getByQuestionId(question_id as string);
      res.json(question);
    } catch (error: any) {
      logger.error(error);
      res.status(404).json({ detail: error.message });
    }
  },
];

export const getMyQuestions: Middleware[] = [
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user._id.toString();
      const questions = await questionService.getAssignedToUser(userId);
      res.json(questions);
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
];