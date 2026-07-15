import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../../components/AppShell';
import { useAuth } from '../../../utils/AuthContext';
import {
  addEstimation,
  getBillingSettings,
  getProducts,
  getCart,
  setCart
} from '../../../utils/storage';
import { formatCurrency } from '../../../utils/format';
import './CustomerEstimatePage.css';

const customerLinks = [
  { to: '/customer/dashboard', label: 'Dashboard' },
  { to: '/customer/cart', label: 'Cart & Order Details' }
];

const complexityMap = {
  low: 0.9,
  medium: 1,
  high: 1.2
};

const CustomerEstimatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [complexity, setComplexity] = useState('medium');
  const [info, setInfo] = useState('');

  const products = getProducts();
  const billing = getBillingSettings();
  const product = products.find((item) => item.id === id);

  const estimate = useMemo(() => {
    if (!product) {
      return null;
    }

    const base = product.price * quantity;
    const installation = base * billing.installationRate * complexityMap[complexity];
    const misc = Number(billing.miscellaneousFee || 0);
    const subtotal = base + installation + misc;
    const tax = subtotal * billing.taxRate;
    const total = subtotal + tax;

    return {
      base,
      installation,
      misc,
      subtotal,
      tax,
      total
    };
  }, [billing, complexity, product, quantity]);

  if (!product || !estimate) {
    return (
      <AppShell title="Estimation" links={customerLinks}>
        <section className="panel">
          <p>Product not found.</p>
          <Link to="/customer/dashboard" className="btn btn-primary">
            Back to Products
          </Link>
        </section>
      </AppShell>
    );
  }

  const saveEstimation = () => {
    if (!session) {
      return;
    }

    const entry = {
      id: `est-${Date.now()}`,
      customerName: session.name,
      customerPhone: session.phone,
      productId: product.id,
      productName: product.name,
      quantity,
      complexity,
      total: estimate.total,
      createdAt: new Date().toISOString(),
      stage: 'saved'
    };

    addEstimation(entry);
    setInfo('Estimation saved for admin review.');
  };

  const addToCart = () => {
    const cart = getCart();
    const item = {
      id: `cart-${Date.now()}`,
      source: 'estimate',
      productId: product.id,
      name: product.name,
      image: product.image,
      quantity,
      complexity,
      unitPrice: product.price,
      total: estimate.total
    };

    setCart([item, ...cart]);
    setInfo('Item added to cart successfully.');
  };

  return (
    <AppShell title="Product Estimation" links={customerLinks}>
      <section className="panel split customer-estimate-page">
        <article>
          <h2>{product.name}</h2>
          <img className="estimate-product-image" src={product.image} alt={product.name} />
          <p>{product.description}</p>
          <p className="price">Base Price: {formatCurrency(product.price)}</p>

          <div className="form-grid two-col">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              />
            </label>

            <label>
              Complexity
              <select value={complexity} onChange={(e) => setComplexity(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <div className="action-row">
            <button className="btn btn-primary" type="button" onClick={saveEstimation}>
              Save For Review
            </button>
            <button className="btn btn-outline" type="button" onClick={addToCart}>
              Add to Cart
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => navigate('/customer/cart')}>
              Order Details
            </button>
          </div>

          {info && <p className="success-text">{info}</p>}
        </article>

        <aside className="summary-card">
          <h3>Estimation Summary</h3>
          <p>
            <span>Base</span>
            <strong>{formatCurrency(estimate.base)}</strong>
          </p>
          <p>
            <span>Installation</span>
            <strong>{formatCurrency(estimate.installation)}</strong>
          </p>
          <p>
            <span>Misc Fee</span>
            <strong>{formatCurrency(estimate.misc)}</strong>
          </p>
          <p>
            <span>Tax</span>
            <strong>{formatCurrency(estimate.tax)}</strong>
          </p>
          <p className="total-row">
            <span>Total Estimation</span>
            <strong>{formatCurrency(estimate.total)}</strong>
          </p>
        </aside>
      </section>
    </AppShell>
  );
};

export default CustomerEstimatePage;
