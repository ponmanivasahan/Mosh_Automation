const fs = require('fs');
const { pool } = require('../config/db');

const getEstimations = async (req, res) => {
  try {
    const { role, id, phone } = req.user;
    let query = `
      SELECT e.*, 
             p.name AS product_name,
             p.price AS product_price,
             p.image AS product_image
      FROM estimations e
      LEFT JOIN products p ON e.selected_product_id = p.id
    `;
    const params = [];

    if (!role || role.toString().toLowerCase() !== 'admin') {
      query += ' WHERE e.customer_id = ? OR (e.customer_id IS NULL AND e.customer_phone = ?)';
      params.push(id, phone);
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
        stage: (details.adminResponse || r.attachment_url) ? 'replied' : (r.status || details.stage || 'requested'),
        adminResponse: details.adminResponse || null,
        attachmentUrl: r.attachment_url || null,
        seen: Boolean(details.seen || false),
        createdAt: r.created_at
      };
    });

    return res.json({ success: true, estimations: formatted });
  } catch (error) {
    console.error('getEstimations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve estimations.' });
  }
};

const createEstimation = async (req, res) => {
  try {
    const {
      id,
      productId,
      productName,
      productImage,
      requirement,
      total,
      quantity,
      complexity
    } = req.body;
    const { id: customerId, name, phone } = req.user;

    if (!id || !productId) {
      return res.status(400).json({ success: false, message: 'Please fill all required inquiry fields.' });
    }

    const finalCustomerName = name || 'Customer';
    const finalCustomerPhone = phone;
    const finalStage = 'requested';

    const queryDetails = {
      productName: (productName || '').slice(0, 200),
      productImage: (productImage || '').slice(0, 500),
      requirement: (requirement || '').slice(0, 2000),
      total: Number(total) || 0,
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      complexity: (complexity || 'medium').slice(0, 50),
      stage: finalStage,
      adminResponse: null,
      seen: false
    };

    await pool.query(
      'INSERT INTO estimations (id, customer_id, customer_name, customer_phone, selected_product_id, query_details, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        customerId,
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
    console.error('createEstimation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit inquiry.' });
  }
};

const updateEstimation = async (req, res) => {
  try {
    const { id } = req.params;

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

    const updatedDetails = {
      productName: req.body.productName !== undefined ? req.body.productName : (details.productName || ''),
      productImage: req.body.productImage !== undefined ? req.body.productImage : (details.productImage || ''),
      requirement: req.body.requirement !== undefined ? req.body.requirement : (details.requirement || ''),
      total: req.body.total !== undefined ? req.body.total : (details.total || 0),
      quantity: req.body.quantity !== undefined ? req.body.quantity : (details.quantity || 1),
      complexity: req.body.complexity !== undefined ? req.body.complexity : (details.complexity || 'medium'),
      stage: details.stage || 'requested',
      adminResponse: req.body.adminResponse !== undefined ? req.body.adminResponse : (details.adminResponse || null),
      seen: req.body.seen !== undefined ? req.body.seen : (details.seen || false)
    };
    
    let status = row.status;
    let attachmentUrl = row.attachment_url;

    // Security & Role check
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin) {
      if (row.customer_id && req.user && row.customer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to edit this inquiry.' });
      }

      const isReplied =
        row.status === 'replied' ||
        details.stage === 'replied' ||
        Boolean(details.adminResponse && details.adminResponse.trim().length > 0) ||
        Boolean(row.attachment_url);

      if (isReplied) {
        return res.status(400).json({ success: false, message: 'Replied queries cannot be modified.' });
      }

      // Customer cannot forge adminResponse, stage, status, or attachment
      updatedDetails.adminResponse = details.adminResponse || null;
      updatedDetails.stage = details.stage || 'requested';
      status = row.status || 'pending';
      attachmentUrl = row.attachment_url || null;
    } else {
      if (req.file) {
        try {
          const fileBuffer = fs.readFileSync(req.file.path);
          const mimeType = req.file.mimetype || 'application/pdf';
          attachmentUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        } catch (err) {
          console.error('Failed to encode uploaded file to base64:', err);
          const hostUrl = req.protocol + '://' + req.get('host');
          attachmentUrl = `${hostUrl}/uploads/${req.file.filename}`;
        }
      } else if (req.body.attachmentUrl !== undefined) {
        attachmentUrl = req.body.attachmentUrl;
      }
      
      if ((req.body.adminResponse && req.body.adminResponse.trim().length > 0) ||
          (attachmentUrl && attachmentUrl.trim().length > 0)) {
        status = 'replied';
        updatedDetails.stage = 'replied';
      }
    }

    await pool.query(
      'UPDATE estimations SET query_details = ?, status = ?, attachment_url = ? WHERE id = ?',
      [JSON.stringify(updatedDetails), status, attachmentUrl, id]
    );

    return res.json({ success: true, message: 'Inquiry updated successfully.', attachmentUrl });
  } catch (error) {
    console.error('updateEstimation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update inquiry.' });
  }
};

const deleteEstimation = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM estimations WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }
    return res.json({ success: true, message: 'Inquiry deleted successfully.' });
  } catch (error) {
    console.error('deleteEstimation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete inquiry.' });
  }
};

module.exports = {
  getEstimations,
  createEstimation,
  updateEstimation,
  deleteEstimation
};
