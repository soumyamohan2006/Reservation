import Notification from '../models/Notification.js'

// GET /api/notifications — get notifications for user's role
export const getNotifications = async (req, res) => {
  try {
    // Custodian and admin get notifications for their role
    const notifications = await Notification.find({ toRole: req.user.role })
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .limit(50)

    return res.json(notifications)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// GET /api/notifications/unread — get count of unread notifications
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      toRole: req.user.role, 
      isRead: false 
    })
    return res.json({ unreadCount: count })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// PATCH /api/notifications/:id/read — mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    ).populate('bookingId')

    if (!notification) return res.status(404).json({ message: 'Notification not found.' })

    return res.json(notification)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// PATCH /api/notifications/read-all — mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { toRole: req.user.role, isRead: false },
      { isRead: true }
    )
    return res.json({ message: 'All notifications marked as read.' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// DELETE /api/notifications/:id — delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id)
    if (!notification) return res.status(404).json({ message: 'Notification not found.' })
    return res.json({ message: 'Notification deleted.' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
