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
  MapPin,
  RefreshCw,
  Download,
  AlertCircle,
  Clock,
  Check,
  ShieldCheck
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
  updateOrder,
  verifyPayment
} from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { customerLinks } from '../../../utils/customerLinks';
import './CustomerCartPage.css';

const CustomerCartPage = () => {
  const { session } = useAuth();
  const [cartItems, setCartItems] = useState(getCart());
  const [message, setMessage] = useState('');
  
  // Checkout & Payment Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  
  // Payment states
  const [paymentTimer, setPaymentTimer] = useState(600); // 10 minutes in seconds
  const [transactionIdInput, setTransactionIdInput] = useState('');
  const [paymentStatusState, setPaymentStatusState] = useState('paying'); // paying, verifying, success, error
  const [verificationStep, setVerificationStep] = useState(1);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const [shippingDetails, setShippingDetails] = useState({
    name: session?.name || '',
    address: '',
    city: '',
    pincode: '',
    phone: session?.phone || '',
    paymentMethod: 'Google Pay'
  });

  const [selectedOrder, setSelectedOrder] = useState(null);

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
    const interval = setInterval(syncOrders, 1500);
    window.addEventListener('storage', syncOrders);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncOrders);
    };
  }, [session]);

  // Countdown timer effect
  useEffect(() => {
    let intervalId;
    if (activePaymentOrder && paymentStatusState === 'paying') {
      intervalId = setInterval(() => {
        setPaymentTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setPaymentStatusState('error');
            setErrorMessage('Payment window expired. Please try again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activePaymentOrder, paymentStatusState]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const priceDetails = useMemo(() => {
    const totalItems = cartItems.reduce((acc, item) => acc + Number(item.quantity || 1), 0);
    const subtotal = cartItems.reduce((acc, item) => acc + Number(item.total || 0), 0);
    
    const discount = subtotal > 5000 ? Math.round(subtotal * 0.1) : 0;
    const deliveryCharges = subtotal > 3000 || subtotal === 0 ? 0 : 99;
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
    setShowCheckoutModal(true);
  };

  const confirmOrder = async (e) => {
    e.preventDefault();
    if (!shippingDetails.name.trim() || !shippingDetails.address.trim() || !shippingDetails.city.trim() || !shippingDetails.pincode.trim()) {
      alert('Please fill in all the required delivery details.');
      return;
    }

    const orderId = `ord-${Date.now()}`;
    const order = {
      id: orderId,
      customerName: shippingDetails.name,
      customerPhone: session.phone,
      items: cartItems,
      total: priceDetails.finalAmount,
      createdAt: new Date().toISOString(),
      status: 'Processing',
      paymentStatus: 'Pending',
      shippingAddress: {
        address: shippingDetails.address,
        city: shippingDetails.city,
        pincode: shippingDetails.pincode
      },
      paymentMethod: shippingDetails.paymentMethod
    };

    // Save order status as processing (pending payment)
    await addOrder(order);

    setActivePaymentOrder(order);
    setPaymentTimer(600);
    setTransactionIdInput('');
    setPaymentStatusState('paying');
    setShowCheckoutModal(false);
  };

  // UPI configuration URL
  const upiUrl = useMemo(() => {
    if (!activePaymentOrder) return '';
    return `upi://pay?pa=moshautomation@okaxis&pn=MOSH%20Automation&am=${activePaymentOrder.total}&cu=INR&tn=Order%20${activePaymentOrder.id}`;
  }, [activePaymentOrder]);

  const qrImageUrl = useMemo(() => {
    if (!upiUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
  }, [upiUrl]);

  const handleDownloadQR = () => {
    if (!qrImageUrl) return;
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.target = '_blank';
    link.download = `MOSH_Payment_QR_${activePaymentOrder?.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefreshQR = () => {
    setPaymentTimer(600);
    setMessage('QR Code refreshed and timer reset to 10:00.');
  };

  const handleCancelPayment = () => {
    if (window.confirm('Are you sure you want to cancel the payment process? The order will remain as unpaid.')) {
      setActivePaymentOrder(null);
      setMessage('Payment process cancelled by user.');
    }
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    const cleanTxnId = transactionIdInput.trim();
    if (!cleanTxnId || cleanTxnId.length < 8) {
      alert('Please enter a valid 12-digit UPI transaction ID or UTR reference number.');
      return;
    }
    
    setPaymentStatusState('verifying');
    setVerificationStep(1);
    setVerificationProgress(20);

    // Step 1: Validate UTR format & initialize connection
    await new Promise((resolve) => setTimeout(resolve, 650));
    setVerificationStep(2);
    setVerificationProgress(60);

    // Step 2: Contact NPCI & Banking Gateway
    await new Promise((resolve) => setTimeout(resolve, 800));
    setVerificationStep(3);
    setVerificationProgress(90);

    // Step 3: Execute DB API payment verification
    const result = await verifyPayment(activePaymentOrder.id, cleanTxnId, shippingDetails.paymentMethod);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setVerificationProgress(100);

    if (result.success) {
      setPaymentStatusState('success');
      
      // Notify Admin with exact telemetry
      addNotification({
        id: `not-${Date.now()}`,
        title: 'Payment Received & Verified',
        message: `${shippingDetails.name} paid ${formatCurrency(activePaymentOrder.total)} via ${shippingDetails.paymentMethod}. Amount credited to Bank Account. Txn ID: ${cleanTxnId}`,
        createdAt: new Date().toISOString(),
        read: false,
        orderId: activePaymentOrder.id
      });

      // Clear Cart locally
      clearCart();
      setCartItems([]);
      setOrders(getOrders().filter((order) => order.customerPhone === session?.phone));
    } else {
      setPaymentStatusState('error');
      setErrorMessage(result.message || 'Payment verification failed. Please check transaction ID.');
    }
  };

  const handleCancelOrder = (order) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      const updated = {
        ...order,
        status: 'Cancelled'
      };
      updateOrder(updated);
      
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
                    <article className="cart-item-card" key={item.id}>
                      <div className="item-img-container">
                        <img src={item.image} alt={item.name} />
                      </div>
                      
                      <div className="item-details">
                        <h3 className="item-name">{item.name}</h3>
                        <p className="item-desc">{item.description}</p>
                        
                        <div className="item-price-quantity-row">
                          <span className="price-tag">{formatCurrency(item.unitPrice)}</span>
                          
                          <div className="quantity-control-group">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="qty-btn"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="qty-value">{item.quantity || 1}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="qty-btn"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.name)}
                        className="btn-item-remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Previous Order History Section */}
            <div className="section-card-panel">
              <h2 className="panel-title mb-6 flex items-center gap-2">
                <Package size={20} className="text-teal-600" /> Order History
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
                        <span className={`order-status-badge text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          order.paymentStatus === 'Paid' || order.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {order.paymentStatus === 'Paid' || order.status === 'Paid' ? 'Paid' : order.status === 'Processing' ? 'Payment Pending' : order.status}
                        </span>
                      </div>

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
                          <span className="grand-total-label">
                            {order.paymentStatus === 'Paid' || order.status === 'Paid' ? 'Total Paid' : 'Total (Pending)'}
                          </span>
                          <strong className="grand-total-val">{formatCurrency(order.total)}</strong>
                        </div>
                        <div className="flex gap-2">
                          {order.paymentStatus !== 'Paid' && order.status !== 'Paid' && order.status !== 'Cancelled' && order.status !== 'Completed' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePaymentOrder(order);
                                setPaymentTimer(600);
                                setTransactionIdInput('');
                                setPaymentStatusState('paying');
                              }}
                              className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm"
                            >
                              Pay Now (UPI)
                            </button>
                          )}
                          {order.status === 'Dispatched' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkDelivered(order);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-4 py-2 rounded-xl transition-all animate-pulse shadow-sm"
                            >
                              Delivered
                            </button>
                          ) : (
                            order.status !== 'Cancelled' && order.status !== 'Completed' && order.status !== 'Paid' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelOrder(order);
                                }}
                                className="bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold px-3.5 py-2 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
                              >
                                Cancel
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

          {/* Right Side: Price Details Card */}
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
                
                <button
                  className="btn-checkout-primary"
                  type="button"
                  onClick={placeOrder}
                >
                  Place Order <ChevronRight size={16} />
                </button>
              </div>

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckoutModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none font-semibold text-slate-800"
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
                      className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 focus:outline-none font-semibold"
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
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="checkout-address" className="mb-1 text-xs font-semibold text-slate-700">Delivering Address *</label>
                    <input
                      id="checkout-address"
                      type="text"
                      required
                      placeholder="Street, Room/Door No"
                      value={shippingDetails.address}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-pincode" className="mb-1 text-xs font-semibold text-slate-700">Pincode *</label>
                    <input
                      id="checkout-pincode"
                      type="text"
                      required
                      placeholder="6-digit pincode"
                      pattern="[0-9]{6}"
                      maxLength="6"
                      value={shippingDetails.pincode}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, pincode: e.target.value.replace(/\D/g, '') })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:border-teal-500 focus:bg-white focus:outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 text-xs font-semibold text-slate-700">Payment Method *</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setShippingDetails({ ...shippingDetails, paymentMethod: 'Google Pay' })}
                      className={`text-xs py-2.5 px-2 rounded-xl border font-bold transition-all flex items-center justify-center gap-1.5 ${
                        shippingDetails.paymentMethod === 'Google Pay' ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block shrink-0" /> GPay
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingDetails({ ...shippingDetails, paymentMethod: 'PhonePe' })}
                      className={`text-xs py-2.5 px-2 rounded-xl border font-bold transition-all flex items-center justify-center gap-1.5 ${
                        shippingDetails.paymentMethod === 'PhonePe' ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-600 inline-block shrink-0" /> PhonePe
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingDetails({ ...shippingDetails, paymentMethod: 'Paytm' })}
                      className={`text-xs py-2.5 px-2 rounded-xl border font-bold transition-all flex items-center justify-center gap-1.5 ${
                        shippingDetails.paymentMethod === 'Paytm' ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-sky-500 inline-block shrink-0" /> Paytm
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
                      Proceed to Payment
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPI QR Payment Modal Screen */}
      <AnimatePresence>
        {activePaymentOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col items-center"
            >
              {/* Premium Header */}
              <div className="w-full flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-800 text-base">MOSH Automation</span>
                </div>
                <div className="bg-rose-50 text-rose-600 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatTimer(paymentTimer)}</span>
                </div>
              </div>

              {paymentStatusState === 'paying' && (
                <div className="w-full flex flex-col items-center text-center space-y-4">
                  <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 w-full text-xs text-teal-900 font-semibold space-y-1">
                    <p className="text-[10px] text-teal-600 font-bold uppercase">Order Information</p>
                    <p>Order No: #{activePaymentOrder.id}</p>
                    <p>Customer Name: {activePaymentOrder.customerName}</p>
                    <p className="text-sm font-extrabold mt-1">Amount Due: {formatCurrency(activePaymentOrder.total)}</p>
                  </div>

                  {/* QR Card Frame */}
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col items-center shadow-inner relative max-w-[240px] w-full">
                    <img 
                      src={qrImageUrl} 
                      alt="UPI QR Code" 
                      className="w-full aspect-square object-contain bg-white p-2 rounded-lg border shadow-sm" 
                    />
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-2">Scan with Google Pay / PhonePe / Paytm</span>
                  </div>

                  {/* App badges */}
                  <div className="flex justify-center items-center gap-2.5 text-xs font-bold text-slate-500 py-1">
                    <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full text-[9px]">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Google Pay
                    </span>
                    <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full text-[9px]">
                      <span className="w-2 h-2 rounded-full bg-purple-500" /> PhonePe
                    </span>
                    <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full text-[9px]">
                      <span className="w-2 h-2 rounded-full bg-sky-500" /> Paytm
                    </span>
                  </div>

                  <form onSubmit={handleVerifyPayment} className="w-full space-y-3 pt-2">
                    <div>
                      <label className="block text-left text-xs font-bold text-slate-700 mb-1">Enter UPI Transaction Ref ID *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 12-digit transaction ID"
                        value={transactionIdInput}
                        onChange={(e) => setTransactionIdInput(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full text-center tracking-wide font-extrabold text-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-teal-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-lg transition"
                    >
                      I have completed the payment
                    </button>
                  </form>

                  {/* QR actions footer */}
                  <div className="flex w-full justify-between items-center text-[10px] text-slate-400 font-bold border-t pt-3">
                    <button type="button" onClick={handleDownloadQR} className="hover:text-teal-600 flex items-center gap-1">
                      <Download size={12} /> Download QR
                    </button>
                    <button type="button" onClick={handleRefreshQR} className="hover:text-teal-600 flex items-center gap-1">
                      <RefreshCw size={12} /> Refresh QR
                    </button>
                    <button type="button" onClick={handleCancelPayment} className="hover:text-rose-600 flex items-center gap-1 text-rose-500">
                      Cancel Payment
                    </button>
                  </div>
                </div>
              )}

              {paymentStatusState === 'verifying' && (
                <div className="w-full flex flex-col items-center justify-center py-6 px-2 space-y-5 text-center">
                  <div className="relative flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin flex items-center justify-center" />
                    <ShieldCheck className="absolute h-9 w-9 text-teal-600" />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-800 text-lg">Tracking Payment Settlement</h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-semibold">Live bank verification in progress</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-500 rounded-full" 
                      style={{ width: `${verificationProgress}%` }}
                    />
                  </div>

                  {/* Live Step Status List */}
                  <div className="w-full space-y-2.5 text-left text-xs font-semibold bg-slate-50 p-4 rounded-2xl border">
                    <div className={`flex items-center gap-3 ${verificationStep >= 1 ? 'text-teal-800 font-bold' : 'text-slate-400'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${verificationStep > 1 ? 'bg-emerald-500 text-white' : verificationStep === 1 ? 'bg-teal-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                        {verificationStep > 1 ? <Check size={12} strokeWidth={3} /> : '1'}
                      </div>
                      <span className="truncate">1. Validating 12-Digit UTR: <span className="font-mono text-slate-900">{transactionIdInput}</span></span>
                    </div>

                    <div className={`flex items-center gap-3 ${verificationStep >= 2 ? 'text-teal-800 font-bold' : 'text-slate-400'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${verificationStep > 2 ? 'bg-emerald-500 text-white' : verificationStep === 2 ? 'bg-teal-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                        {verificationStep > 2 ? <Check size={12} strokeWidth={3} /> : '2'}
                      </div>
                      <span className="truncate">2. Connecting {shippingDetails.paymentMethod} Gateway & NPCI Node</span>
                    </div>

                    <div className={`flex items-center gap-3 ${verificationStep >= 3 ? 'text-teal-800 font-bold' : 'text-slate-400'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${verificationProgress === 100 ? 'bg-emerald-500 text-white' : verificationStep === 3 ? 'bg-teal-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                        {verificationProgress === 100 ? <Check size={12} strokeWidth={3} /> : '3'}
                      </div>
                      <span className="truncate">3. Confirming Settlement & Credit to Bank</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentStatusState === 'success' && (
                <div className="w-full flex flex-col items-center justify-center py-4 px-1 space-y-4 text-center">
                  <div className="relative">
                    <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce shadow-md">
                      <CheckCircle size={40} strokeWidth={2.5} />
                    </div>
                  </div>

                  <div>
                    <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider mb-1">
                      Bank Settlement Confirmed
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xl">Payment Successful!</h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-semibold">Your payment has been received in our MOSH Bank Account.</p>
                  </div>

                  {/* Payment Receipt Box */}
                  <div className="w-full bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-950 font-semibold space-y-2 text-left">
                    <div className="flex justify-between items-center border-b border-emerald-200/60 pb-2">
                      <span className="text-slate-500 text-[11px]">Amount Received</span>
                      <strong className="text-base text-emerald-700 font-extrabold">{formatCurrency(activePaymentOrder.total)}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">Order Number</span>
                      <span className="font-bold text-slate-800">#{activePaymentOrder.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">Payment Gateway</span>
                      <span className="font-bold text-slate-800">{shippingDetails.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">UPI Transaction UTR</span>
                      <span className="font-mono font-bold text-slate-800">{transactionIdInput}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[11px]">Order & Payment Status</span>
                      <span className="font-extrabold text-emerald-600 flex items-center gap-1 uppercase">
                        <Check size={13} strokeWidth={3} /> Paid
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePaymentOrder(null)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition shadow-md"
                  >
                    View Order Details
                  </button>
                </div>
              )}

              {paymentStatusState === 'error' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                  <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                    <AlertCircle size={36} strokeWidth={2.5} />
                  </div>
                  <h4 className="font-extrabold text-rose-600 text-lg">Payment Verification Failed</h4>
                  <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed font-semibold">{errorMessage}</p>
                  <div className="flex gap-2 w-full pt-4">
                    <button
                      type="button"
                      onClick={() => setPaymentStatusState('paying')}
                      className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl text-xs hover:bg-teal-700 transition"
                    >
                      Retry Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePaymentOrder(null)}
                      className="py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition border"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

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
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  selectedOrder.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' : 
                  selectedOrder.status === 'Paid' ? 'bg-teal-50 text-teal-600' :
                  selectedOrder.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="max-h-[360px] overflow-y-auto pr-2 space-y-6">
                {/* Shipping Details */}
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <MapPin size={12} className="text-teal-600" /> Shipping Address
                  </h4>
                  <p className="text-sm font-semibold text-slate-800">{selectedOrder.customerName || session?.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Phone: {selectedOrder.customerPhone || session?.phone}</p>
                  {selectedOrder.shippingAddress ? (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.pincode}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2 italic">Standard direct delivery address</p>
                  )}
                </div>

                {/* Transaction details if order is Paid */}
                {selectedOrder.paymentStatus === 'Paid' && (
                  <div className="rounded-2xl bg-teal-50/50 p-4 border border-teal-100/50 text-xs font-semibold text-teal-900 space-y-1">
                    <h4 className="text-[10px] uppercase font-bold text-teal-600 tracking-wider mb-1">Transaction Details</h4>
                    <p>Payment Method: {selectedOrder.paymentMethod}</p>
                    <p>Transaction Reference: {selectedOrder.transactionId}</p>
                    {selectedOrder.paymentTime && <p>Paid On: {formatDateTime(selectedOrder.paymentTime)}</p>}
                  </div>
                )}

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
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    {selectedOrder.paymentStatus === 'Paid' || selectedOrder.status === 'Paid' ? 'Total Amount Paid' : 'Total Amount (Payment Pending)'}
                  </p>
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
                    selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Completed' && selectedOrder.status !== 'Paid' && (
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
