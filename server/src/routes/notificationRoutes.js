const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, deleteNotification, createNotification } = require('../controllers/NotificationsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticate, authorizeAdmin, getNotifications);
router.post('/', authenticate, createNotification);
router.patch('/:id/read', authenticate, authorizeAdmin, markAsRead);
router.delete('/:id', authenticate, authorizeAdmin, deleteNotification);

module.exports = router;
