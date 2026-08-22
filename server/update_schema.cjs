const fs = require('fs');
const schemaPath = 'C:/Users/hp/Desktop/Mosh_Automation/server/src/config/schema.sql';
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

const invoiceSql = `
-- --------------------------------------------------------
-- Table structure for table \`invoices\`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS \`invoices\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`invoice_number\` INT NOT NULL AUTO_INCREMENT,
  \`order_id\` VARCHAR(50) DEFAULT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`customer_address\` TEXT NOT NULL,
  \`customer_gstin\` VARCHAR(50) DEFAULT NULL,
  \`customer_state\` VARCHAR(100) NOT NULL,
  \`customer_state_code\` VARCHAR(10) NOT NULL,
  \`customer_mobile\` VARCHAR(20) DEFAULT NULL,
  \`invoice_date\` DATE NOT NULL,
  \`invoice_type\` ENUM('Cash', 'Credit Bill') DEFAULT 'Cash',
  \`taxable_value\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`sgst_rate\` DECIMAL(5, 2) DEFAULT 0.00,
  \`sgst_amount\` DECIMAL(12, 2) DEFAULT 0.00,
  \`cgst_rate\` DECIMAL(5, 2) DEFAULT 0.00,
  \`cgst_amount\` DECIMAL(12, 2) DEFAULT 0.00,
  \`igst_rate\` DECIMAL(5, 2) DEFAULT 0.00,
  \`igst_amount\` DECIMAL(12, 2) DEFAULT 0.00,
  \`rounded_off\` DECIMAL(10, 2) DEFAULT 0.00,
  \`grand_total\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`amount_in_words\` TEXT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY \`idx_invoice_number\` (\`invoice_number\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table \`invoice_items\`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS \`invoice_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`invoice_id\` VARCHAR(50) NOT NULL,
  \`product_id\` VARCHAR(50) DEFAULT NULL,
  \`product_name\` VARCHAR(255) NOT NULL,
  \`hsn_code\` VARCHAR(50) DEFAULT NULL,
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`rate\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`amount\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (\`invoice_id\`) REFERENCES \`invoices\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

if (!schemaContent.includes('CREATE TABLE IF NOT EXISTS `invoices`')) {
  fs.appendFileSync(schemaPath, invoiceSql);
  console.log("Added invoices tables to schema.sql");
}
