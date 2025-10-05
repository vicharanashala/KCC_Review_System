import { Router } from 'express';
import { getStats, getMyTasks ,getUserPerformance} from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', getStats);
router.get('/getUserPerformance',getUserPerformance)
router.get('/my-tasks', getMyTasks);



export default router;