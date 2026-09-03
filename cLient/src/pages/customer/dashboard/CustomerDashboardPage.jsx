import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingCart, TrendingUp, HelpCircle, ChevronRight, Clock, Star, Award } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { getOrders, getReviews } from "../../../utils/storage";
import { formatCurrency } from "../../../utils/format";
import { API_URL } from "../../../utils/api";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Skeleton from "../../../components/ui/Skeleton";
import { customerLinks } from "../../../utils/customerLinks";
import { useAuth } from "../../../utils/AuthContext";

/* ─── Star Rating component ─── */
const StarRating = ({ rating, count }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-neutral-200 fill-neutral-200"}
        />
      ))}
    </div>
    <span className="text-xs text-neutral-500 font-medium">{Number(rating).toFixed(1)}</span>
    {count > 0 && <span className="text-xs text-neutral-400">({count})</span>}
  </div>
);

const CustomerDashboardPage = () => {
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
      const allReviews = getReviews();
      setReviews(allReviews);
      const allOrders = getOrders();
      const userOrders = allOrders.filter((o) => o.customerPhone === session?.phone);
      setOrders(userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setIsLoading(false);
    };
    fetchData();
  }, [session]);

  const stats = useMemo(() => {
    const active = orders.filter((o) => ["Pending", "Processing"].includes(o.status));
    const totalSpent = orders
      .filter((o) => o.paymentStatus === "Paid")
      .reduce((acc, curr) => acc + Number(curr.total), 0);
    return [
      { label: "Total Orders", value: orders.length, icon: ShoppingCart, bg: "bg-teal-50", color: "text-teal-700" },
      { label: "Active Orders", value: active.length, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
      { label: "Total Spent", value: formatCurrency(totalSpent), icon: TrendingUp, bg: "bg-green-50", color: "text-green-600" },
    ];
  }, [orders]);

  const recentOrders = orders.slice(0, 4);

  /* Build sold count from all orders */
  const salesMap = useMemo(() => {
    const map = {};
    getOrders()
      .filter((o) => o.status !== "Cancelled")
      .forEach((o) => {
        (o.items || []).forEach((item) => {
          if (item.productId) map[item.productId] = (map[item.productId] || 0) + Number(item.quantity || 1);
        });
      });
    return map;
  }, []);

  /* Build rating map from reviews (match by product name) */
  const ratingMap = useMemo(() => {
    const map = {};
    reviews.forEach((r) => {
      const key = (r.productName || "").toLowerCase().trim();
      if (!map[key]) map[key] = { sum: 0, count: 0 };
      map[key].sum += Number(r.rating || 0);
      map[key].count += 1;
    });
    return map;
  }, [reviews]);

  const getRating = (productName) => {
    const key = (productName || "").toLowerCase().trim();
    const entry = ratingMap[key];
    if (!entry || entry.count === 0) return null;
    return { avg: entry.sum / entry.count, count: entry.count };
  };

  /* Sort all products by sales */
  const topSellingProducts = useMemo(() =>
    [...products]
      .sort((a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0)),
    [products, salesMap]
  );

  /* Offer info using correct field names */
  const getOfferInfo = (product) => {
    const activeOffers = (product.offers || []).filter((o) => o.showOffer);
    const offerCount = activeOffers.length;
    for (const offer of activeOffers) {
      if (offer.type === "Percentage Discount" && Number(offer.value) > 0) {
        const dp = Math.round(product.price - product.price * (Number(offer.value) / 100));
        if (dp > 0) return { discountOffer: offer, discountedPrice: dp, badgeText: `${offer.value}% OFF`, offerCount };
      } else if (offer.type === "Flat Discount" && Number(offer.value) > 0) {
        const dp = Math.round(product.price - Number(offer.value));
        if (dp > 0) return { discountOffer: offer, discountedPrice: dp, badgeText: `FLAT ${formatCurrency(offer.value)} OFF`, offerCount };
      }
    }
    return { discountOffer: null, discountedPrice: null, badgeText: null, offerCount };
  };

  const statusVariant = (s) =>
    s === "Completed" || s === "Paid" ? "success" : s === "Pending" ? "warning" : "default";

  return (
    <AppShell title="Dashboard" links={customerLinks}>
      <div className="space-y-6 animate-fade-in">

        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Welcome back, {session?.name || "Customer"} <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">Here is your account overview.</p>
          </div>
          <Link
            to="/customer/products"
            className="hidden sm:inline-flex items-center gap-1.5 bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-teal-800 transition-colors shadow-sm"
          >
            <ShoppingCart size={15} /> Shop Now
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoading
            ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)
            : stats.map((s, i) => (
                <Card key={i} hover className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${s.bg} ${s.color} shrink-0`}><s.icon size={22} /></div>
                  <div>
                    <p className="text-xs text-neutral-500 font-medium">{s.label}</p>
                    <p className="text-2xl font-bold text-neutral-900 leading-tight">{s.value}</p>
                  </div>
                </Card>
              ))}
        </div>

        {/* Orders + Support */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-neutral-900">Recent Orders</h3>
              <Link to="/customer/cart" className="text-xs font-medium text-teal-700 hover:text-teal-900 flex items-center gap-0.5">
                View all <ChevronRight size={13} />
              </Link>
            </div>
            <Card className="p-0 overflow-hidden">
              {isLoading ? (
                <div className="divide-y divide-neutral-100">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="flex-1 space-y-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-3 w-20" /></div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors">
                      <div className="h-10 w-10 bg-teal-50 text-teal-700 flex items-center justify-center rounded-xl shrink-0">
                        <Package size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">Order #{order.id?.slice(-6)}</p>
                        <p className="text-xs text-neutral-400">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-neutral-900">{formatCurrency(order.total)}</p>
                        <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mb-3">
                    <ShoppingCart size={26} strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-neutral-700 mb-1">No orders yet</p>
                  <p className="text-xs text-neutral-400 mb-4">Your orders will appear here after your first purchase.</p>
                  <Link to="/customer/products" className="text-xs font-semibold text-teal-700 bg-teal-50 px-4 py-2 rounded-lg hover:bg-teal-100 transition-colors">Browse Products</Link>
                </div>
              )}
            </Card>
          </div>

          {/* Help Card */}
          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-3">Support</h3>
            <div className="rounded-2xl shadow-sm border border-teal-800 p-6 bg-teal-700 text-white overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -bottom-8 -left-6 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <HelpCircle size={22} className="text-white" />
                </div>
                <h4 className="text-base font-bold mb-1">Need Technical Support?</h4>
                <p className="text-teal-100 text-xs leading-relaxed mb-5">Questions about installation, wiring, or need a custom estimation for your setup?</p>
                <Link to="/customer/query-section" className="flex items-center justify-center w-full py-2.5 bg-white text-teal-700 text-sm font-bold rounded-xl hover:bg-teal-50 transition-colors">Ask a Query</Link>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Top Selling Products — card style like reference image ─── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                Top Selling Automation Solutions
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Most popular products from our catalog</p>
            </div>
            <Link to="/customer/products" className="text-xs font-medium text-teal-700 hover:text-teal-900 flex items-center gap-0.5">
              View all <ChevronRight size={13} />
            </Link>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {isLoading
              ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="min-w-[280px] sm:min-w-[320px] h-96 rounded-2xl shrink-0" />)
              : topSellingProducts.map((product, idx) => {
                  const { discountOffer, discountedPrice, badgeText, offerCount } = getOfferInfo(product);
                  const ratingInfo = getRating(product.name);
                  const soldCount = salesMap[product.id] || 0;
                  return (
                    <Card key={product.id} hover className="p-0 overflow-hidden flex flex-col shrink-0 w-[280px] sm:w-[320px] snap-start">
                      {/* Image */}
                      <div className="relative bg-neutral-50 overflow-hidden" style={{ height: 200 }}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Rank badge */}
                        <span className="absolute top-3 left-3 bg-teal-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow">
                          #{idx + 1}
                        </span>
                        {/* Offer badge */}
                        {badgeText && (
                          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow whitespace-nowrap">
                            {badgeText}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Name */}
                        <h4 className="font-bold text-sm text-neutral-900 uppercase leading-snug line-clamp-2 mb-2">
                          {product.name}
                        </h4>

                        {/* Description */}
                        {product.description && (
                          <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3 mb-3">
                            {product.description}
                          </p>
                        )}

                        {/* Price + Sold count */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-lg text-teal-700">
                              {formatCurrency(discountedPrice ?? product.price)}
                            </span>
                            {discountedPrice && (
                              <span className="text-xs text-neutral-400 line-through decoration-red-500 decoration-2">
                                {formatCurrency(product.price)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {offerCount > 0 && (
                              <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                <Award size={10} strokeWidth={2.5} /> {offerCount} OFFER{offerCount > 1 ? 'S' : ''}
                              </span>
                            )}
                            {soldCount > 0 && (
                              <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full font-medium">
                                {soldCount} sold
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Star Rating */}
                        {ratingInfo && (
                          <div className="mb-3">
                            <StarRating rating={ratingInfo.avg} count={ratingInfo.count} />
                          </div>
                        )}

                        <div className="mt-auto">
                          <Link
                            to="/customer/query-section"
                            state={{ productId: product.id }}
                            className="flex items-center justify-center w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                          >
                            Get Estimate →
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
          </div>
        </div>

      </div>
    </AppShell>
  );
};

export default CustomerDashboardPage;
