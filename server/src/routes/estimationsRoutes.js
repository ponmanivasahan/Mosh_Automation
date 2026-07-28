const express = require('express');
const router = express.Router();
const { getEstimations, createEstimation, updateEstimation, deleteEstimation } = require('../controllers/EstimationsController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.get('/', authenticate, getEstimations);
router.post('/', authenticate, createEstimation);
router.patch('/:id', authenticate, authorizeAdmin, updateEstimation);
router.delete('/:id', authenticate, authorizeAdmin, deleteEstimation);

module.exports = router;
