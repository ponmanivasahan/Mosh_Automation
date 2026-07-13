import { Link } from 'react-router-dom';
import AppShell from '../../../components/AppShell';
import { getCart, getProducts } from '../../../utils/storage';
import { formatCurrency } from '../../../utils/format';
import './CustomerProductsPage.css';

const customerLinks = [
  { to: '/customer/products', label: 'Products' },
  { to: '/customer/cart', label: 'Cart & Order Details' }
];

const CustomerProductsPage = () => {
  const products = getProducts();
  const cartCount = getCart().length;

  return (
    <AppShell title="Customer Product Catalog" links={customerLinks}>
      <section className="panel customer-products-page">
        <div className="panel-head">
          <h2>Available Automation Products</h2>
          <Link to="/customer/cart" className="btn btn-primary">
            Go to Cart ({cartCount})
          </Link>
        </div>

        <div className="grid cards">
          {products.map((product) => (
            <article key={product.id} className="card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p className="price">{formatCurrency(product.price)}</p>
              <Link className="btn btn-outline" to={`/customer/products/${product.id}`}>
                View Estimation Cost
              </Link>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default CustomerProductsPage;
