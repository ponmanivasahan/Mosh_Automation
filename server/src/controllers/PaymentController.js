const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../config/db');

const getRazorpayCredentials = () => {
  const rawSecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY;
  const razorpaySecret = (rawSecret || '').trim();
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  return { keyId, razorpaySecret };
};

const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const customerId = req.user?.id;
    const userRole = req.user?.role;

    const { keyId, razorpaySecret } = getRazorpayCredentials();

    if (!keyId || !razorpaySecret) {
      console.error('Razorpay credentials missing in environment');
      return res.status(500).json({ success: false, message: 'Payment gateway not configured. Please contact support.' });
    }

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    // Fetch the order and ensure ownership
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];

    // Authorization check: Customer can only pay for their own order
    if (userRole !== 'admin' && String(order.customer_id) !== String(customerId)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to pay for this order.' });
    }

    if (order.payment_status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid.' });
    }

    const orderAmount = Number(order.total);
    if (isNaN(orderAmount) || orderAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order amount.' });
    }

    const amountInPaise = Math.round(orderAmount * 100);

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: razorpaySecret,
    });

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: String(order.id),
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);

    await pool.query('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [razorpayOrder.id, order.id]);

    return res.json({
      success: true,
      keyId: keyId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });

  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const customerId = req.user?.id;
    const userRole = req.user?.role;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters.'
      });
    }

    const { razorpaySecret } = getRazorpayCredentials();
    if (!razorpaySecret) {
      console.error('Razorpay secret missing during payment verification');
      return res.status(500).json({ success: false, message: 'Payment gateway configuration error.' });
    }

    // Step 1: Verify HMAC SHA-256 signature with timingSafeEqual
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(payload)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    const actualBuf = Buffer.from(razorpay_signature, 'utf8');

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      console.warn(`Payment signature verification failed for razorpay_order_id: ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }

    // Step 2: Fetch the order and verify authorization
    const [orders] = await pool.query('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id]);
    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Associated order not found.' });
    }

    const order = orders[0];

    // Step 3: Check order ownership
    if (userRole !== 'admin' && String(order.customer_id) !== String(customerId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Order does not belong to you.' });
    }

    // Step 4: Handle already paid order idempotently
    if (order.payment_status === 'Paid') {
      return res.json({ success: true, message: 'Payment was already verified and recorded.' });
    }

    // Step 5: Atomically update order to Paid status
    const [result] = await pool.query(
      `UPDATE orders 
       SET payment_status = 'Paid', 
           status = 'Paid', 
           transaction_id = ?, 
           razorpay_signature = ?, 
           payment_time = CURRENT_TIMESTAMP 
       WHERE razorpay_order_id = ? AND payment_status != 'Paid'`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ success: false, message: 'Order status conflict or payment already recorded.' });
    }

    console.log(`Payment successfully verified and captured for Order ${order.id}`);
    return res.json({ success: true, message: 'Payment verified successfully.' });
  } catch (error) {
    console.error('Verify Razorpay Error:', error);
    return res.status(500).json({ success: false, message: 'Payment verification processing failed.' });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment
};
