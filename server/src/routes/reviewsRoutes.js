const express = require('express');
const router = express.Router();
const { getReviews, createReview, replyReview, toggleFeatured, deleteReview } = require('../controllers/ReviewsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', getReviews);
router.post('/', authenticate, createReview);
router.patch('/:id/reply', authenticate, authorizeAdmin, replyReview);
router.patch('/:id/featured', authenticate, authorizeAdmin, toggleFeatured);
router.delete('/:id', authenticate, authorizeAdmin, deleteReview);

module.exports = router;
