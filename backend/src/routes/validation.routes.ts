import { Router } from 'express';
import { validateAnswer, getValidationHistory } from '../controllers/validation.controller';

const router = Router();

router.post('/', validateAnswer);
router.get('/:answer_id', getValidationHistory);

export default router;