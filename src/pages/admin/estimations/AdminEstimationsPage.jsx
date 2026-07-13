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
  const estimations = getEstimations();

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
