-- MOSH Automation Database Schema Migration Script
-- Run this script to update existing database tables to the latest version

USE mosh_automation;

-- 1. Update Orders table to support paid tracking and statuses
-- Modifies order status to include the 'Paid' state
ALTER TABLE orders 
  MODIFY COLUMN status ENUM('Processing', 'Paid', 'Dispatched', 'Completed', 'Cancelled') DEFAULT 'Processing';

-- Adds payment status columns if they do not exist
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_time TIMESTAMP NULL DEFAULT NULL;

-- 2. Update Users table to track last login times
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS logged_in_at TIMESTAMP NULL DEFAULT NULL;
