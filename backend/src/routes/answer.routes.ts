import { Router } from 'express';
import { createAnswer, getAnswerDetails } from '../controllers/answer.controller';

const router = Router();

router.post('/', createAnswer);
router.get('/:answer_id', getAnswerDetails);

export default router;