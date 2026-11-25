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
import Tabs from '../../../components/ui/Tabs';
import Pagination from '../../../components/ui/Pagination';
import { adminLinks } from '../../../utils/customerLinks';
import { getNotifications, getOrders, markAllNotificationsRead, markNotificationRead, deleteNotification as deleteNotificationApi } from '../../../utils/storage';
import { formatDateTime } from '../../../utils/format';
import './AdminNotificationsPage.css';

const PAGE_SIZE = 9;

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState(() => getNotifications());
  const [orders, setOrders] = useState(() => getOrders());
  const [filter, setFilter] = useState('All'); // All, Unread, Read
  const [currentPage, setCurrentPage] = useState(1);

  // Live polling for notifications updates from customers
  useEffect(() => {
    const fetchLatest = () => {
      setNotifications(getNotifications());
      setOrders(getOrders());
    };
    const interval = setInterval(fetchLatest, 1500);
    window.addEventListener('storage', fetchLatest);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchLatest);
    };
  }, []);

  const ordersById = useMemo(() => {
    const map = {};
    for (const o of orders) {
      if (o?.id) map[o.id] = o;
    }
    return map;
  }, [orders]);

  const formatMessage = (item) => {
    const msg = item?.message || '';
    const match = msg.match(/Order #([a-zA-Z0-9_-]+)/);
    const orderId = match?.[1] || item?.relatedId || item?.orderId;
    if (match && orderId) {
      const ord = ordersById[orderId];
      const label = ord?.customerName
        ? `${ord.customerName}${ord.customerPhone ? ` (${ord.customerPhone})` : ''}`
        : (ord?.customerPhone || 'Customer');
      return msg.replace(/Order #[a-zA-Z0-9_-]+/, `Order for ${label}`);
    }
    return msg;
  };

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
    if (t.includes('order')) return <ShoppingBag className="text-blue-600" size={18} />;
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

        {/* Aligned Filter Tabs */}
        <div className="mb-4">
          <Tabs
            tabs={[
              { id: 'All', label: 'All Alerts', count: notifications.length },
              { id: 'Unread', label: 'Unread', count: notifications.filter((n) => !n.read).length },
              { id: 'Read', label: 'Archived / Read', count: notifications.filter((n) => n.read).length }
            ]}
            activeTab={filter}
            onChange={setFilter}
            size="sm"
          />
        </div>

        {/* Notification Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          <AnimatePresence initial={false}>
            {filteredNotifications.slice((Math.min(currentPage, Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE))) - 1) * PAGE_SIZE, Math.min(currentPage, Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE))) * PAGE_SIZE).map((item) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={() => !item.read && markSingleRead(item.id)}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer bg-white ${
 item.read
 ? 'border-slate-200/80 opacity-85 hover:opacity-100'
 : 'border-blue-300 ring-1 ring-blue-100 '
 }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        {getNotificationIcon(item.title)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{item.title}</h3>
                          {!item.read && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!item.read && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); markSingleRead(item.id); }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition"
                          title="Mark read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => deleteNotification(item.id, e)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 transition"
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{formatMessage(item)}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {formatDateTime(item.createdAt)}
                  </span>
                  <span className={`font-semibold uppercase text-[10px] px-2 py-0.5 rounded-full ${
 item.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'
 }`}>
                    {item.read ? 'Read' : 'New'}
                  </span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        <Pagination
          currentPage={Math.min(currentPage, Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE)))}
          totalItems={filteredNotifications.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />

        {filteredNotifications.length === 0 && (
          <div className="empty-notifications-state">
            <Inbox size={48} className="text-slate-300" />
            <h3>All Quiet Here</h3>
            <p>No notifications match the selected filter at this moment.</p>
          </div>
        )}

      </section>
    </AppShell>
  );
};

export default AdminNotificationsPage;
