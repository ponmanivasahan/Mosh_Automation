import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  Shield,
  CreditCard,
  Package,
  Calendar,
  ChevronRight,
  X,
  MapPin
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { useAuth } from '../../../utils/AuthContext';
import {
  addNotification,
  addOrder,
  clearCart,
  getCart,
  getOrders,
  setCart,
  updateOrder
} from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { customerLinks } from '../../../utils/customerLinks';
import './CustomerCartPage.css';

const CustomerCartPage = () => {
  const { session } = useAuth();
  const [cartItems, setCartItems] = useState(getCart());
  const [message, setMessage] = useState('');
  
  // Checkout Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingDetails, setShippingDetails] = useState({
    name: session?.name || '',
    address: '',
    city: '',
    pincode: '',
    phone: session?.phone || '',
    paymentMethod: 'Google Pay'
  });

  // Auto-dismiss alert messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const [orders, setOrders] = useState(() => getOrders().filter((order) => order.customerPhone === session?.phone));

  useEffect(() => {
    const syncOrders = () => {
      setOrders(getOrders().filter((order) => order.customerPhone === session?.phone));
    };
    const interval = setInterval(syncOrders, 1000);
    window.addEventListener('storage', syncOrders);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncOrders);
    };
  }, [session]);

  const priceDetails = useMemo(() => {
    const totalItems = cartItems.reduce((acc, item) => acc + Number(item.quantity || 1), 0);
    const subtotal = cartItems.reduce((acc, item) => acc + Number(item.total || 0), 0);
    
    // Flipkart & Amazon style breakdown
    const discount = subtotal > 5000 ? Math.round(subtotal * 0.1) : 0; // 10% discount for orders above 5000
    const deliveryCharges = subtotal > 3000 || subtotal === 0 ? 0 : 99; // Free delivery above 3000
    const packagingFee = subtotal > 0 ? 49 : 0;
    const finalAmount = subtotal - discount + deliveryCharges + packagingFee;

    return {
      totalItems,
      subtotal,
      discount,
      deliveryCharges,
      packagingFee,
      finalAmount
    };
  }, [cartItems]);

  const updateQuantity = (id, change) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, (item.quantity || 1) + change);
        return {
          ...item,
          quantity: newQty,
          total: newQty * Number(item.unitPrice || 0)
        };
      }
      return item;
    });
    setCart(updated);
    setCartItems(updated);
  };

  const removeItem = (id, itemName) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCart(updated);
    setCartItems(updated);
    setMessage(`Removed ${itemName} from your cart.`);
  };

  const placeOrder = () => {
    if (!cartItems.length) {
      setMessage('Cart is empty. Add products before placing an order.');
      return;
    }
    // Open the modal instead of placing order immediately
    setShowCheckoutModal(true);
  };

  const confirmOrder = (e) => {
    e.preventDefault();
    if (!shippingDetails.name.trim() || !shippingDetails.address.trim() || !shippingDetails.city.trim() || !shippingDetails.pincode.trim()) {
      alert('Please fill in all the required delivery details.');
      return;
    }

    const order = {
      id: `ord-${Date.now()}`,
      customerName: shippingDetails.name,
      customerPhone: session.phone,
      items: cartItems,
      total: priceDetails.finalAmount,
      createdAt: new Date().toISOString(),
      status: 'Processing',
      shippingAddress: {
        address: shippingDetails.address,
        city: shippingDetails.city,
        pincode: shippingDetails.pincode
      },
      paymentMethod: shippingDetails.paymentMethod
    };

    addOrder(order);
    addNotification({
      id: `not-${Date.now()}`,
      title: 'New Customer Order',
      message: `${shippingDetails.name} (${session.phone}) placed an order for ${formatCurrency(priceDetails.finalAmount)} to ${shippingDetails.city}.`,
      createdAt: new Date().toISOString(),
      read: false,
      orderId: order.id
    });

    clearCart();
    setCartItems([]);
    setShowCheckoutModal(false);
    setMessage('Order placed successfully! Support team has been notified.');
  };

  const handleCancelOrder = (order) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      const updated = {
        ...order,
        status: 'Cancelled'
      };
      updateOrder(updated);
      
      // Notify admin
      addNotification({
        id: `not-${Date.now()}`,
        title: 'Order Cancelled',
        message: `${session.name} cancelled order #${order.id} totaling ${formatCurrency(order.total)}.`,
        createdAt: new Date().toISOString(),
        read: false,
        orderId: order.id
      });
      
      setSelectedOrder(null);
      setMessage(`Order #${order.id} has been cancelled successfully.`);
    }
  };

  const handleMarkDelivered = (order) => {
    const updated = {
      ...order,
      status: 'Completed'
    };
    updateOrder(updated);

    addNotification({
      id: `not-${Date.now()}`,
      title: 'Order Completed (Delivered)',
      message: `${session.name} marked order #${order.id} as delivered successfully.`,
      createdAt: new Date().toISOString(),
      read: false,
      orderId: order.id
    });

    setSelectedOrder(null);
    setMessage(`Order #${order.id} marked as Delivered! Thank you.`);
  };

  return (
    <AppShell title="Shopping Cart & Order History" links={customerLinks}>
      <div className="cart-page-wrapper">
        
        {/* Toast Alert Feedback */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-xl bg-teal-600 text-white border-teal-500"
            >
              <CheckCircle size={20} />
              <span className="font-semibold text-sm">{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="cart-layout-grid">
          
          {/* Left Side: Cart Items List */}
          <div className="cart-left-section">
            <div className="section-card-panel">
              <div className="panel-header-row">
                <h2 className="panel-title">Shopping Cart ({cartItems.length} Items)</h2>
                {cartItems.length > 0 && (
                  <span className="shipping-banner">
                    <Truck size={14} />
                    {priceDetails.subtotal > 3000 ? 'Free Shipping Active!' : 'Add ₹' + (3000 - priceDetails.subtotal) + ' more for Free Delivery'}
                  </span>
                )}
              </div>

              {!cartItems.length ? (
                <div className="empty-cart-view">
                  <div className="empty-icon-wrap">
                    <ShoppingBag size={48} />
                  </div>
                  <h3>Your Cart is Empty</h3>
                  <p>Explore Mosh Automation catalog to discover and add smart controllers.</p>
                </div>
              ) : (
                <div className="cart-items-divider-list">
                  {cartItems.map((item) => (
                    <article className="cart-item-row" key={item.id}>
                      {/* Product Thumbnail */}
                      <div className="item-thumbnail-container">
                        <img className="item-image" src={item.image} alt={item.name} />
                      </div>

                      {/* Detail Column */}
                      <div className="item-details-col">
                        <h3 className="item-name">{item.name}</h3>
                        {item.complexity && (
                          <span className="complexity-badge uppercase tracking-wider text-[10px]">
                            Complexity: {item.complexity}
                          </span>
                        )}
                        <span className="stock-hint">In Stock</span>
                        
                        {/* Price Details */}
                        <div className="item-price-section">
                          <strong className="current-price">{formatCurrency(item.unitPrice || item.total)}</strong>
                          <span className="mrp-price">{formatCurrency((item.unitPrice || item.total) * 1.35)}</span>
                          <span className="discount-pct">35% OFF</span>
                        </div>
                      </div>

                      {/* Controls and Actions Column */}
                      <div className="item-actions-col">
                        {/* Flipkart Style Qty Controller */}
                        <div className="qty-control-btn-group">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
                            className="qty-btn"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="qty-value-label">{item.quantity || 1}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="qty-btn"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Remove CTA */}
                        <button
                          className="btn-remove-item"
                          type="button"
                          onClick={() => removeItem(item.id, item.name)}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Previous Orders Section */}
            <div className="section-card-panel history-panel">
              <h2 className="panel-title flex items-center gap-2">
                <Package size={18} className="text-teal-600" />
                Previous Order History ({orders.length})
              </h2>

              {!orders.length ? (
                <p className="no-history-text">No previous orders found.</p>
              ) : (
                <div className="orders-timeline-list">
                  {orders.map((order) => (
                    <article
                      className="order-history-card cursor-pointer hover:border-teal-300 hover:shadow-md transition-all duration-300"
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="order-history-top">
                        <div className="order-meta-info">
                          <span className="order-id-label">Order ID: #{order.id}</span>
                          <span className="order-date-text">
                            <Calendar size={11} /> {formatDateTime(order.createdAt)}
                          </span>
                        </div>
                        <span className="order-status-badge">
                          {order.status}
                        </span>
                      </div>

                      {/* Ordered Items Preview: Horizontal Grid with badges */}
                      <div className="flex items-center gap-4 py-3 overflow-x-auto pr-2">
                        {order.items?.map((oItem, oIdx) => (
                          <div key={oIdx} className="relative shrink-0 border border-slate-100 rounded-lg p-1.5 bg-slate-50 flex items-center justify-center">
                            <img src={oItem.image} alt={oItem.name} className="w-12 h-12 object-contain" />
                            <span className="absolute -top-1.5 -right-1.5 bg-slate-800 text-white text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center font-bold">
                              {oItem.quantity || 1}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="order-history-footer flex justify-between items-center mt-3 pt-3 border-t">
                        <div>
                          <span className="grand-total-label">Total Amount Paid</span>
                          <strong className="grand-total-val">{formatCurrency(order.total)}</strong>
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'Dispatched' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkDelivered(order);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-4 py-2 rounded transition-all animate-pulse shadow-sm"
                            >
                              Delivered
                            </button>
                          ) : (
                            (order.status === 'Placed' || order.status === 'Processing') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelOrder(order);
                                }}
                                className="bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold px-4 py-2 rounded hover:bg-rose-100 transition-all shadow-sm"
                              >
                                Cancel Order
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Price Details Card (Flipkart / Amazon Style) */}
          {cartItems.length > 0 && (
            <aside className="cart-right-sidebar">
              <div className="price-details-card">
                <h3 className="sidebar-title">Price Details</h3>
                <div className="price-breakdown-list">
                  <div className="price-row">
                    <span>Price ({priceDetails.totalItems} items)</span>
                    <span>{formatCurrency(priceDetails.subtotal)}</span>
                  </div>
                  <div className="price-row text-green-600 font-semibold">
                    <span>Discount</span>
                    <span>- {formatCurrency(priceDetails.discount)}</span>
                  </div>
                  <div className="price-row">
                    <span>Delivery Charges</span>
                    <span className={priceDetails.deliveryCharges === 0 ? 'text-green-600 font-semibold' : ''}>
                      {priceDetails.deliveryCharges === 0 ? 'FREE' : formatCurrency(priceDetails.deliveryCharges)}
                    </span>
                  </div>
                  <div className="price-row">
                    <span>Secured Packaging Fee</span>
                    <span>{formatCurrency(priceDetails.packagingFee)}</span>
                  </div>
                  <div className="total-amount-row">
                    <span>Total Amount</span>
                    <strong>{formatCurrency(priceDetails.finalAmount)}</strong>
                  </div>
                </div>
                {priceDetails.discount > 0 && (
                  <p className="savings-msg">
                    You will save {formatCurrency(priceDetails.discount)} on this order
                  </p>
                )}
                
                {/* Place Order CTA */}
                <button
                  className="btn-checkout-primary"
                  type="button"
                  onClick={placeOrder}
                >
                  Place Order <ChevronRight size={16} />
                </button>
              </div>

              {/* Security assurances */}
              <div className="security-assurances-card">
                <div className="assurance-item">
                  <Shield size={16} className="text-teal-600" />
                  <span>Safe and Secure Payments</span>
                </div>
                <div className="assurance-item">
                  <CreditCard size={16} className="text-teal-600" />
                  <span>100% Payment Protection</span>
                </div>
              </div>
            </aside>
          )}

        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckoutModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 md:p-8"
            >
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">Delivery Details</h3>
                  <p className="text-xs text-slate-500">Provide shipping address to complete your order</p>
                </div>
              </div>

              <form onSubmit={confirmOrder} className="space-y-4">
                <div>
                  <label htmlFor="checkout-name" className="mb-1 text-xs font-semibold text-slate-700">Full Name *</label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={shippingDetails.name}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="checkout-phone" className="mb-1 text-xs font-semibold text-slate-700">Phone Number (Read-only)</label>
                    <input
                      id="checkout-phone"
                      type="text"
                      disabled
                      value={shippingDetails.phone}
                      className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-city" className="mb-1 text-xs font-semibold text-slate-700">City *</label>
                    <input
                      id="checkout-city"
                      type="text"
                      required
                      placeholder="e.g. Coimbatore"
                      value={shippingDetails.city}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-address" className="mb-1 text-xs font-semibold text-slate-700">Delivering Address *</label>
                  <textarea
                    id="checkout-address"
                    required
                    placeholder="Street address, Flat, Apartment number"
                    value={shippingDetails.address}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-pincode" className="mb-1 text-xs font-semibold text-slate-700">Pincode / ZIP Code *</label>
                  <input
                    id="checkout-pincode"
                    type="text"
                    required
                    placeholder="6-digit pincode"
                    pattern="[0-9]{6}"
                    title="Please enter a valid 6-digit pincode"
                    value={shippingDetails.pincode}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, pincode: e.target.value.replace(/\D/g, '') })}
                  />
                </div>

                <div>
                  <label className="mb-1 text-xs font-semibold text-slate-700">Payment Method *</label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setShippingDetails({ ...shippingDetails, paymentMethod: 'Google Pay' })}
                      className={`text-xs py-2.5 px-3 rounded-xl border font-bold transition-all ${
                        shippingDetails.paymentMethod === 'Google Pay' ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      Google Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingDetails({ ...shippingDetails, paymentMethod: 'PhonePe' })}
                      className={`text-xs py-2.5 px-3 rounded-xl border font-bold transition-all ${
                        shippingDetails.paymentMethod === 'PhonePe' ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      PhonePe
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Amount</p>
                    <strong className="text-xl font-extrabold text-teal-600">{formatCurrency(priceDetails.finalAmount)}</strong>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCheckoutModal(false)}
                      className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-200/50 hover:bg-teal-700 hover:shadow-teal-300/50 transition-all"
                    >
                      Confirm Order
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 md:p-8"
            >
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mb-6 flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Order Details</span>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">Order #{selectedOrder.id}</h3>
                  <p className="mt-1 text-xs text-slate-500">Ordered on {formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                  selectedOrder.status === 'Cancelled'
                    ? 'bg-rose-50 text-rose-600'
                    : selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Scrollable details wrapper */}
              <div className="max-h-[360px] overflow-y-auto pr-2 space-y-6">
                {/* Shipping Details */}
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <MapPin size={12} className="text-teal-600" /> Shipping Address
                  </h4>
                  <p className="text-sm font-semibold text-slate-800">{selectedOrder.customerName || session.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Phone: {selectedOrder.customerPhone || session.phone}</p>
                  {selectedOrder.shippingAddress ? (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.pincode}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2 italic">Standard direct delivery address</p>
                  )}
                </div>

                {/* Items list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Items Ordered</h4>
                  <div className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                        <img src={item.image} alt={item.name} className="h-12 w-12 object-contain rounded-lg bg-slate-50 p-1 border border-slate-100" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            {formatCurrency(item.unitPrice || item.total / (item.quantity || 1))} x {item.quantity || 1}
                          </p>
                        </div>
                        <strong className="text-sm font-bold text-slate-800">{formatCurrency(item.total)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total and Cancel Option */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Amount Paid</p>
                  <strong className="text-xl font-extrabold text-teal-600">{formatCurrency(selectedOrder.total)}</strong>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                  {selectedOrder.status === 'Dispatched' ? (
                    <button
                      type="button"
                      onClick={() => handleMarkDelivered(selectedOrder)}
                      className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 transition-all animate-pulse"
                    >
                      Delivered
                    </button>
                  ) : (
                    selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(selectedOrder)}
                        className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200/50 hover:bg-rose-700 transition-all"
                      >
                        Cancel Order
                      </button>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

export default CustomerCartPage;
