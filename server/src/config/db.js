const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const url = require('url');
require('dotenv').config();

// Parse initial database connection configuration
const dbUrl = process.env.DATABASE_URL || process.env.JAWSDB_URL || process.env.CLEARDB_DATABASE_URL || process.env.MYSQL_URL;

let connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'tonystark',
  database: process.env.DB_NAME || 'mosh_automation',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

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
      multipleStatements: true
    };
    console.log(`Initial pool parsed DATABASE_URL successfully: host=${connectionConfig.host}`);
  } catch (err) {
    console.error('Failed to parse database connection URL during pool initialization:', err.message);
  }
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
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'tonystark',
    database: process.env.DB_NAME || 'mosh_automation',
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
        multipleStatements: true
      };
      isUrlUsed = true;
      console.log(`initDB using DATABASE_URL configuration: host=${config.host}, database=${config.database}`);
    } catch (err) {
      console.error('Failed to parse database connection URL in initDB:', err.message);
    }
  }

  let workingPassword = null;
  let tempConnection = null;

  if (isUrlUsed) {
    try {
      tempConnection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password
      });
      console.log('Successfully opened connection using database connection URL.');
    } catch (err) {
      console.error(`Critical Database connection failure for URL host ${config.host}:`, err.message);
      console.error('Please configure your database credentials or check DATABASE_URL on Render.');
      return;
    }
  } else {
    // Local fallback password loop detection
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
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
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
