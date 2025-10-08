import { Router } from 'express';
import { getAllUsers, updateUserStatus, getWorkflowPerformance, updateUserDetails,deleteUserDetails,getAlQuestions } from '../controllers/admin.controller';

const router = Router();

router.get('/users', getAllUsers);
router.put('/users/:user_id/status', updateUserStatus);
router.put('/users/:user_id', updateUserDetails);
router.get('/reports/workflow-performance', getWorkflowPerformance);
router.delete('/users/:user_id',deleteUserDetails)
router.get('/questions', getAlQuestions);

export default router;