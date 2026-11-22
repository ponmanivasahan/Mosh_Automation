const { pool } = require('../config/db');

const getOffers = async (req, res) => {
  try {
    const { productId } = req.params;
    const [rows] = await pool.query('SELECT * FROM product_offers WHERE product_id = ? ORDER BY created_at DESC', [productId]);
    return res.json({ success: true, offers: rows });
  } catch (error) {
    console.error('getOffers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve offers.' });
  }
};

const createOffer = async (req, res) => {
  try {
    const { productId } = req.params;
    const { title, description, offer_type, offer_value, valid_until, show_offer } = req.body;

    if (!title || !offer_type) {
      return res.status(400).json({ success: false, message: 'Title and Offer Type are required.' });
    }

    const value = offer_value || 0;
    const isShow = show_offer !== undefined ? Boolean(show_offer) : true;
    const validUntil = valid_until || null;

    const [result] = await pool.query(
      'INSERT INTO product_offers (product_id, title, description, offer_type, offer_value, valid_until, show_offer) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [productId, title.slice(0, 150), (description || '').slice(0, 1000), offer_type.slice(0, 50), value, validUntil, isShow]
    );

    const [rows] = await pool.query('SELECT * FROM product_offers WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Offer created successfully.',
      offer: rows[0]
    });
  } catch (error) {
    console.error('createOffer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create offer.' });
  }
};

const updateOffer = async (req, res) => {
  try {
    const { productId, offerId } = req.params;
    const { title, description, offer_type, offer_value, valid_until, show_offer } = req.body;

    if (!title || !offer_type) {
      return res.status(400).json({ success: false, message: 'Title and Offer Type are required.' });
    }

    const value = offer_value || 0;
    const isShow = show_offer !== undefined ? Boolean(show_offer) : true;
    const validUntil = valid_until || null;

    const [existing] = await pool.query('SELECT id FROM product_offers WHERE id = ? AND product_id = ?', [offerId, productId]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'No offer was found to update.' });
    }

    await pool.query(
      'UPDATE product_offers SET title = ?, description = ?, offer_type = ?, offer_value = ?, valid_until = ?, show_offer = ? WHERE id = ? AND product_id = ?',
      [title.slice(0, 150), (description || '').slice(0, 1000), offer_type.slice(0, 50), value, validUntil, isShow, offerId, productId]
    );

    const [rows] = await pool.query('SELECT * FROM product_offers WHERE id = ?', [offerId]);

    return res.json({ success: true, message: 'Offer updated successfully.', offer: rows[0] });
  } catch (error) {
    console.error('updateOffer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update offer.' });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const { productId, offerId } = req.params;
    const [result] = await pool.query('DELETE FROM product_offers WHERE id = ? AND product_id = ?', [offerId, productId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }
    return res.json({ success: true, message: 'Offer deleted successfully.' });
  } catch (error) {
    console.error('deleteOffer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete offer.' });
  }
};

module.exports = {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer
};
