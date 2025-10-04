import { Router } from 'express';
import { getAllUsers, updateUserStatus, getWorkflowPerformance } from '../controllers/admin.controller';

const router = Router();

router.get('/users', getAllUsers);
router.put('/users/:user_id/status', updateUserStatus);
router.get('/reports/workflow-performance', getWorkflowPerformance);

export default router;