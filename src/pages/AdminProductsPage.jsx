import { useState } from 'react';
import AppShell from '../components/AppShell';
import { getProducts, setProducts } from '../utils/storage';
import { formatCurrency } from '../utils/format';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Add/Delete Products' },
  { to: '/admin/billing', label: 'Estimation Billing' },
  { to: '/admin/estimations', label: 'Customer Estimations' },
  { to: '/admin/notifications', label: 'Notifications' }
];

const emptyForm = {
  name: '',
  description: '',
  price: ''
};

const AdminProductsPage = () => {
  const [products, setProductsState] = useState(getProducts());
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addProduct = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim() || Number(form.price) <= 0) {
      setMessage('Please fill all product fields with valid values.');
      return;
    }

    const newProduct = {
      id: `p-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price)
    };

    const updated = [newProduct, ...products];
    setProducts(updated);
    setProductsState(updated);
    setForm(emptyForm);
    setMessage('Product added successfully.');
  };

  const deleteProduct = (id) => {
    const updated = products.filter((item) => item.id !== id);
    setProducts(updated);
    setProductsState(updated);
    setMessage('Product deleted successfully.');
  };

  return (
    <AppShell title="Add And Delete Products" links={adminLinks}>
      <section className="panel split">
        <article>
          <h2>Add Product</h2>
          <form className="form-grid" onSubmit={addProduct}>
            <label>
              Product Name
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Enter product name"
              />
            </label>

            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Enter product description"
              />
            </label>

            <label>
              Price
              <input
                type="number"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="Enter price"
              />
            </label>

            <button className="btn btn-primary" type="submit">
              Add Product
            </button>
          </form>

          {message && <p className="success-text">{message}</p>}
        </article>

        <article>
          <h2>Existing Products</h2>
          <div className="stack">
            {products.map((item) => (
              <div className="row-card" key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <p>{formatCurrency(item.price)}</p>
                </div>
                <button className="btn btn-ghost" type="button" onClick={() => deleteProduct(item.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
};

export default AdminProductsPage;
