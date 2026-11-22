const { pool } = require('../config/db');

const createQuery = async (req, res) => {
  try {
    const { query_id, product_id, query_description, status } = req.body;
    const { id: customerId, name, phone } = req.user;

    if (!product_id || !query_description) {
      return res.status(400).json({ success: false, message: 'product_id and query_description are required.' });
    }

    const cleanProductId = String(product_id).trim().slice(0, 50);
    const cleanDescription = String(query_description).trim().slice(0, 2000);
    const id = query_id || `est-${Date.now()}`;
    const finalStage = status || 'Pending';

    // Fetch product details for query_details payload
    const [products] = await pool.query('SELECT name, image, price FROM products WHERE id = ?', [cleanProductId]);
    const product = products[0] || {};

    const queryDetails = {
      productName: product.name || '',
      productImage: product.image || '',
      requirement: cleanDescription,
      total: product.price || 0,
      quantity: 1,
      complexity: 'medium',
      stage: finalStage,
      adminResponse: null,
      seen: false
    };

    await pool.query(
      'INSERT INTO estimations (id, customer_id, customer_name, customer_phone, selected_product_id, query_details, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        customerId,
        name || 'Customer',
        phone,
        cleanProductId,
        JSON.stringify(queryDetails),
        finalStage
      ]
    );

    // Auto-create notification for admin
    const notifId = `not-${Date.now()}`;
    const notifMessage = `${name || 'Customer'} (${phone}) submitted a query for ${product.name || cleanProductId}.`;
    await pool.query(
      'INSERT INTO notifications (id, title, message) VALUES (?, ?, ?)',
      [notifId, 'New Customer Query', notifMessage]
    );

    return res.status(201).json({
      success: true,
      message: 'Query submitted successfully.',
      query: {
        query_id: id,
        customer_id: customerId,
        product_id: cleanProductId,
        query_description: cleanDescription,
        status: finalStage,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('createQuery error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit query.' });
  }
};

module.exports = {
  createQuery
};
