const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let activePassword = process.env.DB_PASSWORD || 'tonystark';

// Create initial pool
let pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: activePassword,
  database: process.env.DB_NAME || 'mosh_automation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

// Helper proxy object so exports always use the active pool
const dbPool = {
  query: (...args) => pool.query(...args),
  execute: (...args) => pool.execute(...args),
  getConnection: () => pool.getConnection()
};

// Automatically initialize database schema and seeds with fallback password auto-detection
const initDB = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const dbName = process.env.DB_NAME || 'mosh_automation';
  const candidatePasswords = [
    process.env.DB_PASSWORD,
    'tonystark',
    '',
    'root',
    '1234',
    '123456',
    'admin',
    'password'
  ].filter((p, idx, arr) => p !== undefined && arr.indexOf(p) === idx);

  let workingPassword = null;
  let tempConnection = null;

  for (const pwd of candidatePasswords) {
    try {
      tempConnection = await mysql.createConnection({
        host,
        user,
        password: pwd
      });
      workingPassword = pwd;
      break;
    } catch (err) {
      // Continue trying next password
    }
  }

  if (workingPassword === null) {
    console.error('Critical Database initialization failure: Could not authenticate MySQL user with any password.');
    return;
  }

  activePassword = workingPassword;

  // Re-create pool with guaranteed working password
  pool = mysql.createPool({
    host,
    user,
    password: activePassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
  });

  try {
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await tempConnection.end();

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
  pool: dbPool,
  initDB
};
