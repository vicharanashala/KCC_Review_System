import { Request, Response } from 'express';
import GoldenFAQService from '../services/goldenFAQ.service';
import { GoldenFAQCreateDto } from '../interfaces/dto';
import Joi from 'joi';
import logger from '../utils/logger.utils';
import { authenticateToken, AuthRequest, restrictTo } from '../middleware/auth.middleware';
import { UserRole } from '../interfaces/enums';

const goldenFAQService = new GoldenFAQService();

const createSchema = Joi.object({
  question_id: Joi.string().required(),
  final_answer_text: Joi.string().required(),
  category: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

export const createGoldenFAQ = [
  authenticateToken,
  restrictTo(UserRole.AGRI_SPECIALIST),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = createSchema.validate(req.body);
      if (error) {
        res.status(400).json({ detail: error.details[0]!.message });
        return;
      }
      const goldenFAQData: GoldenFAQCreateDto = req.body;
      const currentUser = (req as any).user;
      const result = await goldenFAQService.create(goldenFAQData, currentUser);
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

export const getGoldenFAQs = [
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { skip = 0, limit = 50, search, category, crop } = req.query;
      const goldenFaqs = await goldenFAQService.getAll(
        parseInt(skip as string),
        parseInt(limit as string),
        search as string,
        category as string,
        crop as string
      );
      res.json({ golden_faqs: goldenFaqs });
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
];