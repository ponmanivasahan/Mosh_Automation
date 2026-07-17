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
  ChevronRight
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { useAuth } from '../../../utils/AuthContext';
import {
  addNotification,
  addOrder,
  clearCart,
  getCart,
  getOrders,
  setCart
} from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { customerLinks } from '../../../utils/customerLinks';
import './CustomerCartPage.css';

const CustomerCartPage = () => {
  const { session } = useAuth();
  const [cartItems, setCartItems] = useState(getCart());
  const [message, setMessage] = useState('');

  // Auto-dismiss alert messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const orders = getOrders().filter((order) => order.customerPhone === session.phone);

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

    const order = {
      id: `ord-${Date.now()}`,
      customerName: session.name,
      customerPhone: session.phone,
      items: cartItems,
      total: priceDetails.finalAmount,
      createdAt: new Date().toISOString(),
      status: 'Placed'
    };

    addOrder(order);
    addNotification({
      id: `not-${Date.now()}`,
      title: 'New Customer Order',
      message: `${session.name} (${session.phone}) placed an order for ${formatCurrency(priceDetails.finalAmount)}.`,
      createdAt: new Date().toISOString(),
      read: false,
      orderId: order.id
    });

    clearCart();
    setCartItems([]);
    setMessage('Order placed successfully! Support team has been notified.');
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
                    <article className="order-history-card" key={order.id}>
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

                      {/* Miniature Item list inside order card */}
                      <div className="order-items-grid">
                        {order.items?.map((oItem, oIdx) => (
                          <div key={oIdx} className="mini-order-item-row">
                            <img src={oItem.image} alt={oItem.name} className="w-8 h-8 object-contain rounded bg-slate-50 p-0.5 border" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{oItem.name}</p>
                              <span className="text-[10px] text-slate-400 font-semibold">Qty: {oItem.quantity || 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="order-history-footer">
                        <span className="grand-total-label">Total Amount Paid</span>
                        <strong className="grand-total-val">{formatCurrency(order.total)}</strong>
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
    </AppShell>
  );
};

export default CustomerCartPage;
