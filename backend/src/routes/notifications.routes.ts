import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notification.controller';

const router = Router();

router.get('/', getNotifications);
router.put('/:notification_id/read', markNotificationRead);

export default router;