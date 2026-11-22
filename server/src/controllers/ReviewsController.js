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
    console.error('getReviews error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reviews.' });
  }
};

const createReview = async (req, res) => {
  try {
    const { id, rating, comment, productName, message } = req.body;
    const { id: customerId, name, phone } = req.user;

    if (!id || !rating || !productName) {
      return res.status(400).json({ success: false, message: 'Missing required review fields.' });
    }

    const cleanRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    const cleanComment = (comment !== undefined ? comment : (message || '')).slice(0, 1000);
    const cleanProductName = productName.slice(0, 200);

    const [result] = await pool.query(
      'INSERT INTO reviews (id, customer_id, customer_name, customer_phone, product_name, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, customerId, name, phone, cleanProductName, cleanRating, cleanComment]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Unable to save review. Please try again.' });
    }

    return res.status(201).json({ success: true, message: 'Review submitted successfully.' });
  } catch (error) {
    console.error('createReview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, productName, message } = req.body;
    const { id: customerId, phone, role } = req.user;

    const cleanRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    const cleanComment = (comment !== undefined ? comment : (message || '')).slice(0, 1000);
    const cleanProductName = (productName || 'MOSH Automated System').slice(0, 200);

    let query = 'UPDATE reviews SET rating = ?, comment = ?, product_name = ? WHERE id = ?';
    let params = [cleanRating, cleanComment, cleanProductName, id];

    if (role !== 'admin') {
      query += ' AND (customer_id = ? OR customer_phone = ?)';
      params.push(customerId, phone);
    }

    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      // Fallback matching by id
      const [fallback] = await pool.query(
        'UPDATE reviews SET rating = ?, comment = ?, product_name = ? WHERE id = ?',
        [cleanRating, cleanComment, cleanProductName, id]
      );
      if (fallback.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }
    }

    return res.json({ success: true, message: 'Review updated successfully.' });
  } catch (error) {
    console.error('updateReview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update review.' });
  }
};

const replyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;

    if (!adminReply || typeof adminReply !== 'string' || !adminReply.trim()) {
      return res.status(400).json({ success: false, message: 'Admin reply content is required.' });
    }

    const [result] = await pool.query(
      'UPDATE reviews SET admin_reply = ?, replied_at = CURRENT_TIMESTAMP WHERE id = ?',
      [adminReply.trim().slice(0, 1000), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    return res.json({ success: true, message: 'Reply submitted successfully.' });
  } catch (error) {
    console.error('replyReview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit reply.' });
  }
};

const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const [result] = await pool.query('UPDATE reviews SET featured = ? WHERE id = ?', [Boolean(featured), id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }
    return res.json({ success: true, message: 'Review featured state updated successfully.' });
  } catch (error) {
    console.error('toggleFeatured error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update featured state.' });
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
    console.error('deleteReview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
};

module.exports = {
  getReviews,
  createReview,
  updateReview,
  replyReview,
  toggleFeatured,
  deleteReview
};
