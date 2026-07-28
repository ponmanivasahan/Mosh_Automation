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
    return res.status(500).json({ success: false, message: 'Failed to retrieve billing settings.', error: error.message });
  }
};

const updateBillingSettings = async (req, res) => {
  try {
    const { floatSensorFee, wireCostPerMeter, InstallationRate, taxRate, miscellaneousFee, notes } = req.body;

    await pool.query(
      'UPDATE billing_settings SET float_sensor_fee = ?, wire_cost_per_meter = ?, base_installation_rate = ?, tax_rate = ?, miscellaneous_fee = ?, notes = ? WHERE id = 1',
      [floatSensorFee, wireCostPerMeter, InstallationRate, taxRate, miscellaneousFee, notes || '']
    );

    return res.json({ success: true, message: 'Billing settings updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update billing settings.', error: error.message });
  }
};

module.exports = {
  getBillingSettings,
  updateBillingSettings
};
