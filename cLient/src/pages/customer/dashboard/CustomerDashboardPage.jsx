import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, IndianRupee, Heart, Headset, Eye, ChevronRight, Search, Bell, Package, Check, ShoppingCart, MessageSquare } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { getOrders, getProducts } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';
import { customerLinks } from '../../../utils/customerLinks';
import { useAuth } from '../../../utils/AuthContext';

const CustomerDashboardPage = () => {
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const allOrders = getOrders();
      const userOrders = allOrders.filter((o) => o.customerPhone === session?.phone);
      
      setOrders(userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setProducts(getProducts());
      setIsLoading(false);
    };
    fetchData();
  }, [session]);

  const stats = useMemo(() => {
    const active = orders.filter((o) => ['Pending', 'Processing'].includes(o.status));
    const totalSpent = orders.filter((o) => o.paymentStatus === 'Paid').reduce((acc, curr) => acc + Number(curr.total), 0);
    
    return [
      { label: 'Total Orders', value: orders.length, subtext: 'All time orders', icon: ShoppingBag, color: 'text-green-700', bg: 'bg-green-100', trend: '+12%', trendColor: 'text-green-600' },
      { label: 'Active Orders', value: active.length, subtext: 'In progress', icon: Truck, color: 'text-blue-700', bg: 'bg-blue-100', trend: '+8%', trendColor: 'text-blue-600' },
      { label: 'Total Spent', value: formatCurrency(totalSpent), subtext: 'All time amount', icon: IndianRupee, color: 'text-orange-700', bg: 'bg-orange-100', trend: '+15%', trendColor: 'text-orange-600' },
      { label: 'Saved Products', value: '8', subtext: 'In wishlist', icon: Heart, color: 'text-purple-700', bg: 'bg-purple-100', trend: '+4%', trendColor: 'text-purple-600' }
    ];
  }, [orders]);

  const recentOrders = orders.slice(0, 4);
  const recommendedProducts = products.slice(0, 4);

  // Helper to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppShell title="Dashboard" links={customerLinks}>
      <div className="animate-fade-in space-y-6 -mt-4">
        
        {/* Top Header Match Mockup (Optional inner header for search/profile) */}
        <div className="hidden md:flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products, categories..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-full">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 pl-4 border-l border-neutral-200">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold">
                {session?.name?.[0] || 'D'}
              </div>
              <span className="text-sm font-medium text-neutral-700">{session?.name || 'Dharanish D.'}</span>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative rounded-[32px] overflow-hidden bg-[#e8f1e9] min-h-[220px] flex items-center p-8 md:p-12">
          {/* Mock background image (if missing, fallback to linear gradient) */}
          <div 
            className="absolute inset-0 z-0 opacity-40 mix-blend-multiply"
            style={{ 
              backgroundImage: 'url(/background.png)', 
              backgroundPosition: 'right center', 
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#e8f1e9] via-[#e8f1e9]/90 to-transparent z-0"></div>
          
          <div className="relative z-10 max-w-xl">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              {getGreeting()}, {session?.name?.split(' ')[0] || 'Dharanish'}! <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-neutral-700 text-lg mb-8 max-w-md leading-relaxed">
              Manage your irrigation equipment, monitor orders, and get technical assistance from one place.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/customer/products" className="bg-[#115e41] text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-[#0d4a33] transition-colors">
                <ShoppingBag size={18} /> Browse Products
              </Link>
              <Link to="/customer/query-section" className="bg-white text-[#115e41] px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 border border-[#115e41]/20 hover:bg-neutral-50 transition-colors">
                <Headset size={18} /> Get Technical Support
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          ) : (
            stats.map((stat, idx) => (
              <Card key={idx} hover className="p-5 flex items-center gap-4 rounded-2xl">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} flex-shrink-0`}>
                  <stat.icon size={28} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-neutral-500 truncate">{stat.label}</p>
                    <span className={`text-xs font-bold ${stat.trendColor}`}>{stat.trend}</span>
                  </div>
                  <p className="text-2xl font-bold text-neutral-900 mb-0.5">{stat.value}</p>
                  <p className="text-xs text-neutral-400 truncate">{stat.subtext}</p>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Recent Orders List (Table) */}
          <div className="xl:col-span-2 flex flex-col">
            <Card className="p-0 overflow-hidden flex-1 flex flex-col rounded-2xl">
              <div className="p-5 flex items-center justify-between border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Package className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-neutral-900">Recent Orders</h3>
                </div>
                <Link to="/customer/cart" className="text-sm font-medium text-primary hover:text-teal-800 flex items-center">
                  View all orders <ChevronRight size={16} />
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/50">
                      <th className="px-5 py-3 text-xs font-semibold text-neutral-500">Order ID</th>
                      <th className="px-5 py-3 text-xs font-semibold text-neutral-500">Product</th>
                      <th className="px-5 py-3 text-xs font-semibold text-neutral-500">Date</th>
                      <th className="px-5 py-3 text-xs font-semibold text-neutral-500">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold text-neutral-500">Amount</th>
                      <th className="px-5 py-3 text-xs font-semibold text-neutral-500 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {isLoading ? (
                      Array(4).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-5 py-4 text-center"><Skeleton className="h-8 w-8 rounded-full mx-auto" /></td>
                        </tr>
                      ))
                    ) : recentOrders.length > 0 ? (
                      recentOrders.map((order) => {
                        const firstItem = order.items?.[0];
                        const product = products.find(p => p.id === firstItem?.productId);
                        return (
                          <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors group">
                            <td className="px-5 py-4 text-sm font-medium text-neutral-900">#ORD{order.id.toString().slice(-4)}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-neutral-100 flex items-center justify-center overflow-hidden">
                                  {product?.image ? <img src={product.image} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-neutral-400" />}
                                </div>
                                <span className="text-sm text-neutral-700 font-medium line-clamp-1">{product?.name || 'Multiple Items'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-neutral-500">{formatDateTime(order.createdAt).split(',')[0]}</td>
                            <td className="px-5 py-4">
                              <Badge variant={order.status === 'Completed' || order.status === 'Delivered' ? 'success' : order.status === 'Paid' ? 'primary' : order.status === 'Processing' ? 'warning' : 'default'} className="!px-3 !py-1">
                                {order.status === 'Completed' ? 'Delivered' : order.status}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-sm font-bold text-neutral-900">{formatCurrency(order.total)}</td>
                            <td className="px-5 py-4 text-center">
                              <button className="p-1.5 text-neutral-400 hover:text-primary hover:bg-teal-50 rounded border border-transparent hover:border-teal-100 transition-colors">
                                <Eye size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-neutral-500 text-sm">
                          No recent orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Side Panel: Help & Support (Match mockup) */}
          <div className="flex flex-col h-full">
            <Card className="p-8 bg-[#f4f7f6] border-0 rounded-2xl flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#e8efec] flex items-center justify-center text-[#115e41] mb-5">
                <Headset size={32} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Need Technical Support?</h3>
              <p className="text-neutral-600 text-sm mb-8 leading-relaxed max-w-[250px]">
                Have questions about installation or need a custom estimation for your agricultural setup?
              </p>
              <Link to="/customer/query-section" className="w-full py-3 bg-[#115e41] text-white font-medium rounded-xl hover:bg-[#0d4a33] transition-colors flex items-center justify-center gap-2 mb-3 shadow-sm">
                <MessageSquare size={18} /> Ask a Query
              </Link>
              <p className="text-xs text-neutral-500 flex items-center justify-center gap-1.5">
                <Check className="text-[#115e41]" size={14} /> Our team typically replies within 24 hours
              </p>
            </Card>
          </div>

        </div>

        {/* Top Selling Automation Solutions */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight">Top Selling Automation Solutions</h3>
            </div>
            <Link to="/customer/products" className="text-sm font-medium text-primary hover:text-teal-800 flex items-center">
              View catalog <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
            ) : (
              recommendedProducts.map((product, index) => {
                const activeOffers = product.offers?.filter(o => o.isActive) || [];
                let promoPrice = null;
                
                for (const offer of activeOffers) {
                  if (offer.type === 'Flat Discount' && offer.value > 0) {
                    const candidate = product.price - offer.value;
                    if (candidate > 0 && (!promoPrice || candidate < promoPrice)) {
                      promoPrice = candidate;
                    }
                  } else if (offer.type === 'Percentage Discount' && offer.value > 0) {
                    const candidate = product.price - (product.price * (offer.value / 100));
                    if (candidate > 0 && (!promoPrice || candidate < promoPrice)) {
                      promoPrice = candidate;
                    }
                  }
                }

                const soldCounts = [72, 56, 51, 89];
                const soldCount = soldCounts[index] || 45;

                return (
                  <Card key={product.id} hover className="p-0 overflow-hidden h-full flex flex-col rounded-2xl bg-[#fafcfa] border border-neutral-100 relative group">
                    <div className="absolute top-4 left-4 bg-[#0aa6b5] text-white text-xs font-black px-2 py-1 rounded-md shadow-sm z-10">
                      #{index + 1}
                    </div>
                    
                    <div className="aspect-[4/3] relative p-6 pb-2 flex items-center justify-center">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col bg-white rounded-b-2xl">
                      <h4 className="font-black text-[15px] text-neutral-900 mb-3 uppercase leading-snug">{product.name}</h4>
                      <p className="text-[13px] text-neutral-500 mb-6 line-clamp-6 leading-relaxed">{product.description}</p>
                      
                      <div className="mt-auto">
                        <div className="flex items-end justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {promoPrice ? (
                              <>
                                <span className="text-xl font-black text-[#115e41] tracking-tight">{formatCurrency(promoPrice)}</span>
                                <span className="text-sm text-neutral-400 line-through decoration-red-400 decoration-2 font-semibold">{formatCurrency(product.price)}</span>
                              </>
                            ) : (
                              <span className="text-xl font-black text-[#115e41] tracking-tight">{formatCurrency(product.price)}</span>
                            )}
                          </div>
                          
                          <div className="bg-[#eef2f3] text-[#4a5f68] text-xs font-bold px-3 py-1.5 rounded-full">
                            {soldCount} sold
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs font-semibold text-neutral-600 mb-4">
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="ml-1">4.5</span>
                        </div>
                        
                        <Link to={`/customer/products`} className="w-full py-2.5 bg-white text-[#115e41] border-2 border-[#115e41] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#115e41] hover:text-white transition-colors text-sm">
                          <ShoppingCart size={16} /> Add to Cart
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
        
      </div>
    </AppShell>
  );
};

export default CustomerDashboardPage;
