import { Request, Response } from 'express';
import AuthService from '../services/auth.services';
import { UserCreateDto, LoginDto } from '../interfaces/dto';
import Joi from 'joi';
import logger from '../utils/logger.utils';

const authService = new AuthService();

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('agri_specialist', 'moderator', 'admin').required(),
  password: Joi.string().min(6).required(),
  specialization: Joi.array().items(Joi.string()).optional(),
});

const loginSchema = Joi.object({
  username: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({ detail: error.details[0]!.message });
      return;
    }
    const userData: UserCreateDto = req.body;
    const user = await authService.register(userData);
    res.status(201).json(user);
  } catch (error: any) {
    logger.error(error);
    res.status(400).json({ detail: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ detail: error.details[0]!.message });
      return;
    }
    const loginData: LoginDto = req.body;
    const tokenData = await authService.login(loginData);
    res.json(tokenData);
  } catch (error: any) {
    res.status(401).json({ detail: error.message });
  }
};