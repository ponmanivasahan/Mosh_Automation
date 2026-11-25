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
  FileText,
  Gift,
  Clock
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import Tabs from '../../../components/ui/Tabs';
import Pagination from '../../../components/ui/Pagination';
import { adminLinks } from '../../../utils/customerLinks';
import { getProducts, addProduct, updateProduct, deleteProduct, getDbStatus } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { API_URL } from '../../../utils/api';
import './AdminProductsPage.css';
import OfferManager from '../../../components/products/OfferManager';

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

const PAGE_SIZE = 8;

const AdminProductsPage = () => {
  const [products, setProductsState] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
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

  // FileReader helper for local image uploading
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

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !searchQuery || (
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  return (
    <AppShell title="Product Management Portal" links={adminLinks}>
      {!dbConnected ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-rose-50 border border-rose-100 rounded-2xl m-4">
          <p className="text-sm font-bold text-rose-600">Unable to load products from server. Please try again.</p>
        </div>
      ) : (
        <div className="space-y-8 pb-16">
        
        {/* Toast Alert Feedback */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border bg-emerald-200 text-emerald-950 border-emerald-300 font-bold text-xs"
            >
              <CheckCircle size={16} />
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Catalog rotation banner container */}
        <section className="space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Products in Rotation</h2>
              <p className="text-xs text-slate-500 mt-1">Live active listings on the customer portal.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 rounded-xl text-slate-600 flex-1 md:flex-none">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 text-xs outline-none focus:ring-0 w-full md:max-w-[160px]"
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          {categories.length > 0 && (
            <div className="overflow-x-auto no-scrollbar pb-1">
              <Tabs
                tabs={[
                  { id: 'All', label: 'All Categories', count: products.length },
                  ...categories.map((c) => ({
                    id: c,
                    label: c,
                    count: products.filter((p) => p.category === c).length
                  }))
                ]}
                activeTab={categoryFilter}
                onChange={setCategoryFilter}
                size="sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredProducts.slice((Math.min(currentPage, Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))) - 1) * PAGE_SIZE, Math.min(currentPage, Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))) * PAGE_SIZE).map((p) => (
              <article key={p.id} className="border border-slate-200/90 p-2.5 rounded-2xl bg-white flex flex-col justify-between gap-3 hover:border-blue-300 transition-all h-full">
                <div className="space-y-3">
                  <div className="h-36 bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-center">
                    <img src={p.image} alt={p.name} className="max-h-full max-w-full object-contain" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">{p.category || 'Automation'}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
 p.availability === 'Out of Stock' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
 }`}>
                        {p.availability || 'In Stock'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-2 leading-snug">{p.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{p.description}</p>
                    
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
                        <div className="mt-2 flex flex-col gap-1">
                          {activeOffers.slice(0, 1).map((offer, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1 w-fit">
                              <Gift size={10} /> {offer.title}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-auto">
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
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 line-through font-bold">{formatCurrency(p.price)}</span>
                        <strong className="text-sm text-rose-600 font-extrabold">{formatCurrency(promoPrice)}</strong>
                      </div>
                    ) : (
                      <strong className="text-sm text-blue-700 font-extrabold">{formatCurrency(p.price)}</strong>
                    );
                  })()}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => triggerEdit(p)}
                      className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition flex items-center gap-1"
                      type="button"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingId(p.id)}
                      className="bg-rose-50 border border-rose-200 text-rose-600 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1"
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            currentPage={Math.min(currentPage, Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE)))}
            totalItems={filteredProducts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />

          {filteredProducts.length === 0 && (
            <p className="text-xs text-slate-400 py-12 italic text-center bg-white border border-slate-200 rounded-2xl">No products match the query.</p>
          )}
        </section>

        {/* Center Register/Add Modal Overlay */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl max-w-4xl w-full p-5 border border-slate-200 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="badge-kicker text-blue-600 font-bold uppercase tracking-wider text-[10px]">Catalog Manager</span>
                    <h2 className="text-xl font-bold text-slate-800">Register New Product</h2>
                  </div>
                  <button onClick={resetRegister} className="p-1 rounded-lg hover:bg-slate-100 transition">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="form-field-group">
                        <label className="text-xs font-bold text-slate-700">Product Title *</label>
                        <input
                          required
                          type="text"
                          value={registerForm.name}
                          onChange={(e) => updateRegister('name', e.target.value)}
                          placeholder="e.g. Dual Tank Automated Switch"
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Category *</label>
                          <CustomSelect
                            value={registerForm.category}
                            onChange={(val) => updateRegister('category', val)}
                            options={['Wired Systems', 'Wireless Systems', 'Sensors & Float', 'Accessories']}
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Availability *</label>
                          <CustomSelect
                            value={registerForm.availability}
                            onChange={(val) => updateRegister('availability', val)}
                            options={['In Stock', 'Out of Stock']}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Base Price *</label>
                          <input
                            required
                            type="number"
                            min="1"
                            value={registerForm.price}
                            onChange={(e) => updateRegister('price', e.target.value)}
                            placeholder="2500"
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Warranty *</label>
                          <input
                            required
                            type="text"
                            value={registerForm.warranty}
                            onChange={(e) => updateRegister('warranty', e.target.value)}
                            placeholder="1 Year Warranty"
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Stock *</label>
                          <input
                            required
                            type="number"
                            value={registerForm.stock}
                            onChange={(e) => updateRegister('stock', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="form-field-group col-span-2">
                          <h4 className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Estimation Points</h4>
                        </div>
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Float Sensor Fee / Unit</label>
                          <input
                            type="number"
                            value={registerForm.floatFee}
                            onChange={(e) => updateRegister('floatFee', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 outline-none font-bold"
                          />
                        </div>
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Wire Base Fee</label>
                          <input
                            type="number"
                            value={registerForm.wireBaseFee}
                            onChange={(e) => updateRegister('wireBaseFee', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 outline-none font-bold"
                          />
                        </div>
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Included Wire (m)</label>
                          <input
                            type="number"
                            value={registerForm.wireBaseMeters}
                            onChange={(e) => updateRegister('wireBaseMeters', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 outline-none font-bold"
                          />
                        </div>
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Extra Wire / meter (₹)</label>
                          <input
                            type="number"
                            value={registerForm.wireExtraPerMeter}
                            onChange={(e) => updateRegister('wireExtraPerMeter', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 outline-none font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="form-field-group">
                        <label className="text-xs font-bold text-slate-700">Short Description *</label>
                        <textarea
                          required
                          value={registerForm.description}
                          onChange={(e) => updateRegister('description', e.target.value)}
                          placeholder="Product specifications..."
                          rows={2}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none resize-none font-bold"
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="text-xs font-bold text-slate-700">Product Features *</label>
                        <textarea
                          required
                          value={registerForm.features}
                          onChange={(e) => updateRegister('features', e.target.value)}
                          placeholder="e.g. Smart water control, Dry-run protect..."
                          rows={2}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none resize-none font-bold"
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="text-xs font-bold text-slate-700">Specifications / Technical Details</label>
                        <textarea
                          value={registerForm.specifications}
                          onChange={(e) => updateRegister('specifications', e.target.value)}
                          placeholder="e.g. Input: 220V AC, Relay output: 20A..."
                          rows={2}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none resize-none font-bold"
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="text-xs font-bold text-slate-700">Product Image *</label>
                        <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'register')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {registerForm.image ? (
                            <img src={registerForm.image} alt="Preview" className="h-16 object-contain" />
                          ) : (
                            <>
                              <Upload size={16} className="text-slate-400 mb-1" />
                              <span className="text-[10px] text-slate-400 font-bold">Choose File or Drag Here</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <OfferManager offers={registerForm.offers} onChange={(offers) => updateRegister('offers', offers)} />

                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition"
                    >
                      Publish Product
                    </button>
                    <button
                      type="button"
                      onClick={resetRegister}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-5 rounded-lg transition border"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Center Edit Modal Overlay */}
        <AnimatePresence>
          {editingId && (
            <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl max-w-4xl w-full p-5 border border-slate-200 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="badge-kicker text-blue-600 font-bold uppercase tracking-wider text-[10px]">Catalog Editor</span>
                    <h2 className="text-xl font-bold text-slate-800">Modify Product Details</h2>
                  </div>
                  <button onClick={resetEdit} className="p-1 rounded-lg hover:bg-slate-100 transition">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <form className="space-y-4" onSubmit={handleEditSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="form-field-group">
                        <label className="text-xs font-bold text-slate-700">Product Title *</label>
                        <input
                          required
                          type="text"
                          value={editForm.name}
                          onChange={(e) => updateEdit('name', e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Category *</label>
                          <CustomSelect
                            value={editForm.category}
                            onChange={(val) => updateEdit('category', val)}
                            options={['Automation', 'Wireless Systems', 'Sensors & Plugs', 'Accessories']}
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Availability *</label>
                          <CustomSelect
                            value={editForm.availability}
                            onChange={(val) => updateEdit('availability', val)}
                            options={['In Stock', 'Out of Stock']}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Base Price *</label>
                          <input
                            required
                            type="number"
                            min="1"
                            value={editForm.price}
                            onChange={(e) => updateEdit('price', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Warranty *</label>
                          <input
                            required
                            type="text"
                            value={editForm.warranty}
                            onChange={(e) => updateEdit('warranty', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Stock *</label>
                          <input
                            required
                            type="number"
                            value={editForm.stock}
                            onChange={(e) => updateEdit('stock', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="form-field-group col-span-2">
                          <h4 className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Estimation Points</h4>
                        </div>
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Float Sensor Fee / Unit</label>
                          <input
                            type="number"
                            value={editForm.floatFee}
                            onChange={(e) => updateEdit('floatFee', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 outline-none font-bold"
                          />
                        </div>
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Wire Base Fee</label>
                          <input
                            type="number"
                            value={editForm.wireBaseFee}
                            onChange={(e) => updateEdit('wireBaseFee', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 outline-none font-bold"
                          />
                        </div>
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Included Wire (m)</label>
                          <input
                            type="number"
                            value={editForm.wireBaseMeters}
                            onChange={(e) => updateEdit('wireBaseMeters', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 outline-none font-bold"
                          />
                        </div>
                        <div className="form-field-group">
                          <label className="text-xs font-bold text-slate-700">Extra Wire / meter (₹)</label>
                          <input
                            type="number"
                            value={editForm.wireExtraPerMeter}
                            onChange={(e) => updateEdit('wireExtraPerMeter', e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 outline-none font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="form-field-group">
                        <label className="text-xs font-bold text-slate-700">Short Description *</label>
                        <textarea
                          required
                          value={editForm.description}
                          onChange={(e) => updateEdit('description', e.target.value)}
                          rows={2}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none resize-none font-bold"
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="text-xs font-bold text-slate-700">Product Features *</label>
                        <textarea
                          required
                          value={editForm.features}
                          onChange={(e) => updateEdit('features', e.target.value)}
                          placeholder="e.g. Smart water control, Dry-run protect, Mobile app control..."
                          rows={2}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none resize-none font-bold"
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="text-xs font-bold text-slate-700">Specifications / Technical Details</label>
                        <textarea
                          value={editForm.specifications}
                          onChange={(e) => updateEdit('specifications', e.target.value)}
                          placeholder="e.g. Input: 220V AC, Relay output: 20A, Cable: 30m..."
                          rows={2}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none resize-none font-bold"
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="text-xs font-bold text-slate-700">Change Product Image Asset *</label>
                        <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'edit')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {editForm.image ? (
                            <img src={editForm.image} alt="Preview" className="h-16 object-contain" />
                          ) : (
                            <>
                              <Upload size={16} className="text-slate-400 mb-1" />
                              <span className="text-[10px] text-slate-400 font-bold">Choose File or Drag Here</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <OfferManager offers={editForm.offers} onChange={(offers) => updateEdit('offers', offers)} />

                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={resetEdit}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-5 rounded-lg transition border"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal Overlay */}
        <AnimatePresence>
          {deletingId && (
            <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg max-w-sm w-full p-6 border flex flex-col space-y-4"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
                  <button onClick={() => setDeletingId('')} className="p-1 rounded hover:bg-slate-100">
                    <X size={16} className="text-slate-400" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  Are you sure you want to delete the product "{products.find(p => p.id === deletingId)?.name}"?
                </p>
                <div className="flex gap-3 justify-end pt-3">
                  <button
                    onClick={handleConfirmDelete}
                    className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeletingId('')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-lg transition border"
                  >
                    Cancel
                  </button>
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
