import { Request, Response, NextFunction } from "express";
import AdminService from "../services/admin.service";
import Joi from "joi";
import logger from "../utils/logger.utils";
import { authenticateToken, restrictTo } from "../middleware/auth.middleware";
import { UserRole } from "../interfaces/enums";
import { AuthRequest } from "../middleware/auth.middleware";

const adminService = new AdminService();

const usersSchema = Joi.object({
  skip: Joi.number().integer().default(0).optional(),
  limit: Joi.number().integer().default(100).optional(),
  search: Joi.string().allow("").optional(),
  questionsSearch: Joi.string().allow("").optional(),
  role: Joi.string()
    .valid("agri_specialist", "moderator", "admin", "all")
    .optional(),
    specializationField:Joi.string().optional()
});

const statusSchema = Joi.object({
  is_active: Joi.boolean().required(),
  is_available: Joi.boolean().optional(),
});

const performanceSchema = Joi.object({
  days: Joi.number().integer().default(30).optional(),
});

// Define a type for the middleware array
type Middleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export const getAllUsers: Middleware[] = [
  authenticateToken,
  restrictTo(UserRole.ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = usersSchema.validate(req.query);
      if (error) {
        // Safely handle error.details
        const errorMessage =
          error.details && error.details.length > 0
            ? error.details[0]!.message
            : "Invalid request parameters";
        res.status(400).json({ detail: errorMessage });
        return;
      }
      const { skip = 0, limit = 100, role, search = "" } = req.query;
      const result = await adminService.getAllUsers(
        parseInt(skip as string),
        parseInt(limit as string),
        search as string,
        role as any
      );
      res.json(result);
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
];

export const updateUserStatus: Middleware[] = [
  authenticateToken,
  restrictTo(UserRole.ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = statusSchema.validate(req.body);
      if (error) {
        const errorMessage =
          error.details && error.details.length > 0
            ? error.details[0]!.message
            : "Invalid request body";
        res.status(400).json({ detail: errorMessage });
        return;
      }
      const { user_id } = req.params;
      const { is_active, is_available } = req.body;
      const result = await adminService.updateUserStatus(
        user_id as string,
        is_active,
        is_available
      );
      res.json(result);
    } catch (error: any) {
      logger.error(error);
      res
        .status(error.message.includes("404") ? 404 : 400)
        .json({ detail: error.message });
    }
  },
];
export const updateUserDetails: Middleware[] = [
  authenticateToken,
  restrictTo(UserRole.ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = usersSchema.validate(req.body);
      if (error) {
        const errorMessage =
          error.details && error.details.length > 0
            ? error.details[0]!.message
            : "Invalid request body";
        res.status(400).json({ detail: errorMessage });
        return;
      }
      const { user_id } = req.params;
      const { role, specializationField } = req.body;
      const result = await adminService.updateUserDetails(
        user_id as string,
        role,
        specializationField
      );
      res.json(result);
    } catch (error: any) {
      logger.error(error);
      res
        .status(error.message.includes("404") ? 404 : 400)
        .json({ detail: error.message });
    }
  },
];
export const deleteUserDetails: Middleware[] = [
  authenticateToken,
  restrictTo(UserRole.ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = usersSchema.validate(req.body);
      if (error) {
        const errorMessage =
          error.details && error.details.length > 0
            ? error.details[0]!.message
            : "Invalid request body";
        res.status(400).json({ detail: errorMessage });
        return;
      }
      const { user_id } = req.params;
   
      const result = await adminService.deleteUserDetails(
        user_id as string,
        
      );
      res.json(result);
    } catch (error: any) {
      logger.error(error);
      res
        .status(error.message.includes("404") ? 404 : 400)
        .json({ detail: error.message });
    }
  },
];

export const getWorkflowPerformance: Middleware[] = [
  authenticateToken,
  restrictTo(UserRole.ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error } = performanceSchema.validate(req.query);
      if (error) {
        const errorMessage =
          error.details && error.details.length > 0
            ? error.details[0]!.message
            : "Invalid request parameters";
        res.status(400).json({ detail: errorMessage });
        return;
      }
      const { days = 30 } = req.query;
      const performance = await adminService.getWorkflowPerformance(
        parseInt(days as string)
      );
      res.json(performance);
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
];
export const getAlQuestions : Middleware[] = [
  authenticateToken,
  restrictTo(UserRole.ADMIN),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
     
      const { error } = usersSchema.validate(req.query);
      if (error) {
        // Safely handle error.details
        const errorMessage =
          error.details && error.details.length > 0
            ? error.details[0]!.message
            : "Invalid request parameters";
        res.status(400).json({ detail: errorMessage });
        return;
      }
      const { skip = 0, limit = 100, questionsSearch="", search = "" } = req.query;
      const result = await adminService.getAllQuestions(
        parseInt(skip as string),
        parseInt(limit as string),
        search as string,
        questionsSearch as string
      );
      res.json(result);
    } catch (error: any) {
      logger.error(error);
      res.status(400).json({ detail: error.message });
    }
  },
];
