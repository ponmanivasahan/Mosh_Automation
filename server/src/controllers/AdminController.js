const { pool } = require('../config/db');

const getCustomers = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.phone, 
        u.email, 
        u.status,
        u.created_at AS createdAt,
        (SELECT COUNT(*) FROM orders o WHERE o.user_phone = u.phone) AS numOrders,
        (SELECT COUNT(*) FROM estimations e WHERE e.customer_phone = u.phone) AS numQueries,
        (SELECT COUNT(*) FROM reviews r WHERE r.customer_phone = u.phone) AS numReviews
      FROM users u
      WHERE u.role = 'customer'
      ORDER BY u.created_at DESC
    `;

    const [rows] = await pool.query(query);

    const formattedCustomers = rows.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email || `${r.name.toLowerCase().replace(/\s+/g, '') || 'customer'}@example.com`,
      status: r.status || 'Active',
      createdAt: r.createdAt,
      numOrders: Number(r.numOrders || 0),
      numQueries: Number(r.numQueries || 0),
      numReviews: Number(r.numReviews || 0)
    }));

    return res.json({
      success: true,
      customers: formattedCustomers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers.',
      error: error.message
    });
  }
};

module.exports = {
  getCustomers
};
