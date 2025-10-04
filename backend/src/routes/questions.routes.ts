import { Router } from 'express';
import { submitQuestion, getQuestionDetails, getMyQuestions } from '../controllers/question.controller';
import multer from 'multer';
const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are allowed'));
    }
  },
});
router.post('/',upload.single('csvFile'), submitQuestion);
router.get('/id/:question_id', getQuestionDetails);
router.get('/my-questions', getMyQuestions);

export default router;