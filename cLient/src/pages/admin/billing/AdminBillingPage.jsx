import { useState, useEffect, useMemo } from 'react';
import { Package, HelpCircle, Check, AlertCircle, Edit, DollarSign, Clock, ListFilter } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { getProducts, getEstimations, getBillingSettings, setBillingSettings, updateEstimation } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import './AdminBillingPage.css';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Product Management' },
  { to: '/admin/billing', label: 'Query Management' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/stories', label: 'Success Stories' },
  { to: '/admin/estimations', label: 'Estimation Calculator' },
  { to: '/admin/settings', label: 'Settings' }
];

const AdminBillingPage = () => {
  const [products, setProducts] = useState(() => getProducts());
  const [estimations, setEstimations] = useState(() => getEstimations());
  const [selectedProductId, setSelectedProductId] = useState('');
  const [toast, setToast] = useState(null);

  // Estimation updating state
  const [editingEstId, setEditingEstId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStage, setEditStage] = useState('');
  const [editResponse, setEditResponse] = useState('');

  // Live Syncing feed
  useEffect(() => {
    const fetchLatest = () => {
      setProducts(getProducts());
      setEstimations(getEstimations());
    };
    const interval = setInterval(fetchLatest, 1500);
    window.addEventListener('storage', fetchLatest);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchLatest);
    };
  }, []);

  // Show Toast Auto Dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Selected product logic
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find(p => p.id === selectedProductId);
  }, [selectedProductId, products]);



  const handleStartEdit = (est) => {
    setEditingEstId(est.id);
    setEditPrice(String(est.total));
    setEditStage(est.stage || 'requested');
    setEditResponse(est.adminResponse || '');
    if (est.productId) {
      setSelectedProductId(est.productId);
    }
  };

  const handleCancelEdit = () => {
    setEditingEstId(null);
  };

  const handleUpdateEstimation = (estId) => {
    const currentEsts = getEstimations();
    const updated = currentEsts.map(e => {
      if (e.id === estId) {
        return {
          ...e,
          total: Number(editPrice) || e.total,
          stage: editStage,
          adminResponse: editResponse.trim(),
          seen: true // Mark seen when updating
        };
      }
      return e;
    });

    const targetEst = updated.find(e => e.id === estId);
    updateEstimation(targetEst);
    setEstimations(updated);
    setEditingEstId(null);
    setToast({ type: 'success', message: 'Estimation query updated successfully.' });
  };

  return (
    <AppShell title="Query Management" links={adminLinks}>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        
        {/* Toast alert */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border backdrop-blur-xl ${
            toast.type === 'success' ? 'bg-teal-600 text-white border-teal-500' : 'bg-rose-600 text-white border-rose-500'
          }`}>
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-semibold text-sm">{toast.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Product Selection Option & View */}
          <div className="lg:col-span-4 bg-slate-100 border border-slate-200/80 p-6 rounded-lg space-y-6 lg:sticky lg:top-28">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Package size={16} className="text-teal-600" />
                Linked Product Details
              </h3>
              <p className="text-xs text-slate-500 mt-1">Examine product details connected to the active customer query.</p>
            </div>

            {selectedProduct ? (
              <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-4 shadow-sm">
                <div className="h-44 bg-slate-50 rounded-lg p-3 border flex items-center justify-center">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{selectedProduct.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">Product ID: {selectedProduct.id}</p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed font-semibold">{selectedProduct.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Base Price</span>
                    <strong className="text-sm text-teal-600 font-bold">{formatCurrency(selectedProduct.price)}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-8">Click 'Update Inquiry' on a query card to view its linked product specifications.</p>
            )}
          </div>

          {/* Right Column: Customer Queries Viewer & Updater */}
          <div className="lg:col-span-8 bg-slate-100 border border-slate-200/80 p-6 rounded-lg space-y-6 max-h-[78vh] overflow-y-auto overflow-x-hidden">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <HelpCircle size={16} className="text-teal-600" />
                  Customer Estimation Queries
                </h3>
                <p className="text-xs text-slate-500 mt-1">Review live inquiry requests and update values directly.</p>
              </div>
              <span className="text-[10px] bg-slate-200 px-3 py-1 rounded-full text-slate-600 font-bold">
                {estimations.length} inquiries
              </span>
            </div>

            {!estimations.length ? (
              <div className="text-center py-16 bg-white border rounded-lg p-6">
                <p className="text-xs text-slate-400 italic">No customer estimation inquiries found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {estimations.map((est) => {
                  const isEditing = editingEstId === est.id;
                  return (
                    <div key={est.id} className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
                      {/* Inquiry Header */}
                      <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{est.productName}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 font-bold flex flex-wrap gap-2">
                            <span>Name: {est.customerName}</span>
                            <span>·</span>
                            <span>Cust ID: #CUST-{est.customerPhone ? est.customerPhone.slice(-4) : 'GUEST'}</span>
                            <span>·</span>
                            <span>Phone: {est.customerPhone}</span>
                            <span>·</span>
                            <span>Submitted: {formatDateTime(est.createdAt)}</span>
                          </p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          est.stage === 'replied' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {est.stage || 'Pending'}
                        </span>
                      </div>

                      {/* Inquiry Content */}
                      <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <strong className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Customer Query / Requirement</strong>
                        <p className="leading-relaxed font-semibold">"{est.requirement || est.description || 'No detailed requirement provided'}"</p>
                      </div>

                      {/* Admin Response display if not editing */}
                      {!isEditing && est.adminResponse && (
                        <div className="text-xs text-teal-800 bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                          <strong className="block text-[9px] uppercase tracking-wider text-teal-700 mb-1">Admin Response Sent</strong>
                          <p className="leading-relaxed font-semibold">"{est.adminResponse}"</p>
                        </div>
                      )}

                      {/* Display Edit Fields if in edit mode */}
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200 mt-3 space-y-3 md:space-y-0">
                          <div className="space-y-3">
                            <div className="form-field-group">
                              <label className="text-xs font-bold text-slate-700">Estimated Price (₹)</label>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none mt-1 font-bold"
                              />
                            </div>
                            <div className="form-field-group">
                              <label className="text-xs font-bold text-slate-700">Stage Status</label>
                              <select
                                value={editStage}
                                onChange={(e) => setEditStage(e.target.value)}
                                className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none mt-1 font-bold"
                              >
                                <option value="requested">Pending</option>
                                <option value="replied">Replied / Answered</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col justify-between space-y-3">
                            <div className="form-field-group flex-1">
                              <label className="text-xs font-bold text-slate-700">Write Response Message</label>
                              <textarea
                                value={editResponse}
                                onChange={(e) => setEditResponse(e.target.value)}
                                placeholder="Write response details, estimate values, setup times..."
                                className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none mt-1 h-[70px] resize-none font-bold"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateEstimation(est.id)}
                                className="flex-1 text-[11px] bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg transition"
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-lg transition border"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Estimated Cost:</span>
                            <strong className="text-sm text-teal-600 font-bold">{formatCurrency(est.total)}</strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(est)}
                            className="text-xs bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition flex items-center gap-1.5"
                          >
                            <Edit size={12} />
                            Update Inquiry
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default AdminBillingPage;
