import AppShell from '../components/AppShell';
import { getNotifications, markAllNotificationsRead } from '../utils/storage';
import { formatDateTime } from '../utils/format';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Add/Delete Products' },
  { to: '/admin/billing', label: 'Estimation Billing' },
  { to: '/admin/estimations', label: 'Customer Estimations' },
  { to: '/admin/notifications', label: 'Notifications' }
];

const AdminNotificationsPage = () => {
  const notifications = getNotifications();

  const markRead = () => {
    markAllNotificationsRead();
    window.location.reload();
  };

  return (
    <AppShell title="Admin Notifications" links={adminLinks}>
      <section className="panel">
        <div className="panel-head">
          <h2>Customer Order Notifications</h2>
          <button className="btn btn-outline" type="button" onClick={markRead}>
            Mark All Read
          </button>
        </div>

        {!notifications.length && <p>No notifications yet.</p>}

        <div className="stack">
          {notifications.map((item) => (
            <article className={`row-card ${item.read ? 'faded' : 'highlight'}`} key={item.id}>
              <div>
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                <p>{formatDateTime(item.createdAt)}</p>
              </div>
              <span className="pill">{item.read ? 'Read' : 'New'}</span>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default AdminNotificationsPage;
