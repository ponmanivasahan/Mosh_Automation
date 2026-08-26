const { pool } = require('../config/db');

const getReviews = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    const formatted = rows.map(r => ({
      id: r.id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      productName: r.product_name,
      rating: Number(r.rating),
      comment: r.comment,
      featured: Boolean(r.featured),
      repliedAt: r.replied_at,
      adminReply: r.admin_reply,
      createdAt: r.created_at
    }));
    return res.json({ success: true, reviews: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve reviews.', error: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const { id, rating, comment, productName, message } = req.body;
    const { name, phone } = req.user;

    if (!id || !rating || !productName) {
      return res.status(400).json({ success: false, message: 'Missing required review fields.' });
    }

    const commentVal = comment !== undefined ? comment : (message || '');

    const [result] = await pool.query(
      'INSERT INTO reviews (id, customer_name, customer_phone, product_name, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, phone, productName, rating, commentVal]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Unable to save review. Please try again.' });
    }

    return res.status(201).json({ success: true, message: 'Review submitted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit review.', error: error.message });
  }
};

const replyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;

    const [result] = await pool.query(
      'UPDATE reviews SET admin_reply = ?, replied_at = CURRENT_TIMESTAMP WHERE id = ?',
      [adminReply, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    return res.json({ success: true, message: 'Reply submitted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit reply.', error: error.message });
  }
};

const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const [result] = await pool.query('UPDATE reviews SET featured = ? WHERE id = ?', [featured, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }
    return res.json({ success: true, message: 'Review featured state updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update featured state.', error: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }
    return res.json({ success: true, message: 'Review deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete review.', error: error.message });
  }
};

module.exports = {
  getReviews,
  createReview,
  replyReview,
  toggleFeatured,
  deleteReview
};
