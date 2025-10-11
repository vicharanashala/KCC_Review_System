import { Router } from 'express';
import { peerValidate, getPeerValidationHistory ,peerQuestionValidate } from '../controllers/peerValidationController';

const router = Router();

router.post('/', peerValidate);
router.get('/:answer_id', getPeerValidationHistory);
router.post('/question-validation', peerQuestionValidate );

export default router;