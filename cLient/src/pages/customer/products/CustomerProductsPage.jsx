import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Eye, ShoppingCart, Info, Award, Gift, Clock } from 'lucide-react';
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
  const [addedToCart, setAddedToCart] = useState(null);
  const [loading] = useState(false);

  useEffect(() => {
    if (viewProduct) {
      const updated = products.find(p => p.id === viewProduct.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(viewProduct)) {
        setViewProduct(updated);
      }
    }
  }, [products, viewProduct]);

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
            {filtered.map((product) => {
              const activeOffers = (product.offers || []).filter(o => {
                if (!o.showOffer) return false;
                if (o.validUntil) {
                  const until = new Date(o.validUntil);
                  until.setHours(23, 59, 59, 999);
                  if (until < new Date()) return false;
                }
                return true;
              });

              // Calculate promotional price if Flat Discount or Percentage Discount exists
              let promoPrice = null;
              let discountOffer = null;
              
              for (const offer of activeOffers) {
                if (offer.type === 'Flat Discount' && offer.value > 0) {
                  const candidate = product.price - offer.value;
                  if (candidate > 0 && (!promoPrice || candidate < promoPrice)) {
                    promoPrice = candidate;
                    discountOffer = offer;
                  }
                } else if (offer.type === 'Percentage Discount' && offer.value > 0) {
                  const candidate = product.price - (product.price * (offer.value / 100));
                  if (candidate > 0 && (!promoPrice || candidate < promoPrice)) {
                    promoPrice = candidate;
                    discountOffer = offer;
                  }
                }
              }

              return (
              <article key={product.id} className="premium-product-card relative flex flex-col h-full bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden">
                <div className="card-img-container relative bg-slate-50 overflow-hidden cursor-pointer group" onClick={() => setViewProduct(product)}>
                  {/* Overlay Badges */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-teal-700 text-[10px] font-bold rounded-full shadow-sm uppercase tracking-wider border border-teal-100">
                      {product.category || 'Automation'}
                    </span>
                    {activeOffers.length > 0 && (
                      <span className="px-2.5 py-1 bg-amber-400 text-amber-950 text-[10px] font-bold rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1">
                        <Award size={12} /> {activeOffers.length} Offer{activeOffers.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-56 object-contain p-6 mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.classList.add('card-img-fallback');
                    }}
                  />
                  
                  {/* Hover Quick View */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-slate-800 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg">
                      <Eye size={16} /> Quick View
                    </span>
                  </div>
                </div>

                <div className="card-info flex-1 flex flex-col p-5">
                  <h3 className="card-title text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-teal-600 transition-colors">{product.name}</h3>
                  <p className="card-desc text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
                  
                  {activeOffers.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1.5">
                        {activeOffers.map((offer, idx) => (
                          <div key={idx} className="flex flex-col items-start gap-1">
                            <span className="text-[10px] sm:text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md shadow-sm animate-pulse flex items-center gap-1">
                              <Gift size={12} /> {offer.title}
                            </span>
                            {offer.validUntil && (
                              <span className="text-[9px] sm:text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock size={12} /> Ends: {new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="card-footer p-5 pt-0 mt-auto border-t border-slate-100/60">
                  <div className="card-price-row flex flex-wrap items-baseline gap-2 pt-4 mb-4">
                    {promoPrice ? (
                      <>
                        <span className="text-2xl font-black text-teal-600 tracking-tight">
                          {formatCurrency(promoPrice)}
                        </span>
                        <span className="text-sm text-slate-400 line-through decoration-rose-500 decoration-2 font-bold">
                          {formatCurrency(product.price)}
                        </span>
                        {discountOffer && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded ml-auto">
                            {discountOffer.type === 'Percentage Discount' ? `${discountOffer.value}% OFF` : `FLAT ${formatCurrency(discountOffer.value)} OFF`}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-2xl font-black text-teal-600 tracking-tight">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>

                  <div className="card-btn-group flex gap-2">
                    <button
                      onClick={() => setViewProduct(product)}
                      className="flex-1 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors text-sm flex items-center justify-center gap-1.5"
                      type="button"
                    >
                      <Eye size={16} /> Details
                    </button>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={addedToCart === product.id}
                      className={`flex-1 py-2.5 px-3 font-semibold rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-1.5 ${
                        addedToCart === product.id
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20'
                      }`}
                      type="button"
                    >
                      {addedToCart === product.id ? (
                        <><CheckCircle size={16} /> Added</>
                      ) : (
                        <><ShoppingCart size={16} /> Add to Cart</>
                      )}
                    </button>
                  </div>
                </div>
              </article>
              );
            })}
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
