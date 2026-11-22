const { pool } = require('../config/db');

const getInvoices = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    
    // Fetch items
    const [items] = await pool.query('SELECT * FROM invoice_items');
    
    const itemsByInvoice = {};
    for (const item of items) {
      if (!itemsByInvoice[item.invoice_id]) {
        itemsByInvoice[item.invoice_id] = [];
      }
      itemsByInvoice[item.invoice_id].push(item);
    }

    const formatted = rows.map(inv => ({
      ...inv,
      invoice_type: inv.invoice_type || 'Cash',
      items: itemsByInvoice[inv.id] || []
    }));
    
    return res.json({ success: true, invoices: formatted });
  } catch (error) {
    console.error('getInvoices error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoices.' });
  }
};

const createInvoice = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { 
      id, customerName, customerAddress, customerGstin, customerState, customerStateCode, customerMobile, 
      invoiceDate, invoiceType, taxableValue, sgstRate, sgstAmount, cgstRate, cgstAmount, igstRate, igstAmount, 
      roundedOff, grandTotal, amountInWords, items, orderId 
    } = req.body;

    let parsedItems = items;
    if (typeof items === 'string') {
      try { parsedItems = JSON.parse(items); } catch(e) {}
    }
    
    if (!id || !customerName || !parsedItems || !parsedItems.length) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Missing required invoice data.' });
    }

    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO invoices 
      (id, order_id, customer_name, customer_address, customer_gstin, customer_state, customer_state_code, customer_mobile, invoice_date, invoice_type, taxable_value, sgst_rate, sgst_amount, cgst_rate, cgst_amount, igst_rate, igst_amount, rounded_off, grand_total, amount_in_words) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        orderId || null, 
        String(customerName).slice(0, 100), 
        (customerAddress || '').slice(0, 255), 
        (customerGstin || '').slice(0, 50), 
        (customerState || '').slice(0, 50), 
        (customerStateCode || '').slice(0, 10), 
        (customerMobile || '').slice(0, 20), 
        invoiceDate, 
        invoiceType || 'Cash', 
        Number(taxableValue) || 0, 
        Number(sgstRate) || 0, 
        Number(sgstAmount) || 0, 
        Number(cgstRate) || 0, 
        Number(cgstAmount) || 0, 
        Number(igstRate) || 0, 
        Number(igstAmount) || 0, 
        Number(roundedOff) || 0, 
        Number(grandTotal) || 0, 
        (amountInWords || '').slice(0, 255)
      ]
    );

    for (const item of parsedItems) {
      await connection.query(
        `INSERT INTO invoice_items 
        (invoice_id, product_id, product_name, hsn_code, quantity, rate, amount) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id, 
          item.productId || null, 
          String(item.productName || '').slice(0, 150), 
          (item.hsnCode || '').slice(0, 50), 
          Math.max(1, parseInt(item.quantity, 10) || 1), 
          Number(item.rate) || 0, 
          Number(item.amount) || 0
        ]
      );
    }

    await connection.commit();
    return res.status(201).json({ success: true, message: 'Invoice created successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('createInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create invoice.' });
  } finally {
    connection.release();
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM invoices WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    
    return res.json({ success: true, message: 'Invoice deleted successfully.' });
  } catch (error) {
    console.error('deleteInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete invoice.' });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  deleteInvoice
};
