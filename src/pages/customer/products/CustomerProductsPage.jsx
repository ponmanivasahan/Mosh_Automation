import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import AppShell from '../../../components/AppShell';
import { getCart, getProducts, setCart } from '../../../utils/storage';
import { formatCurrency } from '../../../utils/format';
import './CustomerProductsPage.css';

const customerLinks = [
  { to: '/customer/dashboard', label: 'Dashboard' },
  { to: '/customer/cart', label: 'Cart & Order Details' }
];

const CustomerProductsPage = () => {
  const products = getProducts();
  const [cartItems, setCartItems] = useState(getCart());
  const [message, setMessage] = useState('');

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.quantity || 1), 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.total || 0), 0),
    [cartItems]
  );

  const addToCart = (product) => {
    const currentCart = getCart();
    const existing = currentCart.find((item) => item.productId === product.id && item.source === 'catalog');
    const nextCart = existing
      ? currentCart.map((item) =>
          item.productId === product.id && item.source === 'catalog'
            ? {
                ...item,
                quantity: Number(item.quantity || 1) + 1,
                total: (Number(item.quantity || 1) + 1) * Number(item.unitPrice || product.price)
              }
            : item
        )
      : [
          {
            id: `cart-${Date.now()}-${product.id}`,
            source: 'catalog',
            productId: product.id,
            name: product.name,
            description: product.description,
            image: product.image,
            quantity: 1,
            unitPrice: product.price,
            total: product.price
          },
          ...currentCart
        ];

    setCart(nextCart);
    setCartItems(nextCart);
    setMessage(`${product.name} added to cart.`);
  };

  return (
    <AppShell title="Customer Dashboard" links={customerLinks}>
      <section className="panel split customer-products-page">
        <article>
          <div className="panel-head">
            <h2>Product Catalog</h2>
            <Link to="/customer/cart" className="btn btn-primary">
              Go to Cart ({cartCount})
            </Link>
          </div>

          <div className="grid cards customer-product-grid">
            {products.map((product) => (
              <article key={product.id} className="card customer-product-card">
                <img className="product-image" src={product.image} alt={product.name} />
                <div className="card-body">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <p className="price">{formatCurrency(product.price)}</p>
                </div>
                <div className="card-actions">
                  <button className="btn btn-primary" type="button" onClick={() => addToCart(product)}>
                    Add to Cart
                  </button>
                  <Link className="btn btn-outline" to={`/customer/products/${product.id}`}>
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {message && <p className="success-text">{message}</p>}
        </article>

        <aside className="catalog-summary-card">
          <div className="summary-head">
            <h2>Order Summary</h2>
            <p>{cartCount} item(s) in cart</p>
          </div>

          <div className="stack summary-items">
            {cartItems.length ? (
              cartItems.slice(0, 4).map((item) => (
                <article className="mini-card" key={item.id}>
                  <img className="mini-card-image" src={item.image} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <p>Qty: {item.quantity || 1}</p>
                    <p>{formatCurrency(item.total)}</p>
                  </div>
                </article>
              ))
            ) : (
              <p>No items in cart yet.</p>
            )}
          </div>

          <div className="summary-footer">
            <strong>Total: {formatCurrency(cartTotal)}</strong>
            <Link to="/customer/cart" className="btn btn-primary">
              Open Cart
            </Link>
          </div>
        </aside>
      </section>
    </AppShell>
  );
};

export default CustomerProductsPage;
