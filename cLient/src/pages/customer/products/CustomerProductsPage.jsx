import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Eye, ShoppingCart, Info, Award, Gift, Clock, CheckCircle } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { getCart, getProducts, setCart, getDbStatus } from '../../../utils/storage';
import { formatCurrency } from '../../../utils/format';
import { API_URL } from '../../../utils/api';
import { customerLinks } from '../../../utils/customerLinks';
import ProductsToolbar from '../../../components/products/ProductsToolbar';
import ProductModal from '../../../components/products/ProductModal';
import CheckoutModal from '../../../components/products/CheckoutModal';

import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';

const CustomerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(getCart());
  const [message, setMessage] = useState('');
  const [dbConnected, setDbConnected] = useState(() => getDbStatus());

  useEffect(() => {
    let isMounted = true;
    const fetchLiveProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            setProducts(data.products || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch live products:', err);
      }
    };

    fetchLiveProducts();

    const syncCart = () => {
      setCartItems(getCart());
      setDbConnected(getDbStatus());
    };

    const interval = setInterval(() => {
      syncCart();
      fetchLiveProducts();
    }, 5000);

    window.addEventListener('storage', syncCart);
    window.addEventListener('mosh_cart_updated', syncCart);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('mosh_cart_updated', syncCart);
    };
  }, []);
  const [filters, setFilters] = useState({ q: '', category: '', sort: 'newest' });
  const [viewProduct, setViewProduct] = useState(null);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [addedToCart, setAddedToCart] = useState(null);
  const [loading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.selectedProduct && products.length > 0 && !viewProduct) {
      const p = products.find(x => x.id === location.state.selectedProduct);
      if (p) {
        setViewProduct(p);
        // Clear state so it doesn't reopen if they refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, products, viewProduct]);

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
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
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
        <EmptyState 
          icon={Award}
          title="Connection Error"
          description="Unable to load data from server. Please try again."
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header with kicker */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <p className="text-teal-600 font-bold uppercase tracking-wider text-sm mb-2">Explore solutions</p>
            <h2 className="text-3xl font-extrabold text-neutral-900 mb-3">Automation Catalog</h2>
            <p className="text-neutral-500 max-w-2xl">Select and order state-of-the-art water level controller solutions tailored for your requirements.</p>
          </div>
          <ProductsToolbar filters={filters} onChange={setFilters} categories={categories} />
        </div>

        {/* Loading state / Grid state */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96 w-full" variant="rectangular" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <Card key={product.id} hover className="flex flex-col h-full group">
                <div className="relative bg-neutral-50 overflow-hidden cursor-pointer" onClick={() => setViewProduct(product)}>
                  {/* Overlay Badges */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
                    <Badge variant="primary" className="shadow-sm">
                      {product.category || 'Automation'}
                    </Badge>
                    {activeOffers.length > 0 && (
                      <Badge variant="warning" className="shadow-sm flex items-center gap-1">
                        <Award size={12} /> {activeOffers.length} Offer{activeOffers.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-56 object-contain p-6 mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  
                  {/* Hover Quick View */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 backdrop-blur-sm text-neutral-800 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-md">
                      <Eye size={16} /> Quick View
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col p-5">
                  <h3 className="text-lg font-bold text-neutral-900 line-clamp-1 group-hover:text-teal-700 transition-colors">{product.name}</h3>
                  <p className="text-sm text-neutral-500 mt-2 line-clamp-2 leading-relaxed">{product.description}</p>
                  
                  {activeOffers.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                        {activeOffers.map((offer, idx) => (
                          <div key={idx} className="flex flex-col items-start gap-1">
                            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-teal-100">
                              <Gift size={12} /> {offer.title}
                            </span>
                            {offer.validUntil && (
                              <span className="text-[10px] text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock size={10} /> Ends: {new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="p-5 pt-0 mt-auto border-t border-neutral-100">
                  <div className="flex flex-wrap items-baseline gap-2 pt-4 mb-5">
                    {promoPrice ? (
                      <>
                        <span className="text-2xl font-black text-teal-700 tracking-tight">
                          {formatCurrency(promoPrice)}
                        </span>
                        <span className="text-sm text-neutral-400 line-through decoration-red-400 decoration-2 font-semibold">
                          {formatCurrency(product.price)}
                        </span>
                        {discountOffer && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md ml-auto">
                            {discountOffer.type === 'Percentage Discount' ? `${discountOffer.value}% OFF` : `FLAT ${formatCurrency(discountOffer.value)} OFF`}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-2xl font-black text-teal-700 tracking-tight">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setViewProduct(product)}
                      className="flex-1"
                    >
                      <Eye size={16} className="mr-1.5" /> Details
                    </Button>
                    <Button
                      variant={addedToCart === product.id ? "secondary" : "primary"}
                      onClick={() => addToCart(product)}
                      disabled={addedToCart === product.id}
                      className={addedToCart === product.id ? "flex-1 !bg-green-600 !text-white !border-transparent hover:!bg-green-700" : "flex-1"}
                    >
                      {addedToCart === product.id ? (
                        <><CheckCircle size={16} className="mr-1.5" /> Added</>
                      ) : (
                        <><ShoppingCart size={16} className="mr-1.5" /> Add</>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon={Info}
            title="No Products Found"
            description="We couldn't find matches for current filters."
            action={
              <Button variant="secondary" onClick={() => setFilters({ q: '', category: '', sort: 'newest' })}>
                Reset Filters
              </Button>
            }
          />
        )}

        {/* Alert Notification Toast */}
        {message && (
          <div className="fixed bottom-6 right-6 bg-teal-800 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
            <Award size={20} className="text-teal-200" />
            <span className="font-medium text-sm">{message}</span>
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
