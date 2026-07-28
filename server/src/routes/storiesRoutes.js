const express = require('express');
const router = express.Router();
const { getStories, createStory, updateStory, deleteStory } = require('../controllers/StoriesController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', getStories);
router.post('/', authenticate, authorizeAdmin, createStory);
router.put('/:id', authenticate, authorizeAdmin, updateStory);
router.delete('/:id', authenticate, authorizeAdmin, deleteStory);

module.exports = router;
