const { pool } = require('../config/db');

const getOrders = async (req, res) => {
  try {
    const { role, phone } = req.user;
    let query = `
      SELECT o.*, 
             JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', oi.id,
                 'productId', oi.product_id,
                 'quantity', oi.quantity,
                 'unitPrice', oi.unit_price,
                 'name', p.name,
                 'image', p.image
               )
             ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
    `;
    const params = [];

    if (role !== 'admin') {
      query += ' WHERE o.user_phone = ?';
      params.push(phone);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC';

    const [rows] = await pool.query(query, params);
    
    // Parse JSON string items back to array
    const formatted = rows.map(r => ({
      id: r.id,
      customerName: r.customer_name,
      customerPhone: r.user_phone,
      total: Number(r.total),
      status: r.status,
      shippingAddress: {
        address: r.shipping_address,
        city: r.shipping_city,
        pincode: r.shipping_pincode
      },
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      transactionId: r.transaction_id,
      paymentTime: r.payment_time,
      createdAt: r.created_at,
      items: Array.isArray(r.items) ? r.items : JSON.parse(r.items || '[]')
    }));

    return res.json({ success: true, orders: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders.', error: error.message });
  }
};

const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id, items, total, shippingAddress, paymentMethod } = req.body;
    const { name, phone } = req.user;

    if (!id || !items || !items.length || !total || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Invalid order request payload.' });
    }

    await connection.beginTransaction();

    // Insert order header
    await connection.query(
      'INSERT INTO orders (id, user_phone, customer_name, total, status, payment_status, shipping_address, shipping_city, shipping_pincode, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        phone,
        name,
        total,
        'Processing',
        'Pending',
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.pincode,
        paymentMethod
      ]
    );

    // Insert items
    for (const item of items) {
      const unitPrice = item.unitPrice || (item.total / (item.quantity || 1));
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [id, item.id || item.productId, item.quantity || 1, unitPrice]
      );
    }

    // Auto-create notification for admin
    const notifId = `not-${Date.now()}`;
    const notifMessage = `${name} (${phone}) placed an order for ₹${total} to ${shippingAddress.city}.`;
    await connection.query(
      'INSERT INTO notifications (id, title, message, order_id) VALUES (?, ?, ?, ?)',
      [notifId, 'New Customer Order', notifMessage, id]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({ success: true, message: 'Order created successfully.', orderId: id });
  } catch (error) {
    await connection.rollback();
    connection.release();
    return res.status(500).json({ success: false, message: 'Failed to place order.', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Processing', 'Paid', 'Dispatched', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition value.' });
    }

    const [existing] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    const order = existing[0];

    // Enforce role permission: customers can only transition to 'Completed' (when marking Delivered) or 'Cancelled' (if status is Processing)
    const { role, phone } = req.user;
    if (role !== 'admin') {
      if (order.user_phone !== phone) {
        return res.status(403).json({ success: false, message: 'Unauthorized status modification.' });
      }

      if (status === 'Cancelled' && order.status !== 'Processing') {
        return res.status(400).json({ success: false, message: 'Cannot cancel order once dispatched.' });
      }

      if (status === 'Completed' && order.status !== 'Dispatched') {
        return res.status(400).json({ success: false, message: 'Can only mark as completed once dispatched.' });
      }
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // Send notifications on status change
    const notifId = `not-${Date.now()}`;
    const notifTitle = `Order ${status}`;
    const notifMessage = `Order #${id} has been marked as ${status}.`;
    await pool.query(
      'INSERT INTO notifications (id, title, message, order_id) VALUES (?, ?, ?, ?)',
      [notifId, notifTitle, notifMessage, id]
    );

    return res.json({ success: true, message: `Order status updated to ${status} successfully.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order status.', error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, paymentMethod } = req.body;

    if (!transactionId || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Transaction ID and Payment Method are required.' });
    }

    const [existing] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const paymentTime = new Date();
    await pool.query(
      'UPDATE orders SET status = "Paid", payment_status = "Paid", payment_method = ?, transaction_id = ?, payment_time = ? WHERE id = ?',
      [paymentMethod, transactionId, paymentTime, id]
    );

    // Auto-create notification for admin
    const notifId = `not-${Date.now()}`;
    const notifMessage = `Payment of ₹${existing[0].total} verified for Order #${id} via ${paymentMethod}. Transaction ID: ${transactionId}.`;
    await pool.query(
      'INSERT INTO notifications (id, title, message, order_id) VALUES (?, ?, ?, ?)',
      [notifId, 'Order Paid Successfully', notifMessage, id]
    );

    return res.json({
      success: true,
      message: 'Payment verified and saved successfully.',
      order: {
        id,
        status: 'Paid',
        paymentStatus: 'Paid',
        paymentMethod,
        transactionId,
        paymentTime
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to verify payment.', error: error.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  verifyPayment
};
