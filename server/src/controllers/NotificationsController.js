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
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM notifications WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    return res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notification.' });
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
      [String(id).slice(0, 50), String(title).slice(0, 150), String(message).slice(0, 1000), orderId ? String(orderId).slice(0, 50) : null]
    );
    return res.status(201).json({ success: true, message: 'Notification created successfully.' });
  } catch (error) {
    console.error('createNotification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create notification.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  createNotification
};
