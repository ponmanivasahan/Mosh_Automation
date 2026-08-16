const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const url = require('url');
require('dotenv').config();

// Parse initial database connection configuration
const dbUrl = process.env.DATABASE_URL || process.env.JAWSDB_URL || process.env.CLEARDB_DATABASE_URL || process.env.MYSQL_URL;

const rawHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
const rawPort = process.env.DB_PORT || process.env.MYSQLPORT || '3306';
const rawUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const rawPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'tonystark';
const rawDatabase = process.env.DB_NAME || process.env.MYSQLDATABASE || 'mosh_automation';

let connectionConfig = {
  host: rawHost,
  port: Number(rawPort) || 3306,
  user: rawUser,
  password: rawPassword,
  database: rawDatabase,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

if (rawHost !== 'localhost' && rawHost !== '127.0.0.1') {
  connectionConfig.ssl = {
    rejectUnauthorized: false
  };
}

if (dbUrl) {
  try {
    const parsedUrl = url.parse(dbUrl);
    const [username, password] = (parsedUrl.auth || '').split(':');
    connectionConfig = {
      host: parsedUrl.hostname,
      port: parsedUrl.port || 3306,
      user: username,
      password: password || '',
      database: (parsedUrl.pathname || '').replace('/', ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      ssl: {
        rejectUnauthorized: false
      }
    };
    console.log(`Initial pool parsed DATABASE_URL successfully: host=${connectionConfig.host}`);
  } catch (err) {
    console.error('Failed to parse database connection URL during pool initialization:', err.message);
  }
} else if (connectionConfig.host && connectionConfig.host !== 'localhost' && connectionConfig.host !== '127.0.0.1') {
  connectionConfig.ssl = { rejectUnauthorized: false };
}

// Create initial pool
let pool = mysql.createPool(connectionConfig);

// Helper proxy object so exports always use the active pool instance
const dbPool = {
  query: (...args) => pool.query(...args),
  execute: (...args) => pool.execute(...args),
  getConnection: () => pool.getConnection()
};

// Automatically initialize database schema and seeds
const initDB = async () => {
  const dbUrl = process.env.DATABASE_URL || process.env.JAWSDB_URL || process.env.CLEARDB_DATABASE_URL || process.env.MYSQL_URL;
  
  let config = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'tonystark',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'mosh_automation',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
  };

  let isUrlUsed = false;

  if (dbUrl) {
    try {
      const parsedUrl = url.parse(dbUrl);
      const [username, password] = (parsedUrl.auth || '').split(':');
      config = {
        host: parsedUrl.hostname,
        port: parsedUrl.port || 3306,
        user: username,
        password: password || '',
        database: (parsedUrl.pathname || '').replace('/', ''),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        multipleStatements: true,
        ssl: {
          rejectUnauthorized: false
        }
      };
      isUrlUsed = true;
    } catch (err) {
      console.error('Failed to parse database connection URL in initDB:', err.message);
    }
  } else if (config.host && config.host !== 'localhost' && config.host !== '127.0.0.1') {
    config.ssl = { rejectUnauthorized: false };
  }

  const isRemote = config.host !== 'localhost' && config.host !== '127.0.0.1';
  let workingPassword = null;
  let tempConnection = null;

  if (isUrlUsed || isRemote) {
    // Connect directly to remote server - do not guess local developer passwords
    try {
      tempConnection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: {
          rejectUnauthorized: false
        }
      });
      console.log(`Successfully opened connection to remote database host ${config.host} with database ${config.database}.`);
    } catch (err) {
      console.error(`Critical Database connection failure for remote host ${config.host}:`, err.message);
      console.error('Please configure your database environment variables on Render.');
      return;
    }
  } else {
    // Local fallback password loop detection for localhost development
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

    for (const pwd of candidatePasswords) {
      try {
        tempConnection = await mysql.createConnection({
          host: config.host,
          user: config.user,
          password: pwd
        });
        workingPassword = pwd;
        break;
      } catch (err) {
        // Continue
      }
    }

    if (workingPassword === null) {
      console.error('Critical Database initialization failure: Could not authenticate MySQL user with any password.');
      return;
    }
    config.password = workingPassword;
  }

  // Re-create pool with guaranteed working config
  pool = mysql.createPool(config);

  try {
    if (!isUrlUsed && !isRemote) {
      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
    }
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
        console.log("Migration SUCCESS: Added 'payment_status' to orders.");
      } catch(e){
        console.log("Migration INFO (payment_status):", e.message);
      }
      try {
        await connection.query("ALTER TABLE orders ADD COLUMN transaction_id VARCHAR(100) DEFAULT NULL;");
        console.log("Migration SUCCESS: Added 'transaction_id' to orders.");
      } catch(e){
        console.log("Migration INFO (transaction_id):", e.message);
      }
      try {
        await connection.query("ALTER TABLE orders ADD COLUMN payment_time TIMESTAMP NULL DEFAULT NULL;");
        console.log("Migration SUCCESS: Added 'payment_time' to orders.");
      } catch(e){
        console.log("Migration INFO (payment_time):", e.message);
      }
      try {
        await connection.query("ALTER TABLE orders MODIFY COLUMN status ENUM('Processing', 'Paid', 'Dispatched', 'Completed', 'Cancelled') DEFAULT 'Processing';");
        console.log("Migration SUCCESS: Modified 'status' ENUM in orders.");
      } catch(e){
        console.log("Migration INFO (status ENUM):", e.message);
      }
      try {
        await connection.query("ALTER TABLE users ADD COLUMN logged_in_at TIMESTAMP NULL DEFAULT NULL;");
        console.log("Migration SUCCESS: Added 'logged_in_at' to users.");
      } catch(e){
        console.log("Migration INFO (logged_in_at):", e.message);
      }
      try {
        await connection.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL;");
        console.log("Migration SUCCESS: Added 'email' to users.");
      } catch(e){
        console.log("Migration INFO (email):", e.message);
      }
      try {
        await connection.query("ALTER TABLE users ADD COLUMN status ENUM('Active', 'Inactive') DEFAULT 'Active';");
        console.log("Migration SUCCESS: Added 'status' to users.");
      } catch(e){
        console.log("Migration INFO (status):", e.message);
      }
      try {
        await connection.query("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;");
        console.log("Migration SUCCESS: Added 'updated_at' to users.");
      } catch(e){
        console.log("Migration INFO (updated_at):", e.message);
      }
      try {
        await connection.query("ALTER TABLE stories MODIFY COLUMN image LONGTEXT NOT NULL;");
        console.log("Migration SUCCESS: Modified 'image' column to LONGTEXT in stories.");
      } catch(e){
        console.log("Migration INFO (stories image column):", e.message);
      }
      try {
        await connection.query("ALTER TABLE products MODIFY COLUMN image LONGTEXT NOT NULL;");
        console.log("Migration SUCCESS: Modified 'image' column to LONGTEXT in products.");
      } catch(e){
        console.log("Migration INFO (products image column):", e.message);
      }
      try {
        await connection.query("CREATE TABLE IF NOT EXISTS cart (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        console.log("Migration SUCCESS: Created 'cart' table.");
      } catch(e) {
        console.log("Migration INFO (cart table):", e.message);
      }
      try {
        await connection.query("CREATE TABLE IF NOT EXISTS cart_items (id INT AUTO_INCREMENT PRIMARY KEY, cart_id INT NOT NULL, product_id VARCHAR(50) NOT NULL, quantity INT NOT NULL DEFAULT 1, FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, UNIQUE KEY unique_cart_product (cart_id, product_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        console.log("Migration SUCCESS: Created 'cart_items' table.");
      } catch(e) {
        console.log("Migration INFO (cart_items table):", e.message);
      }

      // Add customer_id columns and foreign key constraints
      try {
        await connection.query("ALTER TABLE orders ADD COLUMN customer_id INT DEFAULT NULL;");
        console.log("Migration SUCCESS: Added 'customer_id' column to orders.");
      } catch(e){
        console.log("Migration INFO (orders customer_id column):", e.message);
      }
      try {
        await connection.query("ALTER TABLE orders ADD CONSTRAINT fk_orders_customer_id FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL;");
        console.log("Migration SUCCESS: Added 'fk_orders_customer_id' constraint to orders.");
      } catch(e){
        console.log("Migration INFO (orders fk_orders_customer_id constraint):", e.message);
      }

      try {
        await connection.query("ALTER TABLE estimations ADD COLUMN customer_id INT DEFAULT NULL;");
        console.log("Migration SUCCESS: Added 'customer_id' column to estimations.");
      } catch(e){
        console.log("Migration INFO (estimations customer_id column):", e.message);
      }
      try {
        await connection.query("ALTER TABLE estimations ADD CONSTRAINT fk_estimations_customer_id FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL;");
        console.log("Migration SUCCESS: Added 'fk_estimations_customer_id' constraint to estimations.");
      } catch(e){
        console.log("Migration INFO (estimations fk_estimations_customer_id constraint):", e.message);
      }

      try {
        await connection.query("ALTER TABLE reviews ADD COLUMN customer_id INT DEFAULT NULL;");
        console.log("Migration SUCCESS: Added 'customer_id' column to reviews.");
      } catch(e){
        console.log("Migration INFO (reviews customer_id column):", e.message);
      }
      try {
        await connection.query("ALTER TABLE reviews ADD CONSTRAINT fk_reviews_customer_id FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL;");
        console.log("Migration SUCCESS: Added 'fk_reviews_customer_id' constraint to reviews.");
      } catch(e){
        console.log("Migration INFO (reviews fk_reviews_customer_id constraint):", e.message);
      }

      // Sync existing records with their corresponding user ID
      try {
        await connection.query("UPDATE orders o JOIN users u ON o.user_phone = u.phone SET o.customer_id = u.id WHERE o.customer_id IS NULL;");
        await connection.query("UPDATE estimations e JOIN users u ON e.customer_phone = u.phone SET e.customer_id = u.id WHERE e.customer_id IS NULL;");
        await connection.query("UPDATE reviews r JOIN users u ON r.customer_phone = u.phone SET r.customer_id = u.id WHERE r.customer_id IS NULL;");
        console.log("Migration SUCCESS: Synced existing orders/estimations/reviews with user ids.");
      } catch(e) {
        console.log("Migration INFO (syncing user ids):", e.message);
      }

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
