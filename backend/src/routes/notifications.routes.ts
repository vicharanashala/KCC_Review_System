import { Router } from 'express';
import { getNotifications, markAllAsRead, markNotificationRead } from '../controllers/notification.controller';

const router = Router();

router.get('/', getNotifications);
router.put('/:notification_id/read', markNotificationRead);
router.put('/mark-all-read', markAllAsRead);
export default router;