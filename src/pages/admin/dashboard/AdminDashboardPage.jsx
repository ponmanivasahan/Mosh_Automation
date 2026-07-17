import AppShell from '../../../components/AppShell';
import { getEstimations, getNotifications, getOrders, getProducts } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import './AdminDashboardPage.css';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Add/Delete Products' },
  { to: '/admin/billing', label: 'Estimation Billing' },
  { to: '/admin/estimations', label: 'Customer Estimations' },
  { to: '/admin/notifications', label: 'Notifications' }
];

const AdminDashboardPage = () => {
  const products = getProducts();
  const estimations = getEstimations();
  const orders = getOrders();
  const notifications = getNotifications();

  const unread = notifications.filter((note) => !note.read).length;
  const totalRevenue = orders.reduce((acc, order) => acc + Number(order.total || 0), 0);
  const orderCount = orders.length;
  const estimationTotal = estimations.reduce((acc, item) => acc + Number(item.total || 0), 0);

  const productSales = products
    .map((product) => {
      const productOrders = orders.reduce((count, order) => {
        const matches = Array.isArray(order.items)
          ? order.items.some((item) => item.productId === product.id)
          : false;

        return matches ? count + 1 : count;
      }, 0);

      return {
        name: product.name,
        sales: productOrders || Math.max(1, Math.round(product.price / 10000)),
        revenue: product.price
      };
    })
    .sort((left, right) => right.sales - left.sales)
    .slice(0, 6);

  const categoryBreakdown = products.reduce((items, product, index) => {
    const category = product.name.split(' ')[0];
    const existing = items.find((item) => item.label === category);

    if (existing) {
      existing.count += 1;
      existing.value += Number(product.price || 0);
      return items;
    }

    items.push({
      label: category,
      count: 1,
      value: Number(product.price || 0),
      hue: (index * 43) % 360
    });

    return items;
  }, []);

  const topCountries = [
    { name: 'Poland', value: 19 },
    { name: 'Austria', value: 15 },
    { name: 'Spain', value: 13 },
    { name: 'Romania', value: 12 },
    { name: 'France', value: 11 },
    { name: 'Italy', value: 11 },
    { name: 'Germany', value: 10 },
    { name: 'Ukraine', value: 9 }
  ];

  const chartDays = [
    { label: '1 Jul', margin: 28, revenue: 38 },
    { label: '2 Jul', margin: 31, revenue: 46 },
    { label: '3 Jul', margin: 20, revenue: 57 },
    { label: '4 Jul', margin: 33, revenue: 44 },
    { label: '5 Jul', margin: 53, revenue: 58 },
    { label: '6 Jul', margin: 54, revenue: 61 },
    { label: '7 Jul', margin: 14, revenue: 40 },
    { label: '8 Jul', margin: 34, revenue: 43 },
    { label: '9 Jul', margin: 25, revenue: 32 },
    { label: '10 Jul', margin: 45, revenue: 49 },
    { label: '11 Jul', margin: 33, revenue: 46 },
    { label: '12 Jul', margin: 58, revenue: 54 }
  ];

  return (
    <AppShell title="Admin Dashboard" links={adminLinks}>
      <section className="admin-dashboard-page">
        <header className="admin-topbar panel">
          <div>
            <p className="dashboard-eyebrow">Operations Overview</p>
            <h2>Dashboard</h2>
            <p>Track orders, estimations, and product activity in one place.</p>
          </div>

          <div className="admin-topbar-chip">
            <span>Time period</span>
            <strong>This month</strong>
          </div>
        </header>

        <section className="admin-metrics-grid">
          <article className="metric-card">
            <p>Total Products</p>
            <h3>{products.length}</h3>
            <span>Catalog items available for customers</span>
          </article>
          <article className="metric-card">
            <p>Total Revenue</p>
            <h3>{formatCurrency(totalRevenue)}</h3>
            <span>Customer orders completed</span>
          </article>
          <article className="metric-card">
            <p>Total Orders</p>
            <h3>{orderCount}</h3>
            <span>Placed orders awaiting progress</span>
          </article>
          <article className="metric-card">
            <p>Total Returns</p>
            <h3>{Math.max(0, Math.round(orderCount * 0.12))}</h3>
            <span>Estimated returns from recent activity</span>
          </article>
          <article className="metric-card add-card">
            <p>Add Data</p>
            <h3>+</h3>
            <span>Manage products and content</span>
          </article>
        </section>

        <section className="admin-chart-card panel">
          <div className="panel-head admin-panel-head">
            <div>
              <p className="dashboard-eyebrow">Product Sales</p>
              <h2>Product sales</h2>
            </div>
            <div className="chart-legend">
              <span><i className="legend-mark legend-margin" /> Gross margin</span>
              <span><i className="legend-mark legend-revenue" /> Revenue</span>
            </div>
          </div>

          <div className="sales-chart">
            {chartDays.map((day) => (
              <div className="sales-day" key={day.label}>
                <div className="sales-bars">
                  <span className="sales-bar margin-bar" style={{ height: `${day.margin}%` }} />
                  <span className="sales-bar revenue-bar" style={{ height: `${day.revenue}%` }} />
                </div>
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-two-column-grid">
          <article className="panel admin-category-panel">
            <div className="panel-head admin-panel-head">
              <div>
                <p className="dashboard-eyebrow">Catalog Mix</p>
                <h2>Sales by product category</h2>
              </div>
            </div>

            <div className="category-body">
              <div className="category-list">
                {categoryBreakdown.map((item) => (
                  <div className="category-item" key={item.label}>
                    <span className="category-dot" style={{ backgroundColor: `hsl(${item.hue} 80% 58%)` }} />
                    <span>{item.label}</span>
                    <strong>{Math.round((item.value / Math.max(products.length, 1)) / 1000)}k</strong>
                  </div>
                ))}
              </div>

              <div className="donut-wrap" aria-hidden="true">
                <div
                  className="donut-chart"
                  style={{
                    background: `conic-gradient(${categoryBreakdown
                      .map((item, index) => {
                        const start = categoryBreakdown
                          .slice(0, index)
                          .reduce((acc, entry) => acc + entry.count, 0);
                        const total = products.length || 1;
                        const from = (start / total) * 360;
                        const to = ((start + item.count) / total) * 360;
                        return `hsl(${item.hue} 80% 58%) ${from}deg ${to}deg`;
                      })
                      .join(', ')})`
                  }}
                >
                  <div className="donut-hole" />
                </div>
              </div>
            </div>
          </article>

          <article className="panel admin-country-panel">
            <div className="panel-head admin-panel-head">
              <div>
                <p className="dashboard-eyebrow">Regional Sales</p>
                <h2>Sales by countries</h2>
              </div>
            </div>

            <div className="country-list">
              {topCountries.map((country) => (
                <div className="country-row" key={country.name}>
                  <span>{country.name}</span>
                  <div className="country-bar-track">
                    <div className="country-bar-fill" style={{ width: `${country.value}%` }} />
                  </div>
                  <strong>{country.value}%</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>

      <section className="panel admin-recent-panel">
        <div className="panel-head admin-panel-head">
          <div>
            <p className="dashboard-eyebrow">Operational Feed</p>
            <h2>Recent orders</h2>
          </div>
          <p>{unread} unread notifications</p>
        </div>

        {!orders.length && <p>No orders yet.</p>}

        <div className="stack">
          {orders.slice(0, 8).map((order) => (
            <article className="row-card" key={order.id}>
              <div>
                <h3>{order.customerName}</h3>
                <p>{order.customerPhone}</p>
                <p>{formatDateTime(order.createdAt)}</p>
              </div>
              <strong>{formatCurrency(order.total)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel admin-product-strip">
        <div className="panel-head admin-panel-head">
          <div>
            <p className="dashboard-eyebrow">Catalog Snapshot</p>
            <h2>Products in rotation</h2>
          </div>
          <p>{estimations.length} estimations · {formatCurrency(estimationTotal)}</p>
        </div>

        <div className="admin-product-grid">
          {productSales.map((item) => (
            <article className="admin-mini-product" key={item.name}>
              <h3>{item.name}</h3>
              <p>{item.sales} sales</p>
              <strong>{formatCurrency(item.revenue)}</strong>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default AdminDashboardPage;
