
import { Response, NextFunction } from 'express';
import QuestionService from '../services/question.service';
import { QuestionCreateDto } from '../interfaces/dto';
import Joi from 'joi';
import logger from '../utils/logger.utils';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import multer from 'multer'
import csv from 'csv-parser'
import { Readable } from 'stream';
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
  user_id:Joi.string().optional(),
  
});

// Define Middleware type for consistency
type Middleware = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> | void;
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === 'text/csv') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only .csv files are allowed'));
//     }
//   },
// }).single('csvFile');

export const submitQuestion: Middleware[] = [
  // (req: AuthRequest, res: Response, next: NextFunction) => {
  //   upload(req, res, (err) => {
  //     if (err instanceof multer.MulterError) {
  //       return res.status(400).json({ detail: 'File upload error' });
  //     } else if (err) {
  //       return res.status(400).json({ detail: err.message });
  //     }
  //     next();
  //   });
  // },
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {

    try {
      if (req.file) {
        // NEW: Batch mode - Process CSV for multiple questions
        const results: any[] = [];
        // FIXED: Create a Readable stream from buffer (Buffer doesn't have .pipe), then pipe to csvParser()
        const readable = Readable.from(req.file.buffer);
        const stream = readable
          .pipe(csv()) // FIXED: Use csvParser() instead of csv()
          .on('data', (data) => results.push(data))
          .on('end', async () => {
            if (results.length === 0) {
              return res.status(400).json({ detail: 'No valid questions in CSV' });
            }

            // NEW: Define column mapping (handle specific 'QUESTION (by AT)' and others case-insensitively)
            const columnMap: { [key: string]: string } = {
              'question (by at)': 'original_query_text',
              'crop': 'crop',
              'state': 'state',
              'district': 'district',
              'block_name': 'block_name',
              'query_type': 'query_type',
              'season': 'season',
              'sector': 'sector',
              'refined_query_text': 'refined_query_text',
              'latitude': 'latitude',
              'longitude': 'longitude',
              'priority': 'priority',
              // Add more if needed, based on IQuestion
            };

            // NEW: Allowed fields to prevent injecting unwanted data
            const allowedFields = Object.values(columnMap);

            const questionDatas: QuestionCreateDto[] = [];
            const skippedRows: number[] = [];

            results.forEach((row, index) => {
              const questionData: Partial<QuestionCreateDto> = {};

              // Map and normalize keys
              for (let key in row) {
                const normalizedKey = key.toLowerCase().trim();
                const mappedKey = columnMap[normalizedKey] || normalizedKey;
                if (allowedFields.includes(mappedKey)) {
                  questionData[mappedKey as keyof QuestionCreateDto] = row[key].trim();
                }
              }

              // Required check: Must have original_query_text
              if (!questionData.original_query_text) {
                skippedRows.push(index + 1); // 1-indexed row
                logger.warn(`Skipping row ${index + 1}: Missing QUESTION (by AT)`);
                return;
              }

              questionDatas.push(questionData as QuestionCreateDto);
            });

            if (questionDatas.length === 0) {
              return res.status(400).json({ detail: 'No valid questions in CSV after processing' });
            }

            const questions = await questionService.createMany(questionDatas);
            res.status(201).json(questions);

            if (skippedRows.length > 0) {
              logger.info(`Skipped rows: ${skippedRows.join(', ')}`);
              // Optionally add to response: { questions, skipped: skippedRows }
            }
          })
          .on('error', (err) => {
            logger.error('CSV parsing error:', err);
            res.status(400).json({ detail: 'Invalid CSV format' });
          });

        // NEW: If body has original_query_text with file, log warning (ignore body for batch)
        if (req.body.original_query_text) {
          logger.warn('Ignoring original_query_text from body in CSV batch mode');
        }
      } else {
      //  console.log("the questionCreated===",req.body)
        // Existing: Single question mode
        const { error } = createSchema.validate(req.body);
        if (error) {
          const errorMessage = error.details && error.details.length > 0 ? error.details[0]!.message : 'Invalid request body';
          res.status(400).json({ detail: errorMessage });
          return;
        }
        const questionData: QuestionCreateDto = req.body;
       const question = await questionService.create(questionData);
        res.status(201).json(question);
      }

      // const { error } = createSchema.validate(req.body);
      // if (error) {
      //   const errorMessage = error.details && error.details.length > 0 ? error.details[0]!.message : 'Invalid request body';
      //   res.status(400).json({ detail: errorMessage });
      //   return;
      // }
      // const questionData: QuestionCreateDto = req.body;
      // const question = await questionService.create(questionData);
      // res.status(201).json(question);
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