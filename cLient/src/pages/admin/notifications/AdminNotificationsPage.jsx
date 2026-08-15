import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckSquare,
  ShoppingBag,
  XCircle,
  FileText,
  Clock,
  Trash2,
  Inbox,
  ArrowRight
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { getNotifications, markAllNotificationsRead, markNotificationRead, deleteNotification as deleteNotificationApi } from '../../../utils/storage';
import { formatDateTime } from '../../../utils/format';
import './AdminNotificationsPage.css';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Add/Delete Products' },
  { to: '/admin/billing', label: 'Estimation Billing' },
  { to: '/admin/estimations', label: 'Customer Estimations' },
  { to: '/admin/notifications', label: 'Notifications' }
];

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState(() => getNotifications());
  const [filter, setFilter] = useState('All'); // All, Unread, Read

  // Live polling for notifications updates from customers
  useEffect(() => {
    const fetchLatest = () => {
      setNotifications(getNotifications());
    };
    const interval = setInterval(fetchLatest, 1500);
    window.addEventListener('storage', fetchLatest);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchLatest);
    };
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === 'Unread') {
      return notifications.filter((n) => !n.read);
    }
    if (filter === 'Read') {
      return notifications.filter((n) => n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const markAllRead = () => {
    markAllNotificationsRead();
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
  };

  const markSingleRead = (id) => {
    markNotificationRead(id);
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation(); // Avoid triggering card click read handler
    deleteNotificationApi(id);
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
  };

  const getNotificationIcon = (title) => {
    const t = title.toLowerCase();
    if (t.includes('cancel')) return <XCircle className="text-rose-500" size={18} />;
    if (t.includes('order')) return <ShoppingBag className="text-teal-600" size={18} />;
    return <FileText className="text-blue-500" size={18} />;
  };

  return (
    <AppShell title="Notifications Center" links={adminLinks}>
      <section className="admin-notifications-container">
        
        {/* Top Header Card */}
        <div className="notifications-header-panel">
          <div className="header-text-col">
            <span className="badge-kicker">Live Alerts Feed</span>
            <h2>System Activity & Notifications</h2>
            <p>Track real-time custom orders, cancellations, and estimates from your customers.</p>
          </div>
          <div className="header-actions">
            <button
              onClick={markAllRead}
              className="btn-mark-all-read"
              type="button"
              disabled={!notifications.some(n => !n.read)}
            >
              <CheckSquare size={16} />
              <span>Mark all as read</span>
            </button>
          </div>
        </div>

        {/* Filter controls and count badge */}
        <div className="filters-bar-wrapper">
          <div className="filters-group">
            {['All', 'Unread', 'Read'].map((type) => {
              const count =
                type === 'All'
                  ? notifications.length
                  : type === 'Unread'
                  ? notifications.filter((n) => !n.read).length
                  : notifications.filter((n) => n.read).length;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilter(type)}
                  className={`filter-tab-btn ${filter === type ? 'active' : ''}`}
                >
                  <span>{type}</span>
                  <span className="count-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notification stack list */}
        <div className="notifications-stack-list">
          <AnimatePresence initial={false}>
            {filteredNotifications.map((item) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                onClick={() => !item.read && markSingleRead(item.id)}
                className={`notification-alert-card ${item.read ? 'status-read' : 'status-unread'}`}
              >
                <div className="alert-badge-icon">
                  {getNotificationIcon(item.title)}
                </div>
                
                <div className="alert-content-col">
                  <div className="alert-title-row">
                    <h3 className="alert-title">{item.title}</h3>
                    {!item.read && <span className="unread-dot-indicator" />}
                  </div>
                  <p className="alert-message">{item.message}</p>
                  
                  <div className="alert-meta-footer">
                    <span className="time-timestamp">
                      <Clock size={12} />
                      {formatDateTime(item.createdAt)}
                    </span>
                    {item.orderId && (
                      <span className="order-id-tag">
                        Ref: #{item.orderId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="alert-actions-col">
                  {!item.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markSingleRead(item.id); }}
                      className="action-circle-btn text-teal-600 hover:bg-teal-50"
                      title="Mark read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => deleteNotification(item.id, e)}
                    className="action-circle-btn text-rose-500 hover:bg-rose-50"
                    title="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>

          {filteredNotifications.length === 0 && (
            <div className="empty-notifications-state">
              <Inbox size={48} className="text-slate-300" />
              <h3>All Quiet Here</h3>
              <p>No notifications match the selected filter at this moment.</p>
            </div>
          )}
        </div>

      </section>
    </AppShell>
  );
};

export default AdminNotificationsPage;
