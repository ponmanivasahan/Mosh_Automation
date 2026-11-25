import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CheckCircle,
  Trash2,
  Users,
  TrendingUp,
  RefreshCw,
  MapPin,
  Clock,
  Truck,
  MessageSquare,
  Sparkles,
  Eye,
  X,
  CreditCard,
  Calendar,
  Check
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import Tabs from '../../../components/ui/Tabs';
import Pagination from '../../../components/ui/Pagination';
import DashboardNotificationModal from '../../../components/ui/DashboardNotificationModal';
import { adminLinks } from '../../../utils/customerLinks';
import { getProducts, getOrders, getReviews, updateOrder, addNotification, getDbStatus, getNotifications, markNotificationRead } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { API_URL } from '../../../utils/api';
import './AdminDashboardPage.css';

const PAGE_SIZE = 3;

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(() => getProducts());
  const [orders, setOrders] = useState(() => getOrders());
  const [reviews, setReviews] = useState(() => getReviews());
  const [dbConnected, setDbConnected] = useState(() => getDbStatus());
  const [customers, setCustomers] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(() => getNotifications().filter((n) => !n.read));
  const [notifPopupDismissed, setNotifPopupDismissed] = useState(false);

  const [activeModalType, setActiveModalType] = useState(null);
  const [selectedAdminOrder, setSelectedAdminOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Lock body background scroll when any modal is open
  useEffect(() => {
    if (selectedAdminOrder || activeModalType) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedAdminOrder, activeModalType]);

  // Live Syncing feed
  useEffect(() => {
    const fetchLatest = async () => {
      setProducts(getProducts());
      setOrders(getOrders());
      setReviews(getReviews());
      setDbConnected(getDbStatus());
      setUnreadNotifications(getNotifications().filter((n) => !n.read));
      try {
        const res = await fetch(`${API_URL}/api/admin/customers`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCustomers(data.customers || []);
          }
        }
      } catch (err) {
        console.error('Failed to sync customers list:', err);
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

  // Total Revenue (excl. cancelled orders)
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((acc, order) => acc + Number(order.total || 0), 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Processing' || o.status === 'Placed' || o.status === 'Paid').length;
  }, [orders]);

  const dispatchedOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Dispatched').length;
  }, [orders]);

  const completedOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Completed').length;
  }, [orders]);

  const cancelledOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Cancelled').length;
  }, [orders]);

  const totalCustomers = useMemo(() => {
    return customers.length;
  }, [customers]);

  // Order status modification handler
  const handleStatusChange = async (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    const updated = { ...targetOrder, status: newStatus };
    try {
      await updateOrder(updated);

      // Notify user of dispatch
      if (newStatus === 'Dispatched') {
        await addNotification({
          id: `not-${Date.now()}`,
          title: 'Order Dispatched',
          message: `Your order #${orderId} has been dispatched for delivery.`,
          createdAt: new Date().toISOString(),
          read: false,
          orderId: orderId
        });
      }

      setOrders(getOrders());
      if (selectedAdminOrder && selectedAdminOrder.id === orderId) {
        setSelectedAdminOrder(updated);
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status.');
    }
  };

  // Extract unique customers list for modal
  const customersList = useMemo(() => {
    return customers.map(c => ({
      name: c.name,
      phone: c.phone,
      city: 'Coimbatore',
      ordersCount: c.numOrders || 0
    }));
  }, [customers]);

  // Filtered orders feed
  const filteredOrders = useMemo(() => {
    if (orderFilter === 'All') return orders;
    if (orderFilter === 'Paid') {
      return orders.filter(o => o.paymentStatus === 'Paid' || o.status === 'Paid' || Boolean(o.transactionId));
    }
    if (orderFilter === 'Pending') {
      return orders.filter(o => o.paymentStatus !== 'Paid' && o.status !== 'Paid' && !o.transactionId);
    }
    return orders.filter(o => o.status === orderFilter);
  }, [orders, orderFilter]);

  const orderTabs = useMemo(() => [
    { id: 'All', label: 'All Orders', count: orders.length },
    { id: 'Paid', label: 'Paid', count: orders.filter(o => o.paymentStatus === 'Paid' || o.status === 'Paid' || Boolean(o.transactionId)).length },
    { id: 'Pending', label: 'Pending', count: orders.filter(o => o.status === 'Pending').length },
    { id: 'Dispatched', label: 'Dispatched', count: orders.filter(o => o.status === 'Dispatched').length },
    { id: 'Completed', label: 'Completed', count: orders.filter(o => o.status === 'Completed').length },
    { id: 'Cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'Cancelled').length }
  ], [orders]);

  return (
    <AppShell title="Admin Portal Control Dashboard" links={adminLinks}>
      {!dbConnected ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh]  text-center bg-rose-50 border border-rose-100 rounded-2xl m-4">
          <p className="text-sm font-bold text-rose-600">Unable to load data from server. Please try again.</p>
        </div>
      ) : (
        <div className="admin-dashboard-page space-y-8">
        
        {/* Top Header Overview Panel */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white  rounded-2xl border border-slate-200/90">
          <div>
            <p className="text-blue-600 uppercase tracking-wider text-[10px] font-bold">HQ Systems Control</p>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-0.5">Admin Portal Overview</h2>
            <p className="text-xs text-slate-500 mt-1">Real-time telemetry tracking client orders, products catalog status, and customer reviews.</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-2 rounded-xl border border-blue-100 shrink-0">
            <RefreshCw size={14} className="animate-spin text-blue-600" />
            <strong className="text-xs font-bold">Live Sync Active</strong>
          </div>
        </header>

        {/* Dynamic Metric Cards Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          {/* Card 1: Total Products */}
          <motion.article
            whileHover={{ y: -3 }}
            onClick={() => setActiveModalType('products')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all group"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Products</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                <Package size={16} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold text-slate-800 leading-none">{products.length}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">View all catalog</span>
            </div>
          </motion.article>

          {/* Card 2: Active Orders */}
          <motion.article
            whileHover={{ y: -3 }}
            onClick={() => setActiveModalType('active-orders')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all group"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Active</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                <ShoppingCart size={16} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold text-amber-600 leading-none">{activeOrdersCount}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Processing orders</span>
            </div>
          </motion.article>

          {/* Card 3: Dispatched Orders */}
          <motion.article
            whileHover={{ y: -3 }}
            onClick={() => setActiveModalType('dispatched-orders')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all group"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Dispatched</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                <Truck size={16} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold text-blue-600 leading-none">{dispatchedOrdersCount}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">In transit tracking</span>
            </div>
          </motion.article>

          {/* Card 4: Completed Orders */}
          <motion.article
            whileHover={{ y: -3 }}
            onClick={() => setActiveModalType('completed-orders')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all group"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Delivered</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                <CheckCircle size={16} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold text-emerald-600 leading-none">{completedOrdersCount}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Delivered orders</span>
            </div>
          </motion.article>

          {/* Card 5: Cancelled Orders */}
          <motion.article
            whileHover={{ y: -3 }}
            onClick={() => setActiveModalType('cancelled-orders')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all group"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Cancelled</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                <Trash2 size={16} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold text-rose-600 leading-none">{cancelledOrdersCount}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Voided orders</span>
            </div>
          </motion.article>

          {/* Card 6: Total Customers */}
          <motion.article
            whileHover={{ y: -3 }}
            onClick={() => setActiveModalType('customers')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all group"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Customers</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold text-indigo-600 leading-none">{totalCustomers}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">Registered clients</span>
            </div>
          </motion.article>

          {/* Card 7: Total Revenue */}
          <motion.article
            whileHover={{ y: -3 }}
            onClick={() => setActiveModalType('revenue')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all group"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Revenue</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:scale-105 transition-transform">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl font-extrabold text-slate-900 leading-none truncate">{formatCurrency(totalRevenue)}</h3>
              <span className="text-[10px] text-blue-700 font-semibold block mt-1.5">Excl. cancelled</span>
            </div>
          </motion.article>
        </section>
        


        {/* Recent Orders - Live management list */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-3 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 ">
            <div>
              <p className="dashboard-eyebrow text-blue-700 uppercase tracking-wider text-[10px] font-bold">Client operations</p>
              <h2 className="text-xl font-bold text-slate-800">Manage Orders ({filteredOrders.length})</h2>
            </div>

            {/* Filter Tabs Component */}
            <Tabs
              tabs={orderTabs}
              activeTab={orderFilter}
              onChange={setOrderFilter}
              size="sm"
            />
          </div>

          {!filteredOrders.length ? (
            <p className="text-xs text-slate-400 py-10 italic text-center bg-white rounded-2xl border">No orders found for filter "{orderFilter}".</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {filteredOrders.slice((Math.min(currentPage, Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))) - 1) * PAGE_SIZE, Math.min(currentPage, Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))) * PAGE_SIZE).map((order) => {
                  const isOrderPaid = order.paymentStatus === 'Paid' || order.status === 'Paid' || Boolean(order.transactionId);
                  return (
                    <article key={order.id} className="border border-slate-200/90 p-2.5 rounded-2xl bg-white flex flex-col justify-between gap-4 hover:border-blue-300 transition-all h-full">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2 pb-3 border-b border-slate-100">
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 truncate">{order.customerName}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{order.customerPhone}</p>
                          </div>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${
 order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
 order.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
 order.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
 order.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
 'bg-slate-100 text-slate-700 border border-slate-200'
 }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Clock size={12} className="text-slate-400" />
                              {formatDateTime(order.createdAt)}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
 isOrderPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
 }`}>
                              {isOrderPaid ? <><Check size={10} strokeWidth={3} /> Paid</> : 'Unpaid'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <CreditCard size={12} className="text-slate-400" />
                              {order.paymentMethod || 'Razorpay'}
                            </span>
                            {isOrderPaid && order.transactionId && (
                              <span className="font-mono text-[11px] font-semibold text-slate-700 truncate max-w-[140px]">
                                {order.transactionId}
                              </span>
                            )}
                          </div>

                          {order.shippingAddress && (
                            <p className="text-slate-500 flex items-center gap-1.5 truncate">
                              <MapPin size={12} className="text-blue-600 shrink-0" />
                              <span className="truncate">
                                {[order.shippingAddress.address, order.shippingAddress.city].filter(Boolean).join(', ')}
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {order.items?.map((it, idx) => (
                            <span key={idx} className="text-[11px] bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                              {it.name} ×{it.quantity}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Amount</span>
                          <strong className="text-base font-extrabold text-slate-900">{formatCurrency(order.total)}</strong>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {(order.status !== 'Dispatched' && order.status !== 'Completed' && order.status !== 'Cancelled') && (
                            <>
                              {order.status === 'Paid' ? (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(order.id, 'Dispatched')}
                                  className="flex-1 text-xs bg-blue-600 text-white py-2 px-3 rounded-xl font-bold hover:bg-blue-700 transition"
                                >
                                  Dispatch
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(order.id, 'Processing')}
                                  className="flex-1 text-xs bg-blue-600 text-white py-2 px-3 rounded-xl font-bold hover:bg-blue-700 transition"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(order.id, 'Cancelled')}
                                className="text-xs bg-rose-50 border border-rose-200 text-rose-600 py-2 px-3 rounded-xl font-bold hover:bg-rose-100 transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedAdminOrder(order)}
                            className="text-xs bg-slate-100 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl font-bold hover:bg-slate-200 flex items-center justify-center gap-1.5 transition"
                          >
                            <Eye size={13} /> Details
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <Pagination
                currentPage={Math.min(currentPage, Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE)))}
                totalItems={filteredOrders.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </section>

        {/* Modal overlays */}
        <AnimatePresence>
          {activeModalType && (
            <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg max-w-3xl w-full p-6 border flex flex-col space-y-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="badge-kicker text-blue-600 font-bold uppercase tracking-wider text-[10px]">HQ Control Portal</span>
                    <h2 className="text-xl font-bold text-slate-800 capitalize">{activeModalType.replace('-', ' ')} Summary</h2>
                  </div>
                  <button onClick={() => setActiveModalType(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  
                  {activeModalType === 'products' && (
                    <div className="space-y-3">
                      {products.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
                          <img src={p.image} alt={p.name} className="w-10 h-10 object-contain bg-white rounded border p-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold">{p.category || 'Automation'}</p>
                          </div>
                          <strong className="text-xs text-blue-600">{formatCurrency(p.price)}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeModalType === 'active-orders' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'Placed' || o.status === 'Processing' || o.status === 'Paid').map(o => (
                        <div key={o.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-slate-800">{o.customerName} ({o.customerPhone})</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold uppercase mb-1">{o.status}</span>
                            <strong className="block text-blue-700">{formatCurrency(o.total)}</strong>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'Placed' || o.status === 'Processing' || o.status === 'Paid').length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No active orders.</p>
                      )}
                    </div>
                  )}

                  {activeModalType === 'dispatched-orders' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'Dispatched').map(o => (
                        <div key={o.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-slate-800">{o.customerName} ({o.customerPhone})</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold uppercase mb-1">{o.status}</span>
                            <strong className="block text-blue-700">{formatCurrency(o.total)}</strong>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'Dispatched').length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No dispatched orders.</p>
                      )}
                    </div>
                  )}

                  {activeModalType === 'completed-orders' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'Completed').map(o => (
                        <div key={o.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-slate-800">{o.customerName} ({o.customerPhone})</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase mb-1">{o.status}</span>
                            <strong className="block text-blue-700">{formatCurrency(o.total)}</strong>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'Completed').length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No completed orders.</p>
                      )}
                    </div>
                  )}

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

                  {activeModalType === 'cancelled-orders' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'Cancelled').map(o => (
                        <div key={o.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-slate-800">{o.customerName} ({o.customerPhone})</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block text-[9px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold uppercase mb-1">{o.status}</span>
                            <strong className="block text-slate-400 line-through">{formatCurrency(o.total)}</strong>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'Cancelled').length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-6">No cancelled orders.</p>
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Selected Admin Order Details Modal */}
        <AnimatePresence>
          {selectedAdminOrder && (
            <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overscroll-contain">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-xl w-full p-6 border flex flex-col space-y-4 max-h-[85vh] overflow-y-auto overscroll-contain"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="badge-kicker text-blue-600 font-bold uppercase tracking-wider text-[10px]">Order & Payment Details</span>
                    <h2 className="text-lg font-bold text-slate-800">{selectedAdminOrder.customerName} — Order Details</h2>
                  </div>
                  <button onClick={() => setSelectedAdminOrder(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4 text-xs font-semibold text-slate-600">
                  {/* Customer info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border rounded-xl">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Customer</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{selectedAdminOrder.customerName}</p>
                      <p className="text-[11px] mt-0.5">Phone: {selectedAdminOrder.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Shipping Address</p>
                      {selectedAdminOrder.shippingAddress ? (
                        <p className="text-slate-800 mt-0.5 leading-relaxed">
                          {selectedAdminOrder.shippingAddress.address}, {selectedAdminOrder.shippingAddress.city} - {selectedAdminOrder.shippingAddress.pincode}
                        </p>
                      ) : (
                        <p className="text-slate-400 mt-0.5 italic">Standard Delivery</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  {(() => {
                    const isModalPaid = selectedAdminOrder.paymentStatus === 'Paid' || selectedAdminOrder.status === 'Paid' || Boolean(selectedAdminOrder.transactionId);
                    return (
                      <div className={`p-4 rounded-xl border space-y-2 ${
 isModalPaid ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/80 border-amber-200'
 }`}>
                        <h4 className={`text-[10px] uppercase font-extrabold tracking-wider flex items-center gap-1.5 mb-1 ${
 isModalPaid ? 'text-emerald-800' : 'text-amber-800'
 }`}>
                          <CreditCard size={12} className={isModalPaid ? 'text-emerald-600' : 'text-amber-600'} />
                          {isModalPaid ? 'Bank Settlement & Payment Telemetry (Paid)' : 'Payment Telemetry Status (Pending / Unpaid)'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Payment Status:</span>
                            <strong className={`block text-xs uppercase font-extrabold mt-0.5 flex items-center gap-1 ${
 isModalPaid ? 'text-emerald-700' : 'text-amber-700'
 }`}>
                              {isModalPaid ? <><Check size={12} strokeWidth={3} /> PAID (BANK RECEIVED)</> : <><Clock size={12} /> PENDING (UNPAID)</>}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Selected Method:</span>
                            <strong className="block text-slate-800 text-xs font-bold mt-0.5">{selectedAdminOrder.paymentMethod || 'Google Pay'}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Payment Ref ID:</span>
                            <strong className="block font-mono text-slate-900 text-xs font-bold mt-0.5">
                              {isModalPaid ? (selectedAdminOrder.transactionId || 'Verified') : 'Not Provided Yet'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Bank Settlement:</span>
                            <strong className="block text-slate-800 text-xs font-semibold mt-0.5">
                              {isModalPaid ? (selectedAdminOrder.paymentTime ? formatDateTime(selectedAdminOrder.paymentTime) : 'Settled in Account') : 'Awaiting Customer Payment'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Items list */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Items List</h4>
                    <div className="divide-y border rounded-xl overflow-hidden bg-slate-50/50">
                      {selectedAdminOrder.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white">
                          <img src={it.image} alt={it.name} className="w-8 h-8 object-contain bg-slate-50 border p-1 rounded" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">{it.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">₹{it.unitPrice || it.total} x {it.quantity}</p>
                          </div>
                          <strong className="text-blue-700">{formatCurrency(it.total)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold text-left">Total Paid</p>
                      <strong className="text-lg text-blue-600 font-extrabold">{formatCurrency(selectedAdminOrder.total)}</strong>
                    </div>

                    <div className="flex gap-2">
                      {selectedAdminOrder.status === 'Paid' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleStatusChange(selectedAdminOrder.id, 'Processing');
                            setSelectedAdminOrder(null);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                        >
                          Approve Order
                        </button>
                      )}
                      {selectedAdminOrder.status !== 'Cancelled' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleStatusChange(selectedAdminOrder.id, 'Cancelled');
                            setSelectedAdminOrder(null);
                          }}
                          className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition"
                        >
                          Reject Order
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedAdminOrder(null)}
                        className="px-4 py-2 bg-slate-100 border text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      )}

      <DashboardNotificationModal
        notifications={unreadNotifications}
        isOpen={!notifPopupDismissed && unreadNotifications.length > 0}
        onDismiss={() => setNotifPopupDismissed(true)}
        onMarkSeen={async (notif) => {
          await markNotificationRead(notif.id);
          setUnreadNotifications((prev) => prev.filter((n) => n.id !== notif.id));
          navigate('/admin/notifications');
        }}
      />
    </AppShell>
  );
};

export default AdminDashboardPage;
