const { pool } = require('../config/db');

// Helper to get or create cart for logged-in user
const getOrCreateCartId = async (userId) => {
  const [carts] = await pool.query('SELECT id FROM cart WHERE user_id = ?', [userId]);
  if (carts.length > 0) {
    return carts[0].id;
  }
  const [result] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
  return result.insertId;
};

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartId = await getOrCreateCartId(userId);
    const [items] = await pool.query(
      `SELECT ci.id AS cart_item_id, p.id, ci.quantity, p.name, p.price, p.price * ci.quantity AS total, p.price AS unitPrice, p.image, p.float_fee, p.wire_base_fee, p.wire_base_meters, p.wire_extra_per_meter 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );
    return res.json({ success: true, cart: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve cart.', error: error.message });
  }
};

const syncCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items array required.' });
    }
    const cartId = await getOrCreateCartId(userId);
    
    // Delete all current items
    await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    
    // Insert new items
    if (items.length > 0) {
      const values = items.map(item => [cartId, item.id, item.quantity || 1]);
      await pool.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ?', [values]);
    }
    return res.json({ success: true, message: 'Cart synced successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to sync cart.', error: error.message });
  }
};

module.exports = {
  getCart,
  syncCart
};
