const { pool } = require('../config/db');

const getBillingSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM billing_settings WHERE id = 1');
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settings not found.' });
    }
    const s = rows[0];
    const formatted = {
      floatSensorFee: Number(s.float_sensor_fee),
      wireCostPerMeter: Number(s.wire_cost_per_meter),
      InstallationRate: Number(s.base_installation_rate),
      taxRate: Number(s.tax_rate),
      miscellaneousFee: Number(s.miscellaneous_fee),
      notes: s.notes
    };
    return res.json({ success: true, settings: formatted });
  } catch (error) {
    console.error('getBillingSettings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve billing settings.' });
  }
};

const updateBillingSettings = async (req, res) => {
  try {
    const { floatSensorFee, wireCostPerMeter, InstallationRate, taxRate, miscellaneousFee, notes } = req.body;

    await pool.query(
      'UPDATE billing_settings SET float_sensor_fee = ?, wire_cost_per_meter = ?, base_installation_rate = ?, tax_rate = ?, miscellaneous_fee = ?, notes = ? WHERE id = 1',
      [
        Number(floatSensorFee) || 0,
        Number(wireCostPerMeter) || 0,
        Number(InstallationRate) || 0,
        Number(taxRate) || 0,
        Number(miscellaneousFee) || 0,
        (notes || '').slice(0, 1000)
      ]
    );

    return res.json({ success: true, message: 'Billing settings updated successfully.' });
  } catch (error) {
    console.error('updateBillingSettings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update billing settings.' });
  }
};

const createBillingSettings = async (req, res) => {
  try {
    const { floatSensorFee, wireCostPerMeter, InstallationRate, taxRate, miscellaneousFee, notes } = req.body;
    await pool.query(
      `INSERT INTO billing_settings (id, float_sensor_fee, wire_cost_per_meter, base_installation_rate, tax_rate, miscellaneous_fee, notes) 
       VALUES (1, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       float_sensor_fee = VALUES(float_sensor_fee), 
       wire_cost_per_meter = VALUES(wire_cost_per_meter), 
       base_installation_rate = VALUES(base_installation_rate), 
       tax_rate = VALUES(tax_rate), 
       miscellaneous_fee = VALUES(miscellaneous_fee), 
       notes = VALUES(notes)`,
      [
        Number(floatSensorFee) || 1000.00,
        Number(wireCostPerMeter) || 45.00,
        Number(InstallationRate) || 1500.00,
        Number(taxRate) || 18.00,
        Number(miscellaneousFee) || 1000.00,
        (notes || '').slice(0, 1000)
      ]
    );
    return res.status(201).json({ success: true, message: 'Billing settings created/initialized successfully.' });
  } catch (error) {
    console.error('createBillingSettings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create billing settings.' });
  }
};

const deleteBillingSettings = async (req, res) => {
  try {
    await pool.query('DELETE FROM billing_settings WHERE id = 1');
    return res.json({ success: true, message: 'Billing settings deleted successfully.' });
  } catch (error) {
    console.error('deleteBillingSettings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete billing settings.' });
  }
};

module.exports = {
  getBillingSettings,
  updateBillingSettings,
  createBillingSettings,
  deleteBillingSettings
};
