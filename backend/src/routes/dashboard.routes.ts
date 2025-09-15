import { Router } from 'express';
import { getStats, getMyTasks } from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', getStats);
router.get('/my-tasks', getMyTasks);

export default router;