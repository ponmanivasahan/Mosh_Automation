const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mosh_automation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Essential to run schema.sql initialization statements
});

// Automatically initialize database schema and seeds
const initDB = async () => {
  try {
    // Test basic connection (host level) to create DB if not exists
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'mosh_automation'}\`;`);
    await tempConnection.end();

    // Now initialize tables using the pool
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database pool.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlSchema = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(sqlSchema);
      
      // Ensure columns exist on orders table
      try {
        await connection.query("ALTER TABLE orders ADD COLUMN payment_status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending';");
      } catch(e){}
      try {
        await connection.query("ALTER TABLE orders ADD COLUMN transaction_id VARCHAR(100) DEFAULT NULL;");
      } catch(e){}
      try {
        await connection.query("ALTER TABLE orders ADD COLUMN payment_time TIMESTAMP NULL DEFAULT NULL;");
      } catch(e){}
      try {
        await connection.query("ALTER TABLE orders MODIFY COLUMN status ENUM('Processing', 'Paid', 'Dispatched', 'Completed', 'Cancelled') DEFAULT 'Processing';");
      } catch(e){}
      try {
        await connection.query("ALTER TABLE users ADD COLUMN logged_in_at TIMESTAMP NULL DEFAULT NULL;");
      } catch(e){}

      console.log('Database schema verified & seeded successfully.');
    } else {
      console.warn('Database schema.sql file not found. Skipping auto-seeding.');
    }
    
    connection.release();
  } catch (error) {
    console.error('Critical Database initialization failure:', error.message);
  }
};

module.exports = {
  pool,
  initDB
};
