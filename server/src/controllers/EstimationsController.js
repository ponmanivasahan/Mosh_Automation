const { pool } = require('../config/db');

const getEstimations = async (req, res) => {
  try {
    const { role, phone } = req.user;
    let query = `
      SELECT e.*, 
             p.name AS product_name,
             p.price AS product_price,
             p.image AS product_image
      FROM estimations e
      LEFT JOIN products p ON e.selected_product_id = p.id
    `;
    const params = [];

    if (role !== 'admin') {
      query += ' WHERE e.customer_phone = ?';
      params.push(phone);
    }

    query += ' ORDER BY e.created_at DESC';

    const [rows] = await pool.query(query, params);
    
    const formatted = rows.map(r => {
      let details = {};
      try {
        details = typeof r.query_details === 'string' ? JSON.parse(r.query_details || '{}') : (r.query_details || {});
      } catch (e) {
        details = {};
      }
      return {
        id: r.id,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        productId: r.selected_product_id,
        productName: details.productName || r.product_name || '',
        productImage: details.productImage || r.product_image || '',
        requirement: details.requirement || '',
        total: Number(details.total !== undefined ? details.total : (r.product_price || 0)),
        quantity: Number(details.quantity || 1),
        complexity: details.complexity || 'medium',
        stage: r.status || details.stage || 'requested',
        adminResponse: details.adminResponse || null,
        seen: Boolean(details.seen || false),
        createdAt: r.created_at
      };
    });

    return res.json({ success: true, estimations: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve estimations.', error: error.message });
  }
};

const createEstimation = async (req, res) => {
  try {
    const {
      id,
      customerName,
      customerPhone,
      productId,
      productName,
      productImage,
      requirement,
      total,
      quantity,
      complexity,
      stage
    } = req.body;
    const { name, phone } = req.user;

    if (!id || !productId) {
      return res.status(400).json({ success: false, message: 'Please fill all required inquiry fields.' });
    }

    const finalCustomerName = customerName || name || 'Customer';
    const finalCustomerPhone = customerPhone || phone || '0000000000';
    const finalStage = stage || 'requested';

    const queryDetails = {
      productName: productName || '',
      productImage: productImage || '',
      requirement: requirement || '',
      total: total || 0,
      quantity: quantity || 1,
      complexity: complexity || 'medium',
      stage: finalStage,
      adminResponse: null,
      seen: false
    };

    await pool.query(
      'INSERT INTO estimations (id, customer_name, customer_phone, selected_product_id, query_details, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id,
        finalCustomerName,
        finalCustomerPhone,
        productId,
        JSON.stringify(queryDetails),
        finalStage
      ]
    );

    // Auto-create notification for admin
    const notifId = `not-${Date.now()}`;
    const notifMessage = `New estimation inquiry from ${finalCustomerName} (${finalCustomerPhone}) for product ${productName || productId}.`;
    await pool.query(
      'INSERT INTO notifications (id, title, message) VALUES (?, ?, ?)',
      [notifId, 'New Estimation Inquiry', notifMessage]
    );

    return res.status(201).json({ success: true, message: 'Inquiry submitted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit inquiry.', error: error.message });
  }
};

const updateEstimation = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the existing query details first
    const [existing] = await pool.query('SELECT * FROM estimations WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Estimation inquiry not found.' });
    }
    const row = existing[0];
    let details = {};
    try {
      details = typeof row.query_details === 'string' ? JSON.parse(row.query_details || '{}') : (row.query_details || {});
    } catch (e) {
      details = {};
    }

    // Merge updates from req.body
    const updatedDetails = {
      productName: req.body.productName !== undefined ? req.body.productName : (details.productName || ''),
      productImage: req.body.productImage !== undefined ? req.body.productImage : (details.productImage || ''),
      requirement: req.body.requirement !== undefined ? req.body.requirement : (details.requirement || ''),
      total: req.body.total !== undefined ? req.body.total : (details.total || 0),
      quantity: req.body.quantity !== undefined ? req.body.quantity : (details.quantity || 1),
      complexity: req.body.complexity !== undefined ? req.body.complexity : (details.complexity || 'medium'),
      stage: req.body.stage !== undefined ? req.body.stage : (row.status || details.stage || 'requested'),
      adminResponse: req.body.adminResponse !== undefined ? req.body.adminResponse : (details.adminResponse || null),
      seen: req.body.seen !== undefined ? req.body.seen : (details.seen || false)
    };

    const status = req.body.stage || updatedDetails.stage;

    await pool.query(
      'UPDATE estimations SET query_details = ?, status = ? WHERE id = ?',
      [JSON.stringify(updatedDetails), status, id]
    );

    return res.json({ success: true, message: 'Inquiry updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update inquiry.', error: error.message });
  }
};

const deleteEstimation = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM estimations WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Inquiry deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete inquiry.', error: error.message });
  }
};

module.exports = {
  getEstimations,
  createEstimation,
  updateEstimation,
  deleteEstimation
};
