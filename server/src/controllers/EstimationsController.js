const { pool } = require('../config/db');

const getEstimations = async (req, res) => {
  try {
    const { role, phone } = req.user;
    let query = `
      SELECT e.*, 
             p.name AS product_name,
             p.price AS product_price,
             p.image AS product_image,
             p.float_fee AS product_float_fee,
             p.wire_base_fee AS product_wire_base_fee,
             p.wire_base_meters AS product_wire_base_meters,
             p.wire_extra_per_meter AS product_wire_extra_per_meter
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
    
    const formatted = rows.map(r => ({
      id: r.id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      queryDetails: typeof r.query_details === 'string' ? JSON.parse(r.query_details || '{}') : r.query_details,
      status: r.status,
      createdAt: r.created_at,
      selectedProduct: r.selected_product_id ? {
        id: r.selected_product_id,
        name: r.product_name,
        price: Number(r.product_price),
        image: r.product_image,
        floatFee: Number(r.product_float_fee),
        wire: {
          baseFee: Number(r.product_wire_base_fee),
          baseMeters: Number(r.product_wire_base_meters),
          extraPerMeter: Number(r.product_wire_extra_per_meter)
        }
      } : null
    }));

    return res.json({ success: true, estimations: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve estimations.', error: error.message });
  }
};

const createEstimation = async (req, res) => {
  try {
    const { id, selectedProduct, queryDetails } = req.body;
    const { name, phone } = req.user;

    if (!id || !selectedProduct || !queryDetails) {
      return res.status(400).json({ success: false, message: 'Please fill all required inquiry fields.' });
    }

    await pool.query(
      'INSERT INTO estimations (id, customer_name, customer_phone, selected_product_id, query_details, status) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id,
        name,
        phone,
        selectedProduct.id,
        JSON.stringify(queryDetails),
        'Pending'
      ]
    );

    // Auto-create notification for admin
    const notifId = `not-${Date.now()}`;
    const notifMessage = `New estimation inquiry from ${name} (${phone}) for product ${selectedProduct.name}.`;
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
    const { queryDetails, status } = req.body;

    // Build update query dynamically
    let query = 'UPDATE estimations SET ';
    const params = [];

    if (queryDetails) {
      query += 'query_details = ?, ';
      params.push(JSON.stringify(queryDetails));
    }
    if (status) {
      query += 'status = ?, ';
      params.push(status);
    }

    // Remove trailing comma and space
    query = query.slice(0, -2);
    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);
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
