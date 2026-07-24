import { useState, useEffect } from 'react';
import AppShell from '../../../components/AppShell';
import { getEstimations } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import './AdminEstimationsPage.css';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Add/Delete Products' },
  { to: '/admin/billing', label: 'Estimation Billing' },
  { to: '/admin/estimations', label: 'Customer Estimations' },
  { to: '/admin/notifications', label: 'Notifications' }
];

const AdminEstimationsPage = () => {
  const [estimations, setEstimations] = useState(() => getEstimations());

  useEffect(() => {
    const fetchLatest = () => {
      const ests = getEstimations();
      setEstimations(ests);

      // Auto mark estimations as seen when viewed by admin
      let updatedAny = false;
      const updated = ests.map((e) => {
        if (!e.seen) {
          updatedAny = true;
          return { ...e, seen: true };
        }
        return e;
      });
      if (updatedAny) {
        localStorage.setItem('mosh_estimations', JSON.stringify(updated));
      }
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 1500);
    window.addEventListener('storage', fetchLatest);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchLatest);
    };
  }, []);

  return (
    <AppShell title="Customer Estimation Records" links={adminLinks}>
      <section className="panel admin-estimations-page">
        <h2>Estimation Requests (With Name And Phone)</h2>
        {!estimations.length && <p>No estimation records yet.</p>}

        <div className="stack">
          {estimations.map((item) => (
            <article className="row-card" key={item.id}>
              <div>
                <h3>{item.customerName}</h3>
                <p>{item.customerPhone}</p>
                <p>
                  Product: {item.productName} | Qty: {item.quantity} | Complexity: {item.complexity}
                </p>
                <p>
                  Stage: <strong>{item.stage}</strong>
                </p>
                <p>{formatDateTime(item.createdAt)}</p>
              </div>
              <strong>{formatCurrency(item.total)}</strong>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default AdminEstimationsPage;
