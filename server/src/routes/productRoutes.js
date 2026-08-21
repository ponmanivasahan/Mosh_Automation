const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/ProductController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const { getOffers, createOffer, updateOffer, deleteOffer } = require('../controllers/ProductOfferController');

router.get('/', getProducts);
router.post('/', authenticate, authorizeAdmin, createProduct);
router.put('/:id', authenticate, authorizeAdmin, updateProduct);
router.delete('/:id', authenticate, authorizeAdmin, deleteProduct);

// Offer Routes
router.get('/:productId/offers', getOffers);
router.post('/:productId/offers', authenticate, authorizeAdmin, createOffer);
router.put('/:productId/offers/:offerId', authenticate, authorizeAdmin, updateOffer);
router.delete('/:productId/offers/:offerId', authenticate, authorizeAdmin, deleteOffer);

module.exports = router;
