const { pool } = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    const formatted = rows.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      orderId: n.order_id,
      read: Boolean(n.is_read),
      createdAt: n.created_at
    }));
    return res.json({ success: true, notifications: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.', error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.', error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM notifications WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete notification.', error: error.message });
  }
};

const createNotification = async (req, res) => {
  try {
    const { id, title, message, orderId } = req.body;
    if (!id || !title || !message) {
      return res.status(400).json({ success: false, message: 'Please provide required notification fields.' });
    }
    await pool.query(
      'INSERT INTO notifications (id, title, message, order_id, is_read) VALUES (?, ?, ?, ?, FALSE)',
      [id, title, message, orderId || null]
    );
    return res.status(201).json({ success: true, message: 'Notification created successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create notification.', error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  createNotification
};
