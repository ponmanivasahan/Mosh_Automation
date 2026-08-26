const { pool } = require('../config/db');

const getProducts = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    
    // Fetch all offers
    const [offers] = await pool.query('SELECT * FROM product_offers');
    
    // Group offers by product_id
    const offersByProduct = {};
    for (const offer of offers) {
      if (!offersByProduct[offer.product_id]) {
        offersByProduct[offer.product_id] = [];
      }
      offersByProduct[offer.product_id].push({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        type: offer.offer_type,
        value: Number(offer.offer_value),
        validUntil: offer.valid_until,
        showOffer: Boolean(offer.show_offer)
      });
    }

    // Map back wire configuration structure to match frontend layout expectation
    const formatted = rows.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      image: p.image,
      category: p.category || 'Automation',
      features: p.features || '',
      stock: p.stock !== null ? Number(p.stock) : 10,
      warranty: p.warranty || '1 Year Warranty',
      specifications: p.specifications || '',
      availability: p.availability || 'In Stock',
      floatFee: Number(p.float_fee),
      wire: {
        baseFee: Number(p.wire_base_fee),
        baseMeters: Number(p.wire_base_meters),
        extraPerMeter: Number(p.wire_extra_per_meter)
      },
      offers: offersByProduct[p.id] || []
    }));
    return res.json({ success: true, products: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { id, name, description, price, image, category, features, stock, warranty, specifications, availability, floatFee, wire, offers } = req.body;

    if (!id || !name || !price || !image) {
      return res.status(400).json({ success: false, message: 'Please fill all required product fields.' });
    }

    const baseFee = wire?.baseFee || 0;
    const baseMeters = wire?.baseMeters || 0;
    const extraPerMeter = wire?.extraPerMeter || 0;

    await pool.query(
      'INSERT INTO products (id, name, description, price, image, category, features, stock, warranty, specifications, availability, float_fee, wire_base_fee, wire_base_meters, wire_extra_per_meter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, description, price, image, category || 'Automation', features || '', stock || 10, warranty || '1 Year Warranty', specifications || '', availability || 'In Stock', floatFee || 0, baseFee, baseMeters, extraPerMeter]
    );
    
    if (offers && Array.isArray(offers) && offers.length > 0) {
      for (const offer of offers) {
        await pool.query(
          'INSERT INTO product_offers (product_id, title, description, offer_type, offer_value, valid_until, show_offer) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, offer.title, offer.description || '', offer.type, offer.value || 0, offer.validUntil || null, offer.showOffer !== false]
        );
      }
    }

    // Verify insertion directly in MySQL
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(500).json({ success: false, message: 'Failed to verify new product insertion in database.' });
    }

    const [offerRows] = await pool.query('SELECT * FROM product_offers WHERE product_id = ?', [id]);
    const formattedOffers = offerRows.map(offer => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      type: offer.offer_type,
      value: Number(offer.offer_value),
      validUntil: offer.valid_until,
      showOffer: Boolean(offer.show_offer)
    }));

    const formatted = {
      id: rows[0].id,
      name: rows[0].name,
      description: rows[0].description,
      price: Number(rows[0].price),
      image: rows[0].image,
      category: rows[0].category || 'Automation',
      features: rows[0].features || '',
      stock: rows[0].stock !== null ? Number(rows[0].stock) : 10,
      warranty: rows[0].warranty || '1 Year Warranty',
      specifications: rows[0].specifications || '',
      availability: rows[0].availability || 'In Stock',
      floatFee: Number(rows[0].float_fee),
      wire: {
        baseFee: Number(rows[0].wire_base_fee),
        baseMeters: Number(rows[0].wire_base_meters),
        extraPerMeter: Number(rows[0].wire_extra_per_meter)
      },
      offers: formattedOffers
    };

    return res.status(201).json({ 
      success: true, 
      message: 'Product created successfully.',
      product: formatted
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create product.', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, category, features, stock, warranty, specifications, availability, floatFee, wire, offers } = req.body;

    const baseFee = wire?.baseFee || 0;
    const baseMeters = wire?.baseMeters || 0;
    const extraPerMeter = wire?.extraPerMeter || 0;

    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'No product was found with the specified ID to update.' });
    }

    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, features = ?, stock = ?, warranty = ?, specifications = ?, availability = ?, float_fee = ?, wire_base_fee = ?, wire_base_meters = ?, wire_extra_per_meter = ? WHERE id = ?',
      [name, description, price, image, category || 'Automation', features || '', stock || 10, warranty || '1 Year Warranty', specifications || '', availability || 'In Stock', floatFee || 0, baseFee, baseMeters, extraPerMeter, id]
    );
    
    if (offers && Array.isArray(offers)) {
      // For simplicity in updating, if offers array is provided, we can sync it (delete missing, insert new, update existing)
      // Or simply delete all and re-insert to ensure exact match of the provided array
      await pool.query('DELETE FROM product_offers WHERE product_id = ?', [id]);
      for (const offer of offers) {
        await pool.query(
          'INSERT INTO product_offers (product_id, title, description, offer_type, offer_value, valid_until, show_offer) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, offer.title, offer.description || '', offer.type, offer.value || 0, offer.validUntil || null, offer.showOffer !== false]
        );
      }
    }

    // Retrieve updated record directly from MySQL
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    const updated = rows[0];

    // Retrieve offers
    const [offerRows] = await pool.query('SELECT * FROM product_offers WHERE product_id = ?', [id]);
    const formattedOffers = offerRows.map(offer => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      type: offer.offer_type,
      value: Number(offer.offer_value),
      validUntil: offer.valid_until,
      showOffer: Boolean(offer.show_offer)
    }));

    const formatted = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      price: Number(updated.price),
      image: updated.image,
      category: updated.category || 'Automation',
      features: updated.features || '',
      stock: updated.stock !== null ? Number(updated.stock) : 10,
      warranty: updated.warranty || '1 Year Warranty',
      specifications: updated.specifications || '',
      availability: updated.availability || 'In Stock',
      floatFee: Number(updated.float_fee),
      wire: {
        baseFee: Number(updated.wire_base_fee),
        baseMeters: Number(updated.wire_base_meters),
        extraPerMeter: Number(updated.wire_extra_per_meter)
      },
      offers: formattedOffers
    };

    return res.json({ success: true, message: 'Product updated successfully.', product: formatted });
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
