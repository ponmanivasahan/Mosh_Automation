const { pool } = require('../config/db');

const createQuery = async (req, res) => {
  try {
    const { query_id, product_id, query_description, status } = req.body;
    const { name, phone } = req.user;

    if (!product_id || !query_description) {
      return res.status(400).json({ success: false, message: 'product_id and query_description are required.' });
    }

    const id = query_id || `est-${Date.now()}`;
    const finalStage = status || 'Pending';

    // Fetch product details for query_details payload
    const [products] = await pool.query('SELECT name, image, price FROM products WHERE id = ?', [product_id]);
    const product = products[0] || {};

    const queryDetails = {
      productName: product.name || '',
      productImage: product.image || '',
      requirement: query_description,
      total: product.price || 0,
      quantity: 1,
      complexity: 'medium',
      stage: finalStage,
      adminResponse: null,
      seen: false
    };

    await pool.query(
      'INSERT INTO estimations (id, customer_name, customer_phone, selected_product_id, query_details, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id,
        name || 'Customer',
        phone,
        product_id,
        JSON.stringify(queryDetails),
        finalStage
      ]
    );

    // Auto-create notification for admin
    const notifId = `not-${Date.now()}`;
    const notifMessage = `${name || 'Customer'} (${phone}) submitted a query for ${product.name || product_id}.`;
    await pool.query(
      'INSERT INTO notifications (id, title, message) VALUES (?, ?, ?)',
      [notifId, 'New Customer Query', notifMessage]
    );

    return res.status(201).json({
      success: true,
      message: 'Query submitted successfully.',
      query: {
        query_id: id,
        customer_id: req.user.id,
        product_id,
        query_description,
        status: finalStage,
        created_at: new Date()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit query.', error: error.message });
  }
};

module.exports = {
  createQuery
};
