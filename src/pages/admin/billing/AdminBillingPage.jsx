import { useState } from 'react';
import AppShell from '../../../components/AppShell';
import { getBillingSettings, setBillingSettings } from '../../../utils/storage';
import './AdminBillingPage.css';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Add/Delete Products' },
  { to: '/admin/billing', label: 'Estimation Billing' },
  { to: '/admin/estimations', label: 'Customer Estimations' },
  { to: '/admin/notifications', label: 'Notifications' }
];

const AdminBillingPage = () => {
  const existing = getBillingSettings();
  const [installationRate, setInstallationRate] = useState(existing.installationRate * 100);
  const [taxRate, setTaxRate] = useState(existing.taxRate * 100);
  const [miscellaneousFee, setMiscellaneousFee] = useState(existing.miscellaneousFee);
  const [notes, setNotes] = useState(existing.notes || '');
  const [message, setMessage] = useState('');

  const save = (event) => {
    event.preventDefault();

    setBillingSettings({
      installationRate: Number(installationRate) / 100,
      taxRate: Number(taxRate) / 100,
      miscellaneousFee: Number(miscellaneousFee),
      notes
    });

    setMessage('Billing settings saved. Customer estimation will now use this configuration.');
  };

  return (
    <AppShell title="Estimation Billing Configuration" links={adminLinks}>
      <section className="panel admin-billing-page">
        <h2>Set Billing Rules</h2>
        <form className="form-grid two-col" onSubmit={save}>
          <label>
            Installation Rate (%)
            <input
              type="number"
              value={installationRate}
              onChange={(e) => setInstallationRate(e.target.value)}
            />
          </label>

          <label>
            Tax Rate (%)
            <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
          </label>

          <label>
            Miscellaneous Fee
            <input
              type="number"
              value={miscellaneousFee}
              onChange={(e) => setMiscellaneousFee(e.target.value)}
            />
          </label>

          <label>
            Notes
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <button className="btn btn-primary" type="submit">
            Save Billing
          </button>
        </form>

        {message && <p className="success-text">{message}</p>}
      </section>
    </AppShell>
  );
};

export default AdminBillingPage;
