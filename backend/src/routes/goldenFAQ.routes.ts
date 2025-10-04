import { Router } from 'express';
import { createGoldenFAQ, getGoldenFAQs } from '../controllers/goldenFAQ.controller';

const router = Router();

router.post('/', createGoldenFAQ);
router.get('/', getGoldenFAQs);

export default router;