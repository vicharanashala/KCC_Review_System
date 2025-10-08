import { Router } from 'express';
import { getStats, getMyTasks ,getUserPerformance,updateUserState} from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', getStats);
router.get('/getUserPerformance',getUserPerformance)
router.get('/my-tasks', getMyTasks);
router.put('/users/:user_id/update-state', updateUserState);


export default router;