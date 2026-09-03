import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Eye, ShoppingCart, Info, Award, CheckCircle, Search, Heart, ChevronRight, ShieldCheck, Zap, HeadphonesIcon, Truck, Package } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { getCart, getProducts, setCart, getDbStatus } from '../../../utils/storage';
import { formatCurrency } from '../../../utils/format';
import { API_URL } from '../../../utils/api';
import { customerLinks } from '../../../utils/customerLinks';
import ProductModal from '../../../components/products/ProductModal';

import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';

const CustomerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(getCart());
  const [message, setMessage] = useState('');
  const [dbConnected, setDbConnected] = useState(() => getDbStatus());
  const [loading, setLoading] = useState(true);

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
      } finally {
        if(isMounted) setLoading(false);
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
  
  const [filters, setFilters] = useState({ q: '', category: '' });
  const [viewProduct, setViewProduct] = useState(null);
  const [addedToCart, setAddedToCart] = useState(null);

  useEffect(() => {
    if (viewProduct) {
      const updated = products.find(p => p.id === viewProduct.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(viewProduct)) {
        setViewProduct(updated);
      }
    }
  }, [products, viewProduct]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
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
    const counts = { 'All Categories': products.length };
    products.forEach((p) => {
      const cat = p.category || 'Automation';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => {
      if(a[0] === 'All Categories') return -1;
      if(b[0] === 'All Categories') return 1;
      return b[1] - a[1];
    });
  }, [products]);

  const filtered = useMemo(() => {
    let out = products.slice();
    const q = filters.q?.toLowerCase?.() || '';
    if (q) out = out.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q));
    if (filters.category && filters.category !== 'All Categories') out = out.filter((p) => (p.category || 'Automation') === filters.category);
    return out;
  }, [products, filters]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedProducts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <AppShell title="Products" links={customerLinks}>
      <div className="animate-fade-in space-y-6 pb-20">
        
        {/* Top Header */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-neutral-900">Products & Solutions</h1>
          <div className="flex items-center text-sm text-neutral-500 mt-2 gap-2">
            <Link to="/customer/dashboard" className="text-primary font-medium hover:underline">Home</Link>
            <ChevronRight size={14} />
            <span>Products & Solutions</span>
          </div>
        </div>

        {/* Hero Banner with overlapping search bar */}
        <div className="relative mb-12">
          {/* Background Card */}
          <div className="relative bg-[#f6f9f7] rounded-3xl overflow-hidden min-h-[220px] flex items-center p-8 md:p-12 pb-16">
            <div 
              className="absolute right-0 top-0 bottom-0 w-2/3 z-0 opacity-80 mix-blend-multiply"
              style={{ 
                backgroundImage: 'url(/automation-bg.png)', 
                backgroundPosition: 'center', 
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                maskImage: 'linear-gradient(to right, transparent, black 40%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)'
              }}
            />
            
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#115e41] mb-3">
                Automation Catalog
              </h2>
              <p className="text-neutral-600 text-base max-w-md leading-relaxed">
                Select and order state-of-the-art water level controller solutions tailored for your requirements.
              </p>
            </div>
          </div>

          {/* Floating Search Bar */}
          <div className="absolute -bottom-6 left-8 max-w-3xl z-20 w-full pr-16">
            <Card className="p-2 flex flex-col md:flex-row items-center gap-3 shadow-lg shadow-neutral-200/50 rounded-2xl bg-white border border-neutral-100">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={filters.q}
                  onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3 bg-transparent border-none rounded-xl text-sm focus:outline-none focus:ring-0"
                />
              </div>
              <div className="h-8 w-px bg-neutral-200 hidden md:block"></div>
              <div className="flex items-center gap-3 w-full md:w-auto px-2">
                <select 
                  className="flex-1 md:w-48 py-2.5 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium focus:outline-none focus:border-primary appearance-none text-neutral-700 cursor-pointer"
                  value={filters.category || 'All Categories'}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(([cat]) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Button 
                  variant="secondary" 
                  className="py-2.5 px-5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border-none rounded-xl font-medium"
                  onClick={() => setFilters({ q: '', category: '' })}
                >
                  Reset
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full lg:w-1/4 space-y-6">
            <Card className="p-5 rounded-2xl border border-neutral-100 shadow-sm">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Categories</h3>
              <div className="space-y-1">
                {categories.map(([cat, count]) => {
                  const isActive = (filters.category || 'All Categories') === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-green-50 text-[#115e41]' 
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Package size={16} className={isActive ? 'text-[#115e41]' : 'text-neutral-400'} />
                        {cat}
                      </span>
                      <span className={`text-xs font-bold ${isActive ? 'text-[#115e41]' : 'text-neutral-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 rounded-2xl border border-neutral-100 shadow-sm bg-[#fafcfa]">
              <h3 className="text-base font-bold text-neutral-900 mb-5">Why Choose MOSH?</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} className="text-[#115e41]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#115e41]">Premium Quality</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">High quality components</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Zap size={16} className="text-[#115e41]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#115e41]">Reliable Performance</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">Tested for durability</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <HeadphonesIcon size={16} className="text-[#115e41]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#115e41]">Expert Support</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">Assistance at every step</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Truck size={16} className="text-[#115e41]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#115e41]">Fast Delivery</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">Quick & safe delivery</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Product Grid */}
          <div className="w-full lg:w-3/4 flex flex-col">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-96 rounded-2xl" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedProducts.map((product) => (
                    <Card key={product.id} hover className="p-0 overflow-hidden flex flex-col rounded-2xl border border-neutral-100 shadow-sm bg-white">
                      
                      <div className="p-5 flex flex-col flex-1 relative">
                        {/* Tags & Wishlist row */}
                        <div className="flex justify-between items-start w-full mb-4 z-10">
                          <span className="px-2.5 py-1 bg-green-50 text-[#115e41] text-[10px] font-bold uppercase tracking-wider rounded-md">
                            {product.category || 'Automation'}
                          </span>
                          <button className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors border border-neutral-100 shadow-sm bg-white">
                            <Heart size={14} />
                          </button>
                        </div>
                        
                        {/* Image */}
                        <div className="aspect-square w-full relative mb-5 flex items-center justify-center bg-white cursor-pointer group" onClick={() => setViewProduct(product)}>
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-4/5 h-4/5 object-contain transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col">
                          <h3 className="text-[15px] font-bold text-neutral-900 mb-1" title={product.name}>{product.name}</h3>
                          <p className="text-[13px] text-neutral-500 line-clamp-2 leading-relaxed mb-4 flex-1">{product.description}</p>
                          
                          <div className="mt-auto flex flex-col gap-4">
                            <span className="text-xl font-black text-[#115e41] tracking-tight">
                              {formatCurrency(product.price)}
                            </span>

                            <div className="flex items-center gap-3 w-full">
                              <Button
                                variant="secondary"
                                onClick={() => setViewProduct(product)}
                                className="flex-1 py-2 px-0 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-full shadow-sm text-sm"
                              >
                                <Eye size={16} className="mr-1.5" /> Details
                              </Button>
                              <Button
                                variant="primary"
                                onClick={() => addToCart(product)}
                                disabled={addedToCart === product.id}
                                className={`flex-1 py-2 px-0 rounded-full shadow-sm text-sm border-none ${addedToCart === product.id ? '!bg-green-600' : 'bg-[#115e41] hover:bg-[#0d4a33]'}`}
                              >
                                {addedToCart === product.id ? (
                                  <><CheckCircle size={16} className="mr-1.5" /> Added</>
                                ) : (
                                  <><ShoppingCart size={16} className="mr-1.5" /> Add to Cart</>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex flex-col md:flex-row items-center justify-between border-t border-neutral-100 pt-6">
                    <div className="hidden md:block w-32"></div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      >
                        <ChevronRight size={16} className="rotate-180" />
                      </button>
                      
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`dots-${index}`} className="text-neutral-400 mx-1">...</span>
                        ) : (
                          <button 
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full font-medium text-sm transition-colors ${
                              currentPage === page 
                                ? 'bg-[#115e41] text-white' 
                                : 'text-neutral-600 hover:bg-neutral-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}

                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="text-sm text-neutral-500 font-medium mt-4 md:mt-0">
                      Showing {(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} products
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState 
                icon={Info}
                title="No Products Found"
                description="We couldn't find matches for current filters."
                action={
                  <Button variant="secondary" onClick={() => setFilters({ q: '', category: '' })}>
                    Reset Filters
                  </Button>
                }
              />
            )}
          </div>
        </div>

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
      </div>
    </AppShell>
  );
};

export default CustomerProductsPage;
