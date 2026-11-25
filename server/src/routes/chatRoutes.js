const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getHistory,
  clearHistory,
  submitFeedback,
  getAdminReviewQueue,
  approveQaExample
} = require('../controllers/ChatController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.post('/', authenticate, sendMessage);
router.get('/history', authenticate, getHistory);
router.delete('/history', authenticate, clearHistory);

// Customer feedback & Admin-verified continuous improvement endpoints
router.post('/feedback', authenticate, submitFeedback);
router.get('/admin/review-queue', authenticate, authorizeAdmin, getAdminReviewQueue);
router.post('/admin/approve', authenticate, authorizeAdmin, approveQaExample);

module.exports = router;
