const express = require('express');
const router = express.Router();
const { createQuery } = require('../controllers/QueriesController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createQuery);

module.exports = router;
