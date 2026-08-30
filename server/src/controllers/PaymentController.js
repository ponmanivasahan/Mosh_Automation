const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../config/db');

const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { id: customerId } = req.user;

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;

    if (!process.env.RAZORPAY_KEY_ID || !razorpaySecret) {
      return res.status(500).json({ success: false, message: 'Payment gateway not configured. Please contact support.' });
    }

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    // Fetch the order
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND customer_id = ?', [orderId, customerId]);
    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    const order = orders[0];
    if (order.payment_status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Order already paid.' });
    }

    const amountInPaise = Math.round(Number(order.total) * 100);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: razorpaySecret,
    });

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.id,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    await pool.query('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [razorpayOrder.id, order.id]);

    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });

  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    const errorDetail = error.error ? error.error.description : error.message;
    return res.status(500).json({ success: false, message: `Failed to create payment order: ${errorDetail}`, error: errorDetail });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const { id: customerId } = req.user;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Signature valid, update database
    const [result] = await pool.query(
      `UPDATE orders SET payment_status = ?, status = ?, transaction_id = ?, razorpay_signature = ?, payment_time = CURRENT_TIMESTAMP WHERE razorpay_order_id = ? AND customer_id = ?`,
      ['Paid', 'Paid', razorpay_payment_id, razorpay_signature, razorpay_order_id, customerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found for verification' });
    }

    return res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Verify Razorpay Error:', error);
    return res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};

const migrateDatabase = async (req, res) => {
  try {
    // Ignore errors if columns already exist
    await pool.query('ALTER TABLE orders ADD COLUMN razorpay_order_id VARCHAR(100) DEFAULT NULL').catch(() => {});
    await pool.query('ALTER TABLE orders ADD COLUMN razorpay_signature VARCHAR(255) DEFAULT NULL').catch(() => {});
    return res.json({ success: true, message: 'Live database migrated successfully! You can now process payments.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Migration failed', error: error.message });
  }
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment, migrateDatabase };
