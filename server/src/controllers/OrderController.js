const { pool } = require('../config/db');

const getOrders = async (req, res) => {
  try {
    const { role, id, phone } = req.user;
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

    if (!role || role.toString().toLowerCase() !== 'admin') {
      query += ' WHERE o.customer_id = ? OR (o.customer_id IS NULL AND o.user_phone = ?)';
      params.push(id, phone);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC';

    const [rows] = await pool.query(query, params);
    
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
    console.error('getOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
};

const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id, items, shippingAddress, paymentMethod, email } = req.body;
    const { id: customerId, name, phone } = req.user;

    if (!id || !items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Invalid order request payload.' });
    }

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.pincode) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required.' });
    }

    await connection.beginTransaction();

    // Verify each product and calculate authoritative price server-side
    const productIds = items.map(item => item.productId || item.id).filter(Boolean);
    if (productIds.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'No valid products in order.' });
    }

    // Query products table for authoritative pricing
    const [dbProducts] = await connection.query(
      'SELECT id, name, price FROM products WHERE id IN (?)',
      [productIds]
    );

    const productMap = new Map();
    dbProducts.forEach(p => productMap.set(p.id, p));

    let authoritativeSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const pId = item.productId || item.id;
      const dbProduct = productMap.get(pId);

      if (!dbProduct) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ success: false, message: `Product ${pId} not found in catalog.` });
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const unitPrice = Number(dbProduct.price);
      const itemTotal = unitPrice * quantity;

      authoritativeSubtotal += itemTotal;
      validatedItems.push({
        productId: dbProduct.id,
        quantity,
        unitPrice,
        total: itemTotal
      });
    }

    // Authoritative volume discount rule: > 5000 qualifies for 10% discount
    const discount = authoritativeSubtotal > 5000 ? Math.round(authoritativeSubtotal * 0.1) : 0;
    const authoritativeTotal = Math.max(0, authoritativeSubtotal - discount);

    // Update customer's email in database if provided
    if (email && typeof email === 'string') {
      await connection.query('UPDATE users SET email = ? WHERE id = ?', [email.trim(), customerId]);
    }

    // Check if order ID already exists to prevent duplicate submission
    const [existingOrder] = await connection.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (existingOrder.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ success: false, message: 'Order ID already exists. Please retry.' });
    }

    // Use shipping address recipient name if provided, else fallback to user name
    const recipientName = (shippingAddress.name || name || '').trim().slice(0, 100);

    // Insert order header with server-computed authoritative total
    await connection.query(
      `INSERT INTO orders 
        (id, user_phone, customer_name, total, status, payment_status, shipping_address, shipping_city, shipping_pincode, payment_method, customer_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        phone,
        recipientName,
        authoritativeTotal,
        'Processing',
        'Pending',
        shippingAddress.address.trim().slice(0, 255),
        shippingAddress.city.trim().slice(0, 100),
        shippingAddress.pincode.trim().slice(0, 20),
        paymentMethod || 'Online',
        customerId
      ]
    );

    // Insert order items with authoritative prices
    for (const item of validatedItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [id, item.productId, item.quantity, item.unitPrice]
      );
    }

    // Auto-create notification for admin
    const notifId = `not-${Date.now()}`;
    const notifMessage = `${recipientName} (${phone}) placed an order for ₹${authoritativeTotal} to ${shippingAddress.city}.`;
    await connection.query(
      'INSERT INTO notifications (id, title, message, order_id) VALUES (?, ?, ?, ?)',
      [notifId, 'New Customer Order', notifMessage, id]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      orderId: id,
      total: authoritativeTotal
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('createOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to place order.' });
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

    // Enforce role permission: customers can only cancel or mark completed
    const { role, id: customerId, phone } = req.user;
    const isOwner = (order.customer_id && String(order.customer_id) === String(customerId)) || order.user_phone === phone;

    if (role !== 'admin') {
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Unauthorized status modification.' });
      }

      if (status === 'Cancelled' && order.status !== 'Processing') {
        return res.status(400).json({ success: false, message: 'Cannot cancel order once dispatched or completed.' });
      }

      if (status === 'Completed' && order.status !== 'Dispatched') {
        return res.status(400).json({ success: false, message: 'Can only mark as completed once dispatched.' });
      }

      if (status !== 'Cancelled' && status !== 'Completed') {
        return res.status(403).json({ success: false, message: 'Customers can only cancel or mark delivered.' });
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
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, paymentMethod } = req.body;
    const { role, id: customerId, phone } = req.user;

    if (!transactionId || typeof transactionId !== 'string' || !transactionId.trim()) {
      return res.status(400).json({ success: false, message: 'Valid transaction ID or UTR reference is required.' });
    }

    if (!paymentMethod || typeof paymentMethod !== 'string') {
      return res.status(400).json({ success: false, message: 'Payment method is required.' });
    }

    const cleanTxnId = transactionId.trim().slice(0, 100);
    const cleanMethod = paymentMethod.trim().slice(0, 50);

    const [existing] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = existing[0];
    const isOwner = (order.customer_id && String(order.customer_id) === String(customerId)) || order.user_phone === phone;

    // Strict IDOR check
    if (role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Order does not belong to you.' });
    }

    if (order.payment_status === 'Paid') {
      return res.json({
        success: true,
        message: 'Payment was already verified and recorded.',
        order: {
          id: order.id,
          status: 'Paid',
          paymentStatus: 'Paid',
          paymentMethod: order.payment_method,
          transactionId: order.transaction_id,
          paymentTime: order.payment_time
        }
      });
    }

    const paymentTime = new Date();
    await pool.query(
      'UPDATE orders SET status = "Paid", payment_status = "Paid", payment_method = ?, transaction_id = ?, payment_time = ? WHERE id = ?',
      [cleanMethod, cleanTxnId, paymentTime, id]
    );

    // Auto-create notification for admin
    const notifId = `not-${Date.now()}`;
    const notifMessage = `Payment of ₹${order.total} verified for Order #${id} via ${cleanMethod}. Transaction ID: ${cleanTxnId}.`;
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
        paymentMethod: cleanMethod,
        transactionId: cleanTxnId,
        paymentTime
      }
    });
  } catch (error) {
    console.error('verifyPayment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify payment.' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    return res.json({ success: true, message: 'Order deleted successfully.' });
  } catch (error) {
    console.error('deleteOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete order.' });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  verifyPayment,
  deleteOrder
};
