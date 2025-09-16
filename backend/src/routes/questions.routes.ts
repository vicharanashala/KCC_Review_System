import { Router } from 'express';
import { submitQuestion, getQuestionDetails, getMyQuestions } from '../controllers/question.controller';

const router = Router();

router.post('/', submitQuestion);
router.get('/id/:question_id', getQuestionDetails);
router.get('/my-questions', getMyQuestions);

export default router;