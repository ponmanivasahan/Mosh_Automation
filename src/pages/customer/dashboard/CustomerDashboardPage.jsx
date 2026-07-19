import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Star, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { getCart, getProducts, getOrders, getReviews } from '../../../utils/storage';
import { formatCurrency } from '../../../utils/format';
import { customerLinks } from '../../../utils/customerLinks';
import './CustomerDashboardPage.css';

/* ── Simulated sales data per product (seeded from price to feel realistic) ── */
const getSalesData = (products, orders) => {
  const salesMap = {};
  orders
    .filter(o => o.status !== 'Cancelled')
    .forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const pId = item.productId;
          if (pId) {
            salesMap[pId] = (salesMap[pId] || 0) + Number(item.quantity || 1);
          }
        });
      }
    });

  return products.map((p, i) => {
    const baseOverallSales = Math.max(8, Math.round((p.price / 200) + (i % 5) * 7 + ((i * 17) % 13)));
    const liveSales = salesMap[p.id] || 0;
    return {
      id: p.id,
      name: p.name,
      shortName: p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name,
      image: p.image,
      price: p.price,
      description: p.description,
      sales: baseOverallSales + liveSales,
      rating: (4.2 + ((i * 3) % 8) * 0.1).toFixed(1),
    };
  });
};

/* ── Colour palette for pie chart slices ── */
const PIE_COLORS = [
  '#0d9488', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444',
  '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#f97316',
  '#84cc16', '#06b6d4', '#a855f7', '#e11d48',
];

/* ── Pure SVG Pie Chart ── */
const PieChartSVG = ({ data }) => {
  const total = data.reduce((s, d) => s + d.sales, 0);
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 85;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={r - 30} fill="#ffffff" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold fill-slate-400">
          No Sales Yet
        </text>
      </svg>
    );
  }

  let cumulative = 0;

  const slices = data.map((d, i) => {
    const fraction = d.sales / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;

    const largeArc = fraction > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return (
      <path
        key={d.id}
        d={path}
        fill={PIE_COLORS[i % PIE_COLORS.length]}
        stroke="#ffffff"
        strokeWidth="2"
        className="pie-slice"
      >
        <title>{d.shortName}: {d.sales} units ({(fraction * 100).toFixed(1)}%)</title>
      </path>
    );
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="pie-svg">
      {slices}
      <circle cx={cx} cy={cy} r="42" fill="white" />
      <text x={cx} y={cy - 6} textAnchor="middle" className="pie-center-label">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="pie-center-sub">
        Total Units
      </text>
    </svg>
  );
};

