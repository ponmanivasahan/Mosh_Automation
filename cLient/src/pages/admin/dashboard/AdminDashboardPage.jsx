import { useState, useEffect, useMemo } from 'react';
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
  Check,
  AlertCircle
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { getProducts, getOrders, getReviews, updateOrder, addNotification, getDbStatus } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { API_URL } from '../../../utils/api';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Product Management' },
  { to: '/admin/invoices', label: 'Billing' },
  { to: '/admin/billing', label: 'Query Management' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/stories', label: 'Success Stories' },
  { to: '/admin/estimations', label: 'Estimation Calculator' },
  { to: '/admin/customers', label: 'Customers' }
];

const AdminDashboardPage = () => {
  const [products, setProducts] = useState(() => getProducts());
  const [orders, setOrders] = useState(() => getOrders());
  const [reviews, setReviews] = useState(() => getReviews());
  const [dbConnected, setDbConnected] = useState(() => getDbStatus());
  const [customers, setCustomers] = useState([]);

  const [activeModalType, setActiveModalType] = useState(null);
  const [selectedAdminOrder, setSelectedAdminOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('All');

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

  useEffect(() => {
    const fetchLatest = async () => {
      setProducts(getProducts());
      setOrders(getOrders());
      setReviews(getReviews());
      setDbConnected(getDbStatus());
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

  const handleStatusChange = async (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    const updated = { ...targetOrder, status: newStatus };
    try {
      await updateOrder(updated);

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

  const customersList = useMemo(() => {
    return customers.map(c => ({
      name: c.name,
      phone: c.phone,
      city: 'Coimbatore',
      ordersCount: c.numOrders || 0
    }));
  }, [customers]);

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

  return (
    <AppShell title="Admin Portal Control Dashboard" links={adminLinks}>
      {!dbConnected ? (
        <div className="p-8">
          <EmptyState 
            icon={AlertCircle} 
            title="Database Connection Error" 
            description="Unable to load data from server. Please try again." 
          />
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
        
        {/* Top Header Overview Panel */}
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
          <div>
            <p className="text-primary uppercase tracking-wider text-[10px] font-bold">HQ Systems Control</p>
            <h2 className="text-2xl font-bold text-neutral-800">Admin Portal Overview</h2>
            <p className="text-xs text-neutral-500 mt-1">Real-time telemetry tracking client orders, products catalog status, and customer reviews.</p>
          </div>
          <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-xl border border-teal-100 shadow-sm">
            <RefreshCw size={14} className="animate-spin text-teal-600" />
            <strong className="text-xs font-bold">Live Sync Active</strong>
          </div>
        </header>

        {/* Dynamic Metric Cards Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
          <Card hover onClick={() => setActiveModalType('products')} className="flex flex-col justify-between p-5 cursor-pointer">
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">Total Products</p>
              <Package size={16} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-800 mt-3">{products.length}</h3>
            <span className="text-[10px] text-neutral-400 font-bold block mt-1">Click to view items</span>
          </Card>

          <Card hover onClick={() => setActiveModalType('active-orders')} className="flex flex-col justify-between p-5 cursor-pointer">
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">Active Orders</p>
              <ShoppingCart size={16} className="text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-amber-600 mt-3">{activeOrdersCount}</h3>
            <span className="text-[10px] text-neutral-400 font-bold block mt-1">Placed & Processing</span>
          </Card>

          <Card hover onClick={() => setActiveModalType('dispatched-orders')} className="flex flex-col justify-between p-5 cursor-pointer border-teal-200 bg-teal-50/30">
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">Dispatched</p>
              <Truck size={16} className="text-teal-500" />
            </div>
            <h3 className="text-2xl font-bold text-teal-600 mt-3">{dispatchedOrdersCount}</h3>
            <span className="text-[10px] text-neutral-400 font-bold block mt-1">On the way</span>
          </Card>

          <Card hover onClick={() => setActiveModalType('completed-orders')} className="flex flex-col justify-between p-5 cursor-pointer">
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">Completed</p>
              <CheckCircle size={16} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-3">{completedOrdersCount}</h3>
            <span className="text-[10px] text-neutral-400 font-semibold block mt-1">Delivered orders</span>
          </Card>

          <Card hover onClick={() => setActiveModalType('cancelled-orders')} className="flex flex-col justify-between p-5 cursor-pointer">
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">Cancelled Orders</p>
              <Trash2 size={16} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-red-600 mt-3">{cancelledOrdersCount}</h3>
            <span className="text-[10px] text-neutral-400 font-semibold block mt-1">Cancelled items list</span>
          </Card>

          <Card hover onClick={() => setActiveModalType('customers')} className="flex flex-col justify-between p-5 cursor-pointer">
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">Customers</p>
              <Users size={16} className="text-indigo-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-indigo-600 mt-3">{totalCustomers}</h3>
            <span className="text-[10px] text-neutral-400 font-semibold block mt-1">Registered clients</span>
          </Card>

          <Card hover onClick={() => setActiveModalType('revenue')} className="flex flex-col justify-between p-5 cursor-pointer">
            <div className="flex justify-between items-start">
              <p className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">Total Revenue</p>
              <TrendingUp size={16} className="text-pink-500" />
            </div>
            <h3 className="text-xl font-extrabold text-pink-600 mt-3 truncate">{formatCurrency(totalRevenue)}</h3>
            <span className="text-[10px] text-neutral-400 font-semibold block mt-1">Excl. cancelled</span>
          </Card>
        </section>
        
        {/* Recent Orders - Live management list */}
        <Card className="p-5 md:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <p className="text-primary uppercase tracking-wider text-[10px] font-bold">Client operations</p>
              <h2 className="text-xl font-bold text-neutral-800">Manage Orders ({filteredOrders.length})</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {['All', 'Paid', 'Pending', 'Dispatched', 'Completed', 'Cancelled'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setOrderFilter(tab)}
                  className={`text-[11px] px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap ${
                    orderFilter === tab ? 'bg-primary text-white shadow-md' : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {!filteredOrders.length ? (
            <EmptyState 
              icon={Package} 
              title="No Orders Found" 
              description={`No orders found for filter "${orderFilter}".`}
            />
          ) : (
            <div className="max-h-[580px] overflow-y-auto pr-2 space-y-4 scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOrders.map((order) => {
                  const isOrderPaid = order.paymentStatus === 'Paid' || order.status === 'Paid' || Boolean(order.transactionId);
                  
                  let badgeVariant = 'default';
                  if (order.status === 'Cancelled') badgeVariant = 'danger';
                  else if (order.status === 'Dispatched') badgeVariant = 'info';
                  else if (order.status === 'Paid') badgeVariant = 'success';
                  else if (order.status === 'Completed') badgeVariant = 'success';

                  return (
                    <Card key={order.id} hover className="p-5 flex flex-col justify-between gap-4 h-full">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-sm font-bold text-neutral-900 truncate">{order.customerName}</h3>
                          <Badge variant={badgeVariant}>{order.status}</Badge>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-bold mt-1">Phone: {order.customerPhone}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">ID: #{order.id} · {formatDateTime(order.createdAt)}</p>
                        
                        {/* Payment Telemetry Box - Paid vs Pending */}
                        <div className={`mt-3 p-3 rounded-xl border text-[10px] font-semibold space-y-1 ${
                          isOrderPaid ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-amber-50/80 border-amber-200 text-amber-950'
                        }`}>
                          <div className="flex justify-between items-center font-bold">
                            <span className="flex items-center gap-1">
                              <CreditCard size={12} className={isOrderPaid ? 'text-emerald-600' : 'text-amber-600'} />
                              Payment:
                            </span>
                            <span className={`uppercase font-extrabold px-2 py-0.5 rounded-full text-[9px] ${
                              isOrderPaid ? 'bg-emerald-100 text-emerald-700 flex items-center gap-1' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {isOrderPaid ? <><Check size={10} strokeWidth={3} /> Paid</> : 'Pending (Unpaid)'}
                            </span>
                          </div>
                          <p className="text-neutral-600">Gateway: <strong className="text-neutral-800 font-bold">{order.paymentMethod || 'Google Pay'}</strong></p>
                          {isOrderPaid && order.transactionId && (
                            <p className="text-neutral-600">UTR: <span className="font-mono font-bold text-neutral-900">{order.transactionId}</span></p>
                          )}
                          {!isOrderPaid && (
                            <p className="text-amber-700/90 italic text-[9.5px]">Awaiting customer payment verification</p>
                          )}
                        </div>

                        {order.shippingAddress && (
                          <p className="text-[11px] text-neutral-500 mt-2 bg-neutral-50 p-2 rounded-xl border border-neutral-100 flex items-center gap-1.5 font-bold">
                            <MapPin size={12} className="text-primary shrink-0" />
                            <span className="truncate">Deliver: {order.shippingAddress.address || order.shippingAddress.city}, {order.shippingAddress.city}</span>
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {order.items?.map((it, idx) => (
                            <span key={idx} className="text-[9px] bg-neutral-50 border px-2 py-0.5 rounded-md text-neutral-600 font-bold">
                              {it.name} (x{it.quantity})
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-neutral-100 pt-3 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase">Total Amount</span>
                          <strong className="text-base font-extrabold text-primary">{formatCurrency(order.total)}</strong>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            {order.status === 'Paid' ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleStatusChange(order.id, 'Processing')}
                                className="w-full text-[10px]"
                              >
                                Approve Order
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleStatusChange(order.id, 'Dispatched')}
                                disabled={order.status === 'Dispatched' || order.status === 'Completed'}
                                className="w-full text-[10px] text-primary hover:text-teal-800"
                              >
                                Dispatch
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleStatusChange(order.id, 'Cancelled')}
                              className="w-full text-[10px]"
                            >
                              Reject / Cancel
                            </Button>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedAdminOrder(order)}
                            className="w-full text-[10px] flex items-center gap-1.5"
                          >
                            <Eye size={12} /> View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Modal overlays */}
        <AnimatePresence>
          {activeModalType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-neutral-100 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex justify-between items-start border-b border-neutral-100 pb-3">
                  <div>
                    <span className="text-primary font-bold uppercase tracking-wider text-[10px]">HQ Control Portal</span>
                    <h2 className="text-xl font-bold text-neutral-800 capitalize">{activeModalType.replace('-', ' ')} Summary</h2>
                  </div>
                  <button onClick={() => setActiveModalType(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 transition">
                    <X size={18} className="text-neutral-400" />
                  </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  
                  {activeModalType === 'products' && (
                    <div className="space-y-3">
                      {products.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-3 border border-neutral-100 rounded-xl bg-neutral-50 hover:bg-white transition-colors">
                          <img src={p.image} alt={p.name} className="w-12 h-12 object-contain bg-white rounded-lg border p-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-neutral-800 truncate">{p.name}</h4>
                            <p className="text-[11px] text-neutral-500 font-medium">{p.category || 'Automation'}</p>
                          </div>
                          <strong className="text-sm text-primary">{formatCurrency(p.price)}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeModalType === 'active-orders' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'Placed' || o.status === 'Processing' || o.status === 'Paid').map(o => (
                        <div key={o.id} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 flex justify-between items-center text-sm">
                          <div>
                            <h4 className="font-bold text-neutral-800">{o.customerName} ({o.customerPhone})</h4>
                            <p className="text-xs text-neutral-500 mt-0.5">ID: #{o.id} · {formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="warning" className="mb-2 uppercase text-[10px]">{o.status}</Badge>
                            <strong className="block text-primary">{formatCurrency(o.total)}</strong>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'Placed' || o.status === 'Processing' || o.status === 'Paid').length === 0 && (
                        <div className="py-6"><EmptyState icon={Package} title="No Active Orders" description="There are no active orders at the moment." /></div>
                      )}
                    </div>
                  )}

                  {activeModalType === 'dispatched-orders' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'Dispatched').map(o => (
                        <div key={o.id} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 flex justify-between items-center text-sm">
                          <div>
                            <h4 className="font-bold text-neutral-800">{o.customerName} ({o.customerPhone})</h4>
                            <p className="text-xs text-neutral-500 mt-0.5">ID: #{o.id} · {formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="info" className="mb-2 uppercase text-[10px]">{o.status}</Badge>
                            <strong className="block text-primary">{formatCurrency(o.total)}</strong>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'Dispatched').length === 0 && (
                        <div className="py-6"><EmptyState icon={Truck} title="No Dispatched Orders" description="There are no dispatched orders at the moment." /></div>
                      )}
                    </div>
                  )}

                  {activeModalType === 'completed-orders' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'Completed').map(o => (
                        <div key={o.id} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 flex justify-between items-center text-sm">
                          <div>
                            <h4 className="font-bold text-neutral-800">{o.customerName} ({o.customerPhone})</h4>
                            <p className="text-xs text-neutral-500 mt-0.5">ID: #{o.id} · {formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="success" className="mb-2 uppercase text-[10px]">{o.status}</Badge>
                            <strong className="block text-primary">{formatCurrency(o.total)}</strong>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'Completed').length === 0 && (
                        <div className="py-6"><EmptyState icon={CheckCircle} title="No Completed Orders" description="There are no completed orders yet." /></div>
                      )}
                    </div>
                  )}

                  {activeModalType === 'customers' && (
                    <div className="space-y-3">
                      {customersList.map(c => (
                        <div key={c.phone} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 flex justify-between items-center text-sm">
                          <div>
                            <h4 className="font-bold text-neutral-800">{c.name}</h4>
                            <p className="text-xs text-neutral-500 mt-0.5">Phone: {c.phone} · City: {c.city}</p>
                          </div>
                          <Badge variant="default" className="text-xs py-1 px-3">
                            {c.ordersCount} orders placed
                          </Badge>
                        </div>
                      ))}
                      {customersList.length === 0 && (
                        <div className="py-6"><EmptyState icon={Users} title="No Customers" description="There are no registered customers yet." /></div>
                      )}
                    </div>
                  )}

                  {activeModalType === 'cancelled-orders' && (
                    <div className="space-y-3">
                      {orders.filter(o => o.status === 'Cancelled').map(o => (
                        <div key={o.id} className="p-4 border border-neutral-100 rounded-xl bg-neutral-50 flex justify-between items-center text-sm">
                          <div>
                            <h4 className="font-bold text-neutral-800">{o.customerName} ({o.customerPhone})</h4>
                            <p className="text-xs text-neutral-500 mt-0.5">ID: #{o.id} · {formatDateTime(o.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="danger" className="mb-2 uppercase text-[10px]">{o.status}</Badge>
                            <strong className="block text-neutral-400 line-through">{formatCurrency(o.total)}</strong>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'Cancelled').length === 0 && (
                        <div className="py-6"><EmptyState icon={Trash2} title="No Cancelled Orders" description="There are no cancelled orders." /></div>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overscroll-contain">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-neutral-100 flex flex-col space-y-5 max-h-[85vh] overflow-y-auto overscroll-contain"
              >
                <div className="flex justify-between items-start border-b border-neutral-100 pb-3">
                  <div>
                    <span className="text-primary font-bold uppercase tracking-wider text-[10px]">Order & Payment Details</span>
                    <h2 className="text-lg font-bold text-neutral-800">Order #{selectedAdminOrder.id}</h2>
                  </div>
                  <button onClick={() => setSelectedAdminOrder(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 transition">
                    <X size={18} className="text-neutral-400" />
                  </button>
                </div>

                <div className="space-y-5 text-sm text-neutral-700">
                  {/* Customer info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 border border-neutral-100 rounded-xl">
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase font-bold">Customer</p>
                      <p className="text-neutral-900 font-bold text-sm mt-1">{selectedAdminOrder.customerName}</p>
                      <p className="text-xs text-neutral-500 mt-1">Phone: {selectedAdminOrder.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase font-bold">Shipping Address</p>
                      {selectedAdminOrder.shippingAddress ? (
                        <p className="text-neutral-800 mt-1 leading-relaxed text-xs">
                          {selectedAdminOrder.shippingAddress.address}, {selectedAdminOrder.shippingAddress.city} - {selectedAdminOrder.shippingAddress.pincode}
                        </p>
                      ) : (
                        <p className="text-neutral-400 mt-1 italic text-xs">Standard Delivery</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Details */}
                  {(() => {
                    const isModalPaid = selectedAdminOrder.paymentStatus === 'Paid' || selectedAdminOrder.status === 'Paid' || Boolean(selectedAdminOrder.transactionId);
                    return (
                      <div className={`p-4 rounded-xl border space-y-3 ${
                        isModalPaid ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/80 border-amber-200'
                      }`}>
                        <h4 className={`text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5 mb-2 ${
                          isModalPaid ? 'text-emerald-800' : 'text-amber-800'
                        }`}>
                          <CreditCard size={14} className={isModalPaid ? 'text-emerald-600' : 'text-amber-600'} />
                          {isModalPaid ? 'Bank Settlement & Payment Telemetry (Paid)' : 'Payment Telemetry Status (Pending / Unpaid)'}
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase">Payment Status:</span>
                            <strong className={`block text-xs uppercase font-extrabold mt-1 flex items-center gap-1 ${
                              isModalPaid ? 'text-emerald-700' : 'text-amber-700'
                            }`}>
                              {isModalPaid ? <><Check size={14} strokeWidth={3} /> PAID (BANK RECEIVED)</> : <><Clock size={14} /> PENDING (UNPAID)</>}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase">Selected Method:</span>
                            <strong className="block text-neutral-800 text-xs font-bold mt-1">{selectedAdminOrder.paymentMethod || 'Google Pay'}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase">Payment Ref ID:</span>
                            <strong className="block font-mono text-neutral-900 text-xs font-bold mt-1">
                              {isModalPaid ? (selectedAdminOrder.transactionId || 'Verified') : 'Not Provided Yet'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 font-bold uppercase">Bank Settlement:</span>
                            <strong className="block text-neutral-800 text-xs font-semibold mt-1">
                              {isModalPaid ? (selectedAdminOrder.paymentTime ? formatDateTime(selectedAdminOrder.paymentTime) : 'Settled in Account') : 'Awaiting Customer Payment'}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Items list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Items List</h4>
                    <div className="divide-y border border-neutral-100 rounded-xl overflow-hidden bg-neutral-50/50">
                      {selectedAdminOrder.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-white">
                          <img src={it.image} alt={it.name} className="w-10 h-10 object-contain bg-neutral-50 border border-neutral-100 p-1 rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-neutral-800 text-sm truncate">{it.name}</p>
                            <p className="text-[11px] text-neutral-500 mt-1">₹{it.unitPrice || it.total} x {it.quantity}</p>
                          </div>
                          <strong className="text-primary text-sm">{formatCurrency(it.total)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-neutral-100 pt-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold text-left">Total Paid</p>
                      <strong className="text-xl text-primary font-extrabold">{formatCurrency(selectedAdminOrder.total)}</strong>
                    </div>

                    <div className="flex gap-2">
                      {selectedAdminOrder.status === 'Paid' && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            handleStatusChange(selectedAdminOrder.id, 'Processing');
                            setSelectedAdminOrder(null);
                          }}
                        >
                          Approve Order
                        </Button>
                      )}
                      {selectedAdminOrder.status !== 'Cancelled' && (
                        <Button
                          variant="danger"
                          onClick={() => {
                            handleStatusChange(selectedAdminOrder.id, 'Cancelled');
                            setSelectedAdminOrder(null);
                          }}
                        >
                          Reject Order
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedAdminOrder(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      )}
    </AppShell>
  );
};

export default AdminDashboardPage;
