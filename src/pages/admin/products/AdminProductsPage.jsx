import { useState } from 'react';
import AppShell from '../../../components/AppShell';
import { getProducts, setProducts } from '../../../utils/storage';
import { formatCurrency } from '../../../utils/format';
import { productImageOptions } from '../../../data/defaults';
import './AdminProductsPage.css'; 

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
  price: '',
  image: productImageOptions[0].value
};

const AdminProductsPage = () => {
  const [products, setProductsState] = useState(getProducts());
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
  };

  const submitProduct = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim() || Number(form.price) <= 0 || !form.image) {
      setMessage('Please fill all product fields with valid values.');
      return;
    }

    const productPayload = {
      id: editingId || `p-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      image: form.image
    };

    const updated = editingId
      ? products.map((item) => (item.id === editingId ? productPayload : item))
      : [productPayload, ...products];

    setProducts(updated);
    setProductsState(updated);
    resetForm();
    setMessage(editingId ? 'Product updated successfully.' : 'Product added successfully.');
  };

  const deleteProduct = (id) => {
    const updated = products.filter((item) => item.id !== id);
    setProducts(updated);
    setProductsState(updated);
    if (editingId === id) {
      resetForm();
    }
    setMessage('Product deleted successfully.');
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      image: product.image || productImageOptions[0].value
    });
    setMessage(`Editing ${product.name}.`);
  };

  return (
    <AppShell title="Add And Delete Products" links={adminLinks}>
      <section className="panel split admin-products-page">
        <article className="admin-product-form-card">
          <h2>{editingId ? 'Update Product' : 'Add Product'}</h2>
          <form className="form-grid" onSubmit={submitProduct}>
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

            <label>
              Product Image
              <select value={form.image} onChange={(e) => update('image', e.target.value)}>
                {productImageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button className="btn btn-primary" type="submit">
              {editingId ? 'Update Product' : 'Add Product'}
            </button>
            {editingId && (
              <button className="btn btn-outline" type="button" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </form>

          {message && <p className="success-text">{message}</p>}
        </article>

        <article className="admin-product-list-card">
          <h2>Existing Products</h2>
          <div className="stack admin-product-list">
            {products.map((item) => (
              <div className="row-card" key={item.id}>
                <img className="admin-product-image" src={item.image} alt={item.name} />
                <div className="admin-product-details">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <p>{formatCurrency(item.price)}</p>
                </div>
                <div className="admin-product-actions">
                  <button className="btn btn-outline" type="button" onClick={() => editProduct(item)}>
                    Update
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => deleteProduct(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
};

export default AdminProductsPage;
