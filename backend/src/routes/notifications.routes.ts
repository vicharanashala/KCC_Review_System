import { Router } from 'express';
import { getNotifications, markAllAsRead, markNotificationRead, saveSubscription } from '../controllers/notification.controller';

const router = Router();

router.get('/', getNotifications);
router.put('/:notification_id/read', markNotificationRead);
router.put('/mark-all-read', markAllAsRead);
router.post('/subscribe', saveSubscription);
export default router;