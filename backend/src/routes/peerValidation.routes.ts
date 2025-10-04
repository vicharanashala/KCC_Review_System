import { Router } from 'express';
import { peerValidate, getPeerValidationHistory } from '../controllers/peerValidationController';

const router = Router();

router.post('/', peerValidate);
router.get('/:answer_id', getPeerValidationHistory);

export default router;