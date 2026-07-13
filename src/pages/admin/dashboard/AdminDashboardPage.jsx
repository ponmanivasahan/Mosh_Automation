import AppShell from '../../../components/AppShell';
import { getEstimations, getNotifications, getOrders, getProducts } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import './AdminDashboardPage.css';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Add/Delete Products' },
  { to: '/admin/billing', label: 'Estimation Billing' },
  { to: '/admin/estimations', label: 'Customer Estimations' },
  { to: '/admin/notifications', label: 'Notifications' }
];

const AdminDashboardPage = () => {
  const products = getProducts();
  const estimations = getEstimations();
  const orders = getOrders();
  const notifications = getNotifications();

  const unread = notifications.filter((note) => !note.read).length;
  const totalRevenue = orders.reduce((acc, order) => acc + Number(order.total || 0), 0);

  return (
    <AppShell title="Admin Dashboard" links={adminLinks}>
      <section className="grid stats admin-dashboard-page">
        <article className="stat-card">
          <p>Products</p>
          <h2>{products.length}</h2>
        </article>
        <article className="stat-card">
          <p>Total Estimations</p>
          <h2>{estimations.length}</h2>
        </article>
        <article className="stat-card">
          <p>Total Orders</p>
          <h2>{orders.length}</h2>
        </article>
        <article className="stat-card">
          <p>Unread Notifications</p>
          <h2>{unread}</h2>
        </article>
        <article className="stat-card wide">
          <p>Overall Progress Revenue</p>
          <h2>{formatCurrency(totalRevenue)}</h2>
        </article>
      </section>

      <section className="panel">
        <h2>Recent Orders</h2>
        {!orders.length && <p>No orders yet.</p>}

        <div className="stack">
          {orders.slice(0, 8).map((order) => (
            <article className="row-card" key={order.id}>
              <div>
                <h3>{order.customerName}</h3>
                <p>{order.customerPhone}</p>
                <p>{formatDateTime(order.createdAt)}</p>
              </div>
              <strong>{formatCurrency(order.total)}</strong>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default AdminDashboardPage;
