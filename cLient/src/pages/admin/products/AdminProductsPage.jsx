import { useState, useMemo, useEffect } from 'react';
import CustomSelect from '../../../components/CustomSelect';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Package,
  Search,
  Upload,
  X,
  Gift,
  Clock,
  AlertCircle
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { getProducts, addProduct, updateProduct, deleteProduct, getDbStatus } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { API_URL } from '../../../utils/api';
import OfferManager from '../../../components/products/OfferManager';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Product Management' },
  { to: '/admin/invoices', label: 'Billing' },
  { to: '/admin/billing', label: 'Query Management' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/stories', label: 'Success Stories' },
  { to: '/admin/estimations', label: 'Estimation Calculator' },
  { to: '/admin/customers', label: 'Customers' }
];

const emptyForm = {
  name: '',
  description: '',
  price: '',
  image: '',
  category: 'Automation',
  features: '',
  stock: '10',
  warranty: '1 Year Warranty',
  specifications: '',
  availability: 'In Stock',
  floatFee: '0',
  wireBaseFee: '0',
  wireBaseMeters: '30',
  wireExtraPerMeter: '0',
  offers: []
};

const AdminProductsPage = () => {
  const [products, setProductsState] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [dbConnected, setDbConnected] = useState(() => getDbStatus());

  // Register Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [registerForm, setRegisterForm] = useState(emptyForm);

  // Edit Modal State
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState(emptyForm);

  // Delete Confirmation state
  const [deletingId, setDeletingId] = useState('');

  // Live Syncing feed
  const fetchLatestProducts = async (isMounted = true) => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && isMounted) {
          setProductsState(data.products || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin products:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchLatestProducts(isMounted);

    const fetchLatest = () => {
      setDbConnected(getDbStatus());
    };
    
    const interval = setInterval(() => {
      fetchLatest();
      fetchLatestProducts(isMounted);
    }, 5000);

    window.addEventListener('storage', fetchLatest);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', fetchLatest);
    };
  }, []);

  const updateRegister = (key, value) => {
    setRegisterForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEdit = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetRegister = () => {
    setRegisterForm(emptyForm);
    setShowAddModal(false);
  };

  const resetEdit = () => {
    setEditingId('');
    setEditForm(emptyForm);
  };

  const handleImageUpload = (e, formType) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (formType === 'register') {
        updateRegister('image', reader.result);
      } else {
        updateEdit('image', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerForm.name.trim() || !registerForm.description.trim() || Number(registerForm.price) <= 0 || !registerForm.image) {
      setMessage('Please fill all fields and upload a product image.');
      return;
    }

    const payload = {
      id: `p-${Date.now()}`,
      name: registerForm.name.trim(),
      description: registerForm.description.trim(),
      price: Number(registerForm.price),
      image: registerForm.image,
      category: registerForm.category,
      features: registerForm.features,
      stock: Number(registerForm.stock) || 0,
      warranty: registerForm.warranty,
      specifications: registerForm.specifications,
      availability: registerForm.availability,
      floatFee: Number(registerForm.floatFee || 0),
      wire: {
        baseFee: Number(registerForm.wireBaseFee || 0),
        baseMeters: Number(registerForm.wireBaseMeters || 30),
        extraPerMeter: Number(registerForm.wireExtraPerMeter || 0)
      },
      offers: registerForm.offers || [],
      createdAt: new Date().toISOString()
    };

    try {
      await addProduct(payload);
      await fetchLatestProducts();
      resetRegister();
      setMessage('Product published to catalog successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to publish product. Please try again.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.description.trim() || Number(editForm.price) <= 0 || !editForm.image) {
      setMessage('Please fill all fields and upload a product image.');
      return;
    }

    const payload = {
      id: editingId,
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      price: Number(editForm.price),
      image: editForm.image,
      category: editForm.category,
      features: editForm.features,
      stock: Number(editForm.stock) || 0,
      warranty: editForm.warranty,
      specifications: editForm.specifications,
      availability: editForm.availability,
      floatFee: Number(editForm.floatFee || 0),
      wire: {
        baseFee: Number(editForm.wireBaseFee || 0),
        baseMeters: Number(editForm.wireBaseMeters || 30),
        extraPerMeter: Number(editForm.wireExtraPerMeter || 0)
      },
      offers: editForm.offers || [],
      createdAt: products.find(p => p.id === editingId)?.createdAt || new Date().toISOString()
    };

    try {
      await updateProduct(editingId, payload);
      await fetchLatestProducts();
      resetEdit();
      setMessage('Product changes saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to save product changes. Please try again.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteProduct(deletingId);
      await fetchLatestProducts();
      setDeletingId('');
      setMessage('Product removed from catalog.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to delete product. Please try again.');
    }
  };

  const triggerEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      image: product.image || '',
      category: product.category || 'Automation',
      features: product.features || '',
      stock: String(product.stock || 10),
      warranty: product.warranty || '1 Year Warranty',
      specifications: product.specifications || '',
      availability: product.availability || 'In Stock',
      floatFee: String(product.floatFee || 0),
      wireBaseFee: String(product.wire?.baseFee || 0),
      wireBaseMeters: String(product.wire?.baseMeters || 30),
      wireExtraPerMeter: String(product.wire?.extraPerMeter || 0),
      offers: product.offers || []
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const renderFormFields = (form, updateFn) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Product Title *</label>
        <input
          required
          type="text"
          value={form.name}
          onChange={(e) => updateFn('name', e.target.value)}
          placeholder="e.g. Dual Tank Automated Switch"
          className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Category *</label>
          <CustomSelect
            value={form.category}
            onChange={(val) => updateFn('category', val)}
            options={['Automation', 'Wireless Systems', 'Sensors & Plugs', 'Accessories']}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Availability *</label>
          <CustomSelect
            value={form.availability}
            onChange={(val) => updateFn('availability', val)}
            options={['In Stock', 'Out of Stock']}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Base Price (₹) *</label>
          <input
            required
            type="number"
            min="1"
            value={form.price}
            onChange={(e) => updateFn('price', e.target.value)}
            placeholder="2500"
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Warranty Details *</label>
          <input
            required
            type="text"
            value={form.warranty}
            onChange={(e) => updateFn('warranty', e.target.value)}
            placeholder="e.g. 1 Year Warranty"
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Stock Count *</label>
        <input
          required
          type="number"
          value={form.stock}
          onChange={(e) => updateFn('stock', e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
        />
      </div>

      <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl space-y-4">
        <h4 className="text-xs uppercase font-bold text-primary tracking-wider">Estimation Points</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Float Sensor Fee / Unit</label>
            <input
              type="number"
              value={form.floatFee}
              onChange={(e) => updateFn('floatFee', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Wire Base Fee</label>
            <input
              type="number"
              value={form.wireBaseFee}
              onChange={(e) => updateFn('wireBaseFee', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Included Wire (meters)</label>
            <input
              type="number"
              value={form.wireBaseMeters}
              onChange={(e) => updateFn('wireBaseMeters', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Extra Wire cost/meter (₹)</label>
            <input
              type="number"
              value={form.wireExtraPerMeter}
              onChange={(e) => updateFn('wireExtraPerMeter', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Short Description *</label>
        <textarea
          required
          value={form.description}
          onChange={(e) => updateFn('description', e.target.value)}
          placeholder="Product specifications..."
          rows={2}
          className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Product Features *</label>
        <textarea
          required
          value={form.features}
          onChange={(e) => updateFn('features', e.target.value)}
          placeholder="e.g. Smart water control, Dry-run protect..."
          rows={2}
          className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Specifications / Technical Details</label>
        <textarea
          value={form.specifications}
          onChange={(e) => updateFn('specifications', e.target.value)}
          placeholder="e.g. Input: 220V AC, Relay output: 20A..."
          rows={2}
          className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Product Image *</label>
        <div className="relative border-2 border-dashed border-neutral-200 rounded-xl p-6 bg-neutral-50 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-teal-50 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, form === registerForm ? 'register' : 'edit')}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {form.image ? (
            <img src={form.image} alt="Preview" className="h-20 object-contain" />
          ) : (
            <>
              <Upload size={20} className="text-neutral-400 mb-2" />
              <span className="text-xs text-neutral-500 font-medium">Click to Browse or Drag Image Here</span>
            </>
          )}
        </div>
      </div>

      <OfferManager offers={form.offers} onChange={(offers) => updateFn('offers', offers)} />
    </div>
  );

  return (
    <AppShell title="Product Management Portal" links={adminLinks}>
      {!dbConnected ? (
        <div className="p-8">
          <EmptyState 
            icon={AlertCircle} 
            title="Database Connection Error" 
            description="Unable to load products from server. Please try again." 
          />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fade-in">
        
        {/* Toast Alert Feedback */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg bg-teal-600 text-white font-bold text-sm"
            >
              <CheckCircle size={18} />
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Catalog container */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-800">Products in Rotation</h2>
              <p className="text-sm text-neutral-500 mt-1">Live active listings on the customer portal.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 rounded-xl text-neutral-500 shadow-sm flex-1 md:flex-none focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                <Search size={16} className="text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 text-sm outline-none w-full md:max-w-[200px]"
                />
              </div>

              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 shrink-0"
              >
                <Plus size={16} /> Add Product
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredProducts.map((p) => (
              <Card key={p.id} hover className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 max-w-full overflow-hidden">
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0 w-full overflow-hidden">
                  <div className="w-20 h-20 bg-neutral-50 border border-neutral-100 rounded-xl p-2 flex items-center justify-center shrink-0">
                    <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="primary">{p.category || 'Automation'}</Badge>
                      <Badge variant={p.availability === 'Out of Stock' ? 'danger' : 'success'}>
                        {p.availability || 'In Stock'}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 mt-2 truncate max-w-full">{p.name}</h3>
                    <p className="text-sm text-neutral-500 truncate mt-1 max-w-full">{p.description}</p>
                    <p className="text-[11px] text-neutral-400 mt-1 truncate max-w-full">Created: {p.createdAt ? formatDateTime(p.createdAt) : 'Initial setup'}</p>
                    
                    {/* Offers Display */}
                    {(() => {
                      const activeOffers = (p.offers || []).filter(o => {
                        if (!o.showOffer) return false;
                        if (o.validUntil) {
                          const until = new Date(o.validUntil);
                          until.setHours(23, 59, 59, 999);
                          if (until < new Date()) return false;
                        }
                        return true;
                      });
                      
                      if (activeOffers.length === 0) return null;

                      return (
                        <div className="mt-3 flex flex-col gap-2">
                          {activeOffers.slice(0, 2).map((offer, idx) => (
                            <div key={idx} className="flex flex-col items-start gap-1">
                              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Gift size={12} /> {offer.title}
                              </span>
                              {offer.validUntil && (
                                <span className="text-[10px] text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                  <Clock size={10} /> Ends: {new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-stretch md:self-center border-t border-neutral-100 md:border-t-0 pt-4 md:pt-0 w-full md:w-auto justify-between md:justify-start mt-2 md:mt-0">
                  {(() => {
                    const activeOffers = (p.offers || []).filter(o => {
                      if (!o.showOffer) return false;
                      if (o.validUntil) {
                        const until = new Date(o.validUntil);
                        until.setHours(23, 59, 59, 999);
                        if (until < new Date()) return false;
                      }
                      return true;
                    });
                    
                    let promoPrice = null;
                    for (const offer of activeOffers) {
                      if (offer.type === 'Flat Discount' && offer.value > 0) {
                        const candidate = p.price - offer.value;
                        if (candidate > 0 && (!promoPrice || candidate < promoPrice)) {
                          promoPrice = candidate;
                        }
                      } else if (offer.type === 'Percentage Discount' && offer.value > 0) {
                        const candidate = p.price - (p.price * (offer.value / 100));
                        if (candidate > 0 && (!promoPrice || candidate < promoPrice)) {
                          promoPrice = candidate;
                        }
                      }
                    }

                    return promoPrice ? (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs text-neutral-400 line-through decoration-red-400 font-medium mb-1">{formatCurrency(p.price)}</span>
                        <strong className="text-lg text-red-600 font-extrabold">{formatCurrency(promoPrice)}</strong>
                      </div>
                    ) : (
                      <strong className="text-lg text-neutral-900 font-bold shrink-0">{formatCurrency(p.price)}</strong>
                    );
                  })()}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => triggerEdit(p)}
                      className="flex items-center gap-1"
                    >
                      <Edit2 size={14} /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingId(p.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {filteredProducts.length === 0 && (
              <div className="py-12">
                <EmptyState 
                  icon={Search} 
                  title="No Products Found" 
                  description="Try adjusting your search query." 
                />
              </div>
            )}
          </div>
        </Card>

        {/* Center Register Modal Overlay */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-start border-b border-neutral-100 pb-4 mb-4 shrink-0">
                  <div>
                    <span className="text-primary font-bold uppercase tracking-wider text-[10px]">Catalog Manager</span>
                    <h2 className="text-xl font-bold text-neutral-800">Register New Product</h2>
                  </div>
                  <button onClick={resetRegister} className="p-1.5 rounded-lg hover:bg-neutral-100 transition">
                    <X size={20} className="text-neutral-400" />
                  </button>
                </div>

                <form className="overflow-y-auto pr-2 pb-4 flex-1 space-y-4 scrollbar-thin" onSubmit={handleRegisterSubmit}>
                  {renderFormFields(registerForm, updateRegister)}

                  <div className="flex gap-3 pt-4 border-t border-neutral-100 mt-6 sticky bottom-0 bg-white">
                    <Button type="submit" variant="primary" className="flex-1">
                      Publish Product
                    </Button>
                    <Button type="button" variant="secondary" onClick={resetRegister} className="w-1/3">
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Center Edit Modal Overlay */}
        <AnimatePresence>
          {editingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-start border-b border-neutral-100 pb-4 mb-4 shrink-0">
                  <div>
                    <span className="text-primary font-bold uppercase tracking-wider text-[10px]">Catalog Editor</span>
                    <h2 className="text-xl font-bold text-neutral-800">Modify Product Details</h2>
                  </div>
                  <button onClick={resetEdit} className="p-1.5 rounded-lg hover:bg-neutral-100 transition">
                    <X size={20} className="text-neutral-400" />
                  </button>
                </div>

                <form className="overflow-y-auto pr-2 pb-4 flex-1 space-y-4 scrollbar-thin" onSubmit={handleEditSubmit}>
                  {renderFormFields(editForm, updateEdit)}

                  <div className="flex gap-3 pt-4 border-t border-neutral-100 mt-6 sticky bottom-0 bg-white">
                    <Button type="submit" variant="primary" className="flex-1">
                      Save Changes
                    </Button>
                    <Button type="button" variant="secondary" onClick={resetEdit} className="w-1/3">
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal Overlay */}
        <AnimatePresence>
          {deletingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-neutral-900">Confirm Deletion</h3>
                  <button onClick={() => setDeletingId('')} className="p-1 rounded-lg hover:bg-neutral-100 transition">
                    <X size={20} className="text-neutral-400" />
                  </button>
                </div>
                <p className="text-sm text-neutral-600 mb-6">
                  Are you sure you want to delete the product <strong className="text-neutral-900">"{products.find(p => p.id === deletingId)?.name}"</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100">
                  <Button variant="secondary" onClick={() => setDeletingId('')}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleConfirmDelete}>
                    Delete Product
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
      )}
    </AppShell>
  );
};

export default AdminProductsPage;
