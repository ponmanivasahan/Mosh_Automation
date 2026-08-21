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
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoices.', error: error.message });
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
      return res.status(400).json({ success: false, message: 'Missing required invoice data.' });
    }

    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO invoices 
      (id, order_id, customer_name, customer_address, customer_gstin, customer_state, customer_state_code, customer_mobile, invoice_date, invoice_type, taxable_value, sgst_rate, sgst_amount, cgst_rate, cgst_amount, igst_rate, igst_amount, rounded_off, grand_total, amount_in_words) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, orderId || null, customerName, customerAddress || '', customerGstin || '', customerState || '', customerStateCode || '', customerMobile || '', invoiceDate, invoiceType || 'Cash', taxableValue || 0, sgstRate || 0, sgstAmount || 0, cgstRate || 0, cgstAmount || 0, igstRate || 0, igstAmount || 0, roundedOff || 0, grandTotal || 0, amountInWords || '']
    );

    for (const item of parsedItems) {
      await connection.query(
        `INSERT INTO invoice_items 
        (invoice_id, product_id, product_name, hsn_code, quantity, rate, amount) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, item.productId || null, item.productName, item.hsnCode || '', item.quantity || 1, item.rate || 0, item.amount || 0]
      );
    }

    await connection.commit();
    return res.status(201).json({ success: true, message: 'Invoice created successfully.' });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ success: false, message: 'Failed to create invoice.', error: error.message });
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
    return res.status(500).json({ success: false, message: 'Failed to delete invoice.', error: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  deleteInvoice
};
