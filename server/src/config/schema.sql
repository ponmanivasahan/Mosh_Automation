-- Mosh Automation MySQL Schema
-- Creates and configures the database tables

CREATE DATABASE IF NOT EXISTS mosh_automation;
USE mosh_automation;

-- 1. Users Table (Administrators and Customers)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') DEFAULT 'customer',
  logged_in_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Products Table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(255) NOT NULL,
  float_fee DECIMAL(10, 2) DEFAULT 0.00,
  wire_base_fee DECIMAL(10, 2) DEFAULT 0.00,
  wire_base_meters INT DEFAULT 0,
  wire_extra_per_meter DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Billing Settings Table (One row only)
CREATE TABLE IF NOT EXISTS billing_settings (
  id INT PRIMARY KEY DEFAULT 1,
  float_sensor_fee DECIMAL(10, 2) NOT NULL,
  wire_cost_per_meter DECIMAL(10, 2) NOT NULL,
  base_installation_rate DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL,
  miscellaneous_fee DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  user_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('Processing', 'Paid', 'Dispatched', 'Completed', 'Cancelled') DEFAULT 'Processing',
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_pincode VARCHAR(20) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
  transaction_id VARCHAR(100) DEFAULT NULL,
  payment_time TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_phone) REFERENCES users(phone) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Estimations Table (Queries / Inquiries)
CREATE TABLE IF NOT EXISTS estimations (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  selected_product_id VARCHAR(50) NOT NULL,
  query_details TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (selected_product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  featured BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMP NULL DEFAULT NULL,
  admin_reply TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Success Stories Table
CREATE TABLE IF NOT EXISTS stories (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) NOT NULL,
  youtube_url VARCHAR(255) DEFAULT '',
  instagram_url VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  order_id VARCHAR(50) DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- -- SEED DATA SECTION
-- -- ==========================================

-- -- Seed Admin User (phone: '0987654321', password: 'adminpassword', role: 'admin')
-- -- Bcrypt Hash of 'adminpassword': $2a$12$K.Fw6cEXQ1w7vQJ/M/gHbeVexYFqRscN06mKzF6i608JzWwW39pM2
-- INSERT INTO users (name, phone, password_hash, role)
-- VALUES ('System Admin', '0987654321', '$2a$12$K.Fw6cEXQ1w7vQJ/M/gHbeVexYFqRscN06mKzF6i608JzWwW39pM2', 'admin')
-- ON DUPLICATE KEY UPDATE name=name;

-- -- Seed Billing Defaults
-- INSERT INTO billing_settings (id, float_sensor_fee, wire_cost_per_meter, base_installation_rate, tax_rate, miscellaneous_fee, notes)
-- VALUES (1, 1000.00, 45.00, 1500.00, 18.00, 1000.00, 'Standard billing defaults for estimation calculations.')
-- ON DUPLICATE KEY UPDATE id=id;

-- -- Seed Default Products
--   INSERT INTO products (id, name, description, price, image, float_fee, wire_base_fee, wire_base_meters, wire_extra_per_meter) VALUES
--   ('p-1', 'Auto Change Water Level Controller', 'Automatic tank control with smart water level switching and overflow protection.', 3200.00, '/Auto_Change_WaterLevel_Controller.png', 150.00, 300.00, 30, 10.00),
--   ('p-2', 'Double Tank Fully Automated', 'Dual tank automation for dependable water transfer and monitoring.', 4800.00, '/Dobule_Tank_FullyAutomated.png', 200.00, 350.00, 30, 12.00),
--   ('p-3', 'Wireless Tank Module', 'Remote tank module for connected water level tracking and control.', 2700.00, '/Wireless_Controller-Tank_Module.png', 0.00, 250.00, 30, 8.00),
--   ('p-4', 'GSM Based On-Off with Dry Run', 'GSM enabled automation with dry run protection for safer operation.', 3900.00, '/GSM_Based_On-Off_With_Dry-run.png', 0.00, 300.00, 30, 10.00),
--   ('p-5', 'Wireless Controller Base Module', 'Base unit for wireless control and tank management automation.', 2500.00, '/Wireless_Controller-Base_Module.png', 100.00, 300.00, 30, 10.00),
--   ('p-6', 'Water Level Sensors', 'Precision sensors for accurate water level monitoring and alerts.', 1800.00, '/Water_Level_Sensors.png', 80.00, 200.00, 30, 6.00),
--   ('p-7', 'Water Level Controller With Timer', 'Timer-based controller for scheduled water management.', 2900.00, '/Water_LevelController_With_Timer.png', 120.00, 300.00, 30, 10.00),
--   ('p-8', 'Three Phase Fully Automatic Controller', 'Heavy-duty automation controller for three-phase systems.', 5400.00, '/Three_Phase_Fully_Automatic_Controller.png', 0.00, 400.00, 30, 15.00),
--   ('p-9', 'Three Phase Dry Run Preventer', 'Protective dry run preventer for three-phase pump safety.', 4300.00, '/Three_Phase_Dry_Run_Preventer.png', 0.00, 350.00, 30, 12.00),
--   ('p-10', 'Single Phase Water Controller With Dry Run', 'Single-phase automation with built-in dry run protection.', 3600.00, '/Single_Phase_Water_Controller_With_Dry_Run.png', 0.00, 300.00, 30, 10.00),
--   ('p-11', 'Single Phase Fully Automatic Controller', 'Compact automatic controller for single-phase water systems.', 3400.00, '/Single_Phase_Fully_Automatic_Controller.png', 80.00, 300.00, 30, 10.00),
--   ('p-12', 'Single Phase Controller Above 1.5HP', 'Controller designed for higher-load single-phase pump setups.', 4100.00, '/Single_Phase_Controller_Above-1.5HP.png', 0.00, 350.00, 30, 12.00),
--   ('p-13', 'GSM Based On-Off', 'Remote GSM switching controller for flexible water management.', 3100.00, '/GSM_Based_On-Off.png', 0.00, 300.00, 30, 10.00),
--   ('p-14', 'Float Switch', 'Durable float switch for simple and reliable level detection.', 1200.00, '/Float_Switch.png', 400.00, 150.00, 30, 5.00)
--   ON DUPLICATE KEY UPDATE name=name;
