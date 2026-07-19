import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  TrendingUp,
  ShoppingCart,
  CheckCircle,
  Users,
  MessageSquare,
  RefreshCw,
  MapPin,
  X,
  Star,
  FileText
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import {
  getProducts,
  getOrders,
  getReviews,
  updateOrder
} from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import './AdminDashboardPage.css';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Product Management' },
  { to: '/admin/billing', label: 'Query Management' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/stories', label: 'Success Stories' }
];

const AdminDashboardPage = () => {
  const [products, setProducts] = useState(() => getProducts());
  const [orders, setOrders] = useState(() => getOrders());
  const [reviews, setReviews] = useState(() => getReviews());
  const [activeModalType, setActiveModalType] = useState(null);

  // Live Syncing feed
  useEffect(() => {
    const fetchLatest = () => {
      setProducts(getProducts());
      setOrders(getOrders());
      setReviews(getReviews());
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 1500);
    window.addEventListener('storage', fetchLatest);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchLatest);
    };
  }, []);

  // Total Revenue (excl. cancelled orders)
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((acc, order) => acc + Number(order.total || 0), 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Placed' || o.status === 'Processing').length;
  }, [orders]);

  const completedOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Dispatched' || o.status === 'Completed').length;
  }, [orders]);

  const totalCustomers = useMemo(() => {
    const uniquePhones = new Set(orders.map(o => o.customerPhone));
    return uniquePhones.size;
  }, [orders]);

  // Order status modification handler
  const handleStatusChange = (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    const updated = { ...targetOrder, status: newStatus };
    updateOrder(updated);
    setOrders(getOrders());
  };

  // Extract unique customers list for modal
  const customersList = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      if (o.customerPhone && !map.has(o.customerPhone)) {
        map.set(o.customerPhone, {
          name: o.customerName || 'Customer',
          phone: o.customerPhone,
          city: o.shippingAddress?.city || 'Coimbatore',
          ordersCount: orders.filter(x => x.customerPhone === o.customerPhone).length
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  return (
    <AppShell title="Admin Portal Control Dashboard" links={adminLinks}>
      <div className="admin-dashboard-page space-y-8">
        
        {/* Top Header Overview Panel */}
        <header className="admin-topbar panel flex justify-between items-center bg-slate-100 p-6 rounded-lg border border-slate-200">
          <div>
            <p className="dashboard-eyebrow text-teal-700 uppercase tracking-wider text-[10px] font-bold">HQ Systems Control</p>
            <h2 className="text-2xl font-bold text-slate-800">Admin Portal Overview</h2>
            <p className="text-xs text-slate-500 mt-1">Real-time telemetry tracking client orders, products catalog status, and customer reviews.</p>
          </div>
          <div className="admin-topbar-chip flex items-center gap-2 bg-white text-teal-700 px-4 py-2 rounded-xl border shadow-sm">
            <RefreshCw size={14} className="animate-spin text-teal-600" />
            <strong className="text-xs font-bold">Live Sync Active</strong>
          </div>
        </header>

        {/* Dynamic Metric Cards Grid */}
        <section className="admin-metrics-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
          {/* Card 1: Total Products */}
          <motion.article
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setActiveModalType('products')}
            className="metric-card bg-slate-100 border p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Total Products</p>
              <Package size={16} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-3">{products.length}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Click to view items</span>
          </motion.article>

          {/* Card 2: Active Orders */}
          <motion.article
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setActiveModalType('active-orders')}
            className="metric-card bg-slate-100 border p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Active Orders</p>
              <ShoppingCart size={16} className="text-amber-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-3">{activeOrdersCount}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Placed & Processing</span>
          </motion.article>

          {/* Card 3: Completed Orders */}
          <motion.article
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setActiveModalType('completed-orders')}
            className="metric-card bg-slate-100 border p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Completed</p>
              <CheckCircle size={16} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-3">{completedOrdersCount}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Dispatched orders</span>
          </motion.article>

          {/* Card 4: Total Customers */}
          <motion.article
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setActiveModalType('customers')}
            className="metric-card bg-slate-100 border p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Customers</p>
              <Users size={16} className="text-indigo-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-indigo-600 mt-3">{totalCustomers}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Registered clients</span>
          </motion.article>

          {/* Card 5: Total Reviews */}
          <motion.article
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setActiveModalType('reviews')}
            className="metric-card bg-slate-100 border p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Total Reviews</p>
              <MessageSquare size={16} className="text-teal-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-teal-600 mt-3">{reviews.length}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Feedback counts</span>
          </motion.article>

          {/* Card 6: Total Revenue */}
          <motion.article
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setActiveModalType('revenue')}
            className="metric-card bg-slate-100 border p-5 rounded-lg flex flex-col justify-between cursor-pointer hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Total Revenue</p>
              <TrendingUp size={16} className="text-pink-500" />
            </div>
            <h3 className="text-xl font-extrabold text-pink-600 mt-3 truncate">{formatCurrency(totalRevenue)}</h3>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Excl. cancelled</span>
          </motion.article>
        </section>

        {/* Recent Orders - Live management list */}
        <section className="panel bg-slate-100 border p-6 rounded-lg">
          <div className="panel-head flex justify-between items-center mb-6">
            <div>
              <p className="dashboard-eyebrow text-teal-700 uppercase tracking-wider text-[10px] font-bold">Client operations</p>
              <h2 className="text-lg font-bold text-slate-800">Manage Recent Orders</h2>
            </div>
          </div>

          {!orders.length ? (
            <p className="text-xs text-slate-400 py-6 italic text-center">No client orders placed yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.slice(0, 6).map((order) => (
                <article key={order.id} className="border border-slate-200 p-5 rounded-lg bg-white flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition duration-300">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{order.customerName}</h3>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                        order.status === 'Dispatched' ? 'bg-teal-50 text-teal-600' :
                        order.status === 'Processing' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold mt-1">Phone: {order.customerPhone}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">ID: #{order.id} · {formatDateTime(order.createdAt)}</p>
                    {order.paymentMethod && (
                      <p className="text-[10px] text-teal-600 mt-1 font-bold">Paid via: {order.paymentMethod}</p>
                    )}

                    {order.shippingAddress && (
                      <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-1.5 font-bold">
                        <MapPin size={12} className="text-teal-600" />
                        <span className="truncate">Deliver: {order.shippingAddress.city}</span>
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {order.items?.map((it, idx) => (
                        <span key={idx} className="text-[9px] bg-slate-50 border px-2 py-0.5 rounded-md text-slate-600 font-bold">
                          {it.name} (x{it.quantity})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Total Amount</span>
                      <strong className="text-base font-extrabold text-teal-600">{formatCurrency(order.total)}</strong>
                    </div>

                    {order.status !== 'Cancelled' && (
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'Processing')}
                          disabled={order.status === 'Processing'}
                          className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 py-1.5 rounded-lg font-bold hover:bg-indigo-100 disabled:opacity-50"
                        >
                          Process
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'Dispatched')}
                          disabled={order.status === 'Dispatched'}
                          className="text-[9px] bg-teal-50 border border-teal-200 text-teal-700 py-1.5 rounded-lg font-bold hover:bg-teal-100 disabled:opacity-50"
                        >
                          Dispatch
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'Cancelled')}
                          className="text-[9px] bg-rose-50 border border-rose-200 text-rose-700 py-1.5 rounded-lg font-bold hover:bg-rose-100"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Clickable Details Modals Overlay */}
        <AnimatePresence>
          {activeModalType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg max-w-3xl w-full p-6 shadow-2xl border flex flex-col space-y-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="badge-kicker text-teal-600 font-bold uppercase tracking-wider text-[10px]">HQ Control Portal</span>
                    <h2 className="text-xl font-bold text-slate-800 capitalize">{activeModalType.replace('-', ' ')} Summary</h2>
                  </div>
                  <button onClick={() => setActiveModalType(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                {/* Modal Contents based on type */}
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  
                  {/* Products Details Modal */}
                  {activeModalType === 'products' && (
                    <div className="space-y-3">
                      {products.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
                          <img src={p.image} alt={p.name} className="w-10 h-10 object-contain bg-white rounded border p-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold">{p.category || 'Automation'}</p>
                          </div>
                          <strong className="text-xs text-teal-600">{formatCurrency(p.price)}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active Orders Details Modal */}
                  {activeModalType === 'active-orders' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'Placed' || o.status === 'Processing').map(o => (
                        <div key={o.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-slate-800">{o.customerName} ({o.customerPhone})</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">ID: #{o.id} · {formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold uppercase mb-1">{o.status}</span>
                            <strong className="block text-teal-700">{formatCurrency(o.total)}</strong>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'Placed' || o.status === 'Processing').length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No active orders.</p>
                      )}
                    </div>
                  )}

                  {/* Completed Orders Details Modal */}
                  {activeModalType === 'completed-orders' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'Dispatched' || o.status === 'Completed').map(o => (
                        <div key={o.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-slate-800">{o.customerName} ({o.customerPhone})</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">ID: #{o.id} · {formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase mb-1">{o.status}</span>
                            <strong className="block text-teal-700">{formatCurrency(o.total)}</strong>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'Dispatched' || o.status === 'Completed').length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No completed orders.</p>
                      )}
                    </div>
                  )}

                  {/* Customers Details Modal */}
                  {activeModalType === 'customers' && (
                    <div className="space-y-3">
                      {customersList.map(c => (
                        <div key={c.phone} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-slate-800">{c.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Phone: {c.phone} · City: {c.city}</p>
                          </div>
                          <span className="bg-slate-200 px-2.5 py-1 rounded-lg text-slate-600 font-bold text-[10px]">
                            {c.ordersCount} orders placed
                          </span>
                        </div>
                      ))}
                      {customersList.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No customers registered.</p>
                      )}
                    </div>
                  )}

                  {/* Reviews Details Modal */}
                  {activeModalType === 'reviews' && (
                    <div className="space-y-3">
                      {reviews.map(r => (
                        <div key={r.id} className="p-3 border rounded-lg bg-slate-50 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-slate-800">{r.customerName}</h4>
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: r.rating || 5 }).map((_, i) => (
                                <Star key={i} size={11} fill="currentColor" />
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-teal-600 font-bold">Product: {r.productName}</p>
                          <p className="text-slate-600 italic font-semibold">"{r.comment || r.review}"</p>
                        </div>
                      ))}
                      {reviews.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No customer reviews yet.</p>
                      )}
                    </div>
                  )}

                  {/* Revenue / Transaction Details Modal */}
                  {activeModalType === 'revenue' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status !== 'Cancelled').map(o => (
                        <div key={o.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-slate-800">Order ID: #{o.id}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">By: {o.customerName} · {formatDateTime(o.createdAt)}</p>
                          </div>
                          <strong className="text-emerald-600 font-bold">{formatCurrency(o.total)}</strong>
                        </div>
                      ))}
                      {orders.filter(o => o.status !== 'Cancelled').length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No revenues captured yet.</p>
                      )}
                    </div>
                  )}

                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setActiveModalType(null)}
                    className="bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-900 transition"
                  >
                    Close Panel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AppShell>
  );
};

export default AdminDashboardPage;
