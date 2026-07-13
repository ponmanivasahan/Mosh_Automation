import { useMemo, useState } from 'react';
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
import './CustomerCartPage.css';

const customerLinks = [
  { to: '/customer/products', label: 'Products' },
  { to: '/customer/cart', label: 'Cart & Order Details' }
];

const CustomerCartPage = () => {
  const { session } = useAuth();
  const [cartItems, setCartItems] = useState(getCart());
  const [message, setMessage] = useState('');

  const orders = getOrders().filter((order) => order.customerPhone === session.phone);

  const total = useMemo(
    () => cartItems.reduce((acc, item) => acc + Number(item.total || 0), 0),
    [cartItems]
  );

  const removeItem = (id) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCart(updated);
    setCartItems(updated);
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
      total,
      createdAt: new Date().toISOString(),
      status: 'Placed'
    };

    addOrder(order);
    addNotification({
      id: `not-${Date.now()}`,
      title: 'New Customer Order',
      message: `${session.name} (${session.phone}) placed an order for ${formatCurrency(total)}.`,
      createdAt: new Date().toISOString(),
      read: false,
      orderId: order.id
    });

    clearCart();
    setCartItems([]);
    setMessage('Order placed successfully. Admin has been notified.');
  };

  return (
    <AppShell title="Cart And Order Details" links={customerLinks}>
      <section className="panel customer-cart-page">
        <h2>Current Cart</h2>
        {!cartItems.length && <p>No items in cart.</p>}

        <div className="stack">
          {cartItems.map((item) => (
            <article className="row-card" key={item.id}>
              <div>
                <h3>{item.name}</h3>
                <p>
                  Qty: {item.quantity} | Complexity: {item.complexity}
                </p>
                <p>Total: {formatCurrency(item.total)}</p>
              </div>
              <button className="btn btn-ghost" type="button" onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </article>
          ))}
        </div>

        <div className="panel-footer">
          <h3>Grand Total: {formatCurrency(total)}</h3>
          <button className="btn btn-primary" type="button" onClick={placeOrder}>
            Place Order
          </button>
        </div>

        {message && <p className="success-text">{message}</p>}
      </section>

      <section className="panel customer-cart-page">
        <h2>Your Previous Orders</h2>
        {!orders.length && <p>No previous orders yet.</p>}

        <div className="stack">
          {orders.map((order) => (
            <article className="row-card" key={order.id}>
              <div>
                <h3>Order #{order.id}</h3>
                <p>{formatDateTime(order.createdAt)}</p>
                <p>Status: {order.status}</p>
              </div>
              <strong>{formatCurrency(order.total)}</strong>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default CustomerCartPage;
