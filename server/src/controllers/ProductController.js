const { pool } = require('../config/db');

const getProducts = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    // Map back wire configuration structure to match frontend layout expectation
    const formatted = rows.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      image: p.image,
      floatFee: Number(p.float_fee),
      wire: {
        baseFee: Number(p.wire_base_fee),
        baseMeters: Number(p.wire_base_meters),
        extraPerMeter: Number(p.wire_extra_per_meter)
      }
    }));
    return res.json({ success: true, products: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { id, name, description, price, image, floatFee, wire } = req.body;

    if (!id || !name || !price || !image) {
      return res.status(400).json({ success: false, message: 'Please fill all required product fields.' });
    }

    const baseFee = wire?.baseFee || 0;
    const baseMeters = wire?.baseMeters || 0;
    const extraPerMeter = wire?.extraPerMeter || 0;

    await pool.query(
      'INSERT INTO products (id, name, description, price, image, float_fee, wire_base_fee, wire_base_meters, wire_extra_per_meter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, description, price, image, floatFee || 0, baseFee, baseMeters, extraPerMeter]
    );

    return res.status(201).json({ success: true, message: 'Product created successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create product.', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, floatFee, wire } = req.body;

    const baseFee = wire?.baseFee || 0;
    const baseMeters = wire?.baseMeters || 0;
    const extraPerMeter = wire?.extraPerMeter || 0;

    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image = ?, float_fee = ?, wire_base_fee = ?, wire_base_meters = ?, wire_extra_per_meter = ? WHERE id = ?',
      [name, description, price, image, floatFee || 0, baseFee, baseMeters, extraPerMeter, id]
    );

    return res.json({ success: true, message: 'Product updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update product.', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete product.', error: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