/* ── Pure SVG Bar Chart ── */
const BarChartSVG = ({ data }) => {
  const maxSales = Math.max(...data.map((d) => d.sales));
  const barWidth = 36;
  const gap = 16;
  const chartHeight = 200;
  const chartWidth = data.length * (barWidth + gap) + gap;
  const labelHeight = 60;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight + labelHeight + 10}`}
      className="bar-svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((frac) => (
        <line
          key={frac}
          x1={0}
          x2={chartWidth}
          y1={chartHeight - chartHeight * frac}
          y2={chartHeight - chartHeight * frac}
          stroke="rgba(15,23,42,0.06)"
          strokeDasharray="4 4"
        />
      ))}

      {data.map((d, i) => {
        const barHeight = (d.sales / maxSales) * (chartHeight - 20);
        const x = gap + i * (barWidth + gap);
        const y = chartHeight - barHeight;

        return (
          <g key={d.id} className="bar-group">
            {/* Gradient bar */}
            <defs>
              <linearGradient id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PIE_COLORS[i % PIE_COLORS.length]} />
                <stop offset="100%" stopColor={PIE_COLORS[i % PIE_COLORS.length]} stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="6"
              fill={`url(#bar-grad-${i})`}
              className="bar-rect"
            >
              <title>{d.shortName}: {d.sales} units</title>
            </rect>

            {/* Sales count on top of bar */}
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              className="bar-value"
            >
              {d.sales}
            </text>

            {/* Product name label (rotated) */}
            <text
              x={x + barWidth / 2}
              y={chartHeight + 12}
              textAnchor="end"
              transform={`rotate(-45, ${x + barWidth / 2}, ${chartHeight + 12})`}
              className="bar-label"
            >
              {d.name.length > 14 ? d.name.slice(0, 12) + '…' : d.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ──────── Main Dashboard Component ──────── */
const CustomerDashboardPage = () => {
  const [products, setProducts] = useState(() => getProducts());
  const [cartItems, setCartItems] = useState(() => getCart());
  const [orders, setOrders] = useState(() => getOrders());
  const [reviews, setReviews] = useState(() => getReviews());
  const scrollRef = useRef(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);

  useEffect(() => {
    const updateStats = () => {
      setProducts(getProducts());
      setCartItems(getCart());
      setOrders(getOrders());
      setReviews(getReviews());
    };

    // Live update interval
    const interval = setInterval(updateStats, 1000);

    // Storage event listeners for immediate updates
    window.addEventListener('storage', updateStats);
    window.addEventListener('mosh_cart_updated', updateStats);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateStats);
      window.removeEventListener('mosh_cart_updated', updateStats);
    };
  }, []);

  const salesData = useMemo(() => getSalesData(products, orders), [products, orders]);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + Number(item.quantity || 1), 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [cartItems]
  );

  const totalRevenue = useMemo(
    () => orders.reduce((acc, o) => acc + Number(o.total || 0), 0),
    [orders]
  );

  const avgRating = useMemo(() => {
    if (!reviews.length) return '4.8';
    const sum = reviews.reduce((a, r) => a + Number(r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  /* Sorted by sales desc for "most reliable" */
  const reliableProducts = useMemo(
    () => [...salesData].sort((a, b) => b.sales - a.sales),
    [salesData]
  );

  /* Horizontal scroll helpers */
  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  /* Take top 8 for charts to keep them readable */
  const chartData = reliableProducts.slice(0, 8);

  return (
    <AppShell title="Customer Dashboard" links={customerLinks}>
      {/* ── Stat Cards Row ── */}
      <section className="dash-stats-row">
        <article className="dash-stat-card dash-stat-products">
          <div className="dash-stat-icon">
            <Package size={22} />
          </div>
          <div>
            <p className="dash-stat-label">Total Products</p>
            <h3 className="dash-stat-value">{products.length}</h3>
          </div>
        </article>
        <article className="dash-stat-card dash-stat-cart">
          <div className="dash-stat-icon">
            <ShoppingCart size={22} />
          </div>
          <div>
            <p className="dash-stat-label">Cart Items</p>
            <h3 className="dash-stat-value">{cartCount}</h3>
            <span className="dash-stat-sub">{formatCurrency(cartTotal)}</span>
          </div>
        </article>
        <article className="dash-stat-card dash-stat-rating">
          <div className="dash-stat-icon">
            <Star size={22} />
          </div>
          <div>
            <p className="dash-stat-label">Avg. Rating</p>
            <h3 className="dash-stat-value">{avgRating}<span className="dash-stat-out-of"> / 5</span></h3>
            <span className="dash-stat-sub">{reviews.length || 128} reviews</span>
          </div>
        </article>
        <article className="dash-stat-card dash-stat-revenue">
          <div className="dash-stat-icon">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="dash-stat-label">Total Revenue</p>
            <h3 className="dash-stat-value">{formatCurrency(totalRevenue || 48600)}</h3>
            <span className="dash-stat-sub pill-green">+18% this month</span>
          </div>
        </article>
      </section>

      {/* ── Most Reliable Products — Horizontal Scroll ── */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <p className="eyebrow">Most Reliable Products</p>
            <h2>Top Selling Automation Solutions</h2>
          </div>
          <div className="scroll-controls">
            <button className="scroll-btn" onClick={() => scroll('left')} aria-label="Scroll left">
              ‹
            </button>
            <button className="scroll-btn" onClick={() => scroll('right')} aria-label="Scroll right">
              ›
            </button>
          </div>
        </div>

        <div className="product-scroll-wrapper" ref={scrollRef}>
          <div className="product-scroll-track">
            {reliableProducts.map((product, idx) => (
              <article
                key={product.id}
                className={`reliable-card ${hoveredProduct === product.id ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="reliable-rank">#{idx + 1}</div>
                <div className="reliable-img-wrap">
                  <img src={product.image} alt={product.name} className="reliable-img" />
                </div>
                <div className="reliable-info">
                  <h4 className="reliable-name">{product.name}</h4>
                  <p className="reliable-desc">{product.description}</p>
                  <div className="reliable-meta">
                    <span className="reliable-price">{formatCurrency(product.price)}</span>
                    <span className="reliable-sales">{product.sales} sold</span>
                  </div>
                  <div className="reliable-rating-bar">
                    <div className="reliable-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={`star-icon ${s <= Math.round(product.rating) ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                    <span className="reliable-rating-num">{product.rating}</span>
                  </div>
                  <Link to="/customer/query-section" className="reliable-cta">
                    Get Estimate →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Charts Section: Bar Graph + Pie Chart Side by Side ── */}
      <section className="dash-charts-row">
        {/* Bar Chart */}
        <article className="dash-chart-card">
          <div className="dash-chart-head">
            <div className="dash-chart-icon bar-icon">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="eyebrow">Product Sales</p>
              <h3>Sales Bar Chart</h3>
            </div>
          </div>
          <div className="bar-chart-container">
            <BarChartSVG data={chartData} />
          </div>
        </article>

        {/* Pie Chart */}
        <article className="dash-chart-card">
          <div className="dash-chart-head">
            <div className="dash-chart-icon pie-icon">
              <PieChart size={20} />
            </div>
            <div>
              <p className="eyebrow">Market Share</p>
              <h3>Sales Distribution</h3>
            </div>
          </div>
          <div className="pie-chart-container">
            <div className="pie-chart-wrap">
              <PieChartSVG data={chartData} />
            </div>
            <div className="pie-legend">
              {chartData.map((d, i) => (
                <div key={d.id} className="pie-legend-item">
                  <span
                    className="pie-legend-dot"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="pie-legend-label">{d.shortName}</span>
                  <strong className="pie-legend-val">{d.sales}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </AppShell>
  );
};

export default CustomerDashboardPage;
