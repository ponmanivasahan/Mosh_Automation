import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Eye, ShoppingCart, Info, Award } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { getCart, getProducts, setCart, getDbStatus } from '../../../utils/storage';
import { formatCurrency } from '../../../utils/format';
import { customerLinks } from '../../../utils/customerLinks';
import './CustomerProductsPage.css';
import ProductsToolbar from '../../../components/products/ProductsToolbar';
import ProductModal from '../../../components/products/ProductModal';
import CheckoutModal from '../../../components/products/CheckoutModal';

const CustomerProductsPage = () => {
  const [products, setProducts] = useState(() => getProducts());
  const [cartItems, setCartItems] = useState(getCart());
  const [message, setMessage] = useState('');
  const [dbConnected, setDbConnected] = useState(() => getDbStatus());

  useEffect(() => {
    const syncProducts = () => {
      setProducts(getProducts());
      setDbConnected(getDbStatus());
    };
    const interval = setInterval(syncProducts, 1000);
    window.addEventListener('storage', syncProducts);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncProducts);
    };
  }, []);
  const [filters, setFilters] = useState({ q: '', category: '', sort: 'newest' });
  const [viewProduct, setViewProduct] = useState(null);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [loading] = useState(false);

  // Auto-dismiss the success message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
    setMessage(`Added ${product.name} to cart successfully.`);
  };

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    let out = products.slice();
    const q = filters.q?.toLowerCase?.() || '';
    if (q) out = out.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q));
    if (filters.category) out = out.filter((p) => p.category === filters.category);
    if (filters.sort === 'price-asc') out.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (filters.sort === 'price-desc') out.sort((a, b) => (b.price || 0) - (a.price || 0));
    return out;
  }, [products, filters]);

  const placeOrderFromModal = (order) => {
    const currentCart = getCart();
    const item = {
      id: `order-${Date.now()}-${order.productId}`,
      source: 'order',
      productId: order.productId,
      name: order.name,
      description: '',
      image: order.image,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      total: order.total
    };

    const nextCart = [item, ...currentCart];
    setCart(nextCart);
    setCartItems(nextCart);
    setMessage(`Order placed: ${item.name} x ${item.quantity} — ${formatCurrency(item.total)}`);
  };

  return (
    <AppShell title="Products & Solutions" links={customerLinks}>
      {!dbConnected ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-rose-50 border border-rose-100 rounded-2xl m-4">
          <p className="text-sm font-bold text-rose-600">Unable to load data from server. Please try again.</p>
        </div>
      ) : (
        <div className="customer-products-container">
        {/* Page header with kicker */}
        <div className="products-page-header">
          <div>
            <p className="eyebrow">Explore solutions</p>
            <h2>Automation Catalog</h2>
            <p>Select and order state-of-the-art water level controller solutions tailored for your requirements.</p>
          </div>
          <ProductsToolbar filters={filters} onChange={setFilters} categories={categories} />
        </div>

        {/* Loading state / Grid state */}
        {loading ? (
          <div className="new-products-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="new-products-grid">
            {filtered.map((product) => (
              <article key={product.id} className="premium-product-card">
                <div className="card-badge-row">
                  <span className="card-badge">{product.category || 'Automation'}</span>
                </div>

                <div className="card-img-container">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="card-product-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('card-img-fallback');
                    }}
                  />
                </div>

                <div className="card-info">
                  <h3 className="card-title">{product.name}</h3>
                  <p className="card-desc">{product.description}</p>
                </div>

                <div className="card-footer">
                  <div className="card-price-row">
                    <span className="price-label">Price</span>
                    <span className="price-value">{formatCurrency(product.price)}</span>
                  </div>

                  <div className="card-btn-group">
                    <button
                      onClick={() => setViewProduct(product)}
                      className="btn-card-view"
                      type="button"
                    >
                      <Eye size={16} /> Details
                    </button>
                    <button
                      onClick={() => addToCart(product)}
                      className="btn-card-add"
                      type="button"
                    >
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-slate-800">No Products Found</h3>
            <p className="mt-2 text-slate-500">We couldn't find matches for current filters.</p>
            <button
              onClick={() => setFilters({ q: '', category: '', sort: 'newest' })}
              className="mt-6 btn btn-outline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Alert Notification Toast */}
        {message && (
          <div className="toast-alert">
            <Award size={18} />
            <span>{message}</span>
          </div>
        )}

        <ProductModal
          open={!!viewProduct}
          onClose={() => setViewProduct(null)}
          product={viewProduct}
          onAdd={(p) => {
            addToCart(p);
            setViewProduct(null);
          }}
        />
        <CheckoutModal
          open={!!checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          product={checkoutProduct}
          onPlace={(order) => {
            placeOrderFromModal(order);
            setCheckoutProduct(null);
          }}
        />
      </div>
      )}
    </AppShell>
  );
};

export default CustomerProductsPage;
