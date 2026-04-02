import { Router } from 'express'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notificationController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

// Get notifications for user's role (custodian/admin)
router.get('/', authenticate, authorize('admin', 'custodian'), getNotifications)

// Get unread notification count
router.get('/unread/count', authenticate, authorize('admin', 'custodian'), getUnreadCount)

// Mark single notification as read
router.patch('/:id/read', authenticate, authorize('admin', 'custodian'), markAsRead)

// Mark all notifications as read
router.patch('/read-all', authenticate, authorize('admin', 'custodian'), markAllAsRead)

// Delete a notification
router.delete('/:id', authenticate, authorize('admin', 'custodian'), deleteNotification)

export default router
