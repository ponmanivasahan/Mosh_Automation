import { useState, useEffect, useMemo } from 'react';
import { Package, HelpCircle, Check, AlertCircle, Edit, DollarSign, Clock, ListFilter, FileText, X } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import Tabs from '../../../components/ui/Tabs';
import Pagination from '../../../components/ui/Pagination';
import CustomSelect from '../../../components/CustomSelect';
import { adminLinks } from '../../../utils/customerLinks';
import { getProducts, getBillingSettings, setBillingSettings, updateEstimation } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { openPdfBase64 } from '../../../utils/pdfHelper';
import { API_URL } from '../../../utils/api';
import './AdminBillingPage.css';

const PAGE_SIZE = 6;

const AdminBillingPage = () => {
  const [products, setProducts] = useState([]);
  const [estimations, setEstimations] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [toast, setToast] = useState(null);
  const [estFilter, setEstFilter] = useState('All'); // All, Pending, Replied
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered estimations
  const filteredEstimations = useMemo(() => {
    if (estFilter === 'Pending') return estimations.filter(e => e.stage !== 'replied' && e.stage !== 'completed');
    if (estFilter === 'Replied') return estimations.filter(e => e.stage === 'replied' || e.stage === 'completed');
    return estimations;
  }, [estimations, estFilter]);

  // Estimation updating state
  const [editingEstId, setEditingEstId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editResponse, setEditResponse] = useState('');
  const [editAttachment, setEditAttachment] = useState(null);
  const [editAttachmentName, setEditAttachmentName] = useState('');

  // Live Syncing feed
  useEffect(() => {
    const fetchLatest = async () => {
      setProducts(getProducts());
      
      try {
        const res = await fetch(`${API_URL}/api/estimations`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.estimations) {
            setEstimations(data.estimations);
          }
        }
      } catch (err) {
        console.error('Failed to fetch estimations', err);
      }
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 5000);
    return () => clearInterval(interval);
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
    setEditResponse(est.adminResponse || '');
    setEditAttachment(null);
    setEditAttachmentName('');
    if (est.productId) {
      setSelectedProductId(est.productId);
    }
  };

  const handleCancelEdit = () => {
    setEditingEstId(null);
    setEditAttachment(null);
    setEditAttachmentName('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setToast({ type: 'error', message: 'Only PDF files are allowed.' });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setToast({ type: 'error', message: 'PDF file exceeds the allowed size of 5MB.' });
      e.target.value = '';
      return;
    }

    // Convert file to Base64 Data URL for 100% persistent storage (immune to Render ephemeral disk wipes)
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditAttachment(event.target.result);
      setEditAttachmentName(file.name);
    };
    reader.onerror = () => {
      setToast({ type: 'error', message: 'Failed to read the selected PDF file.' });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateEstimation = async (estId) => {
    if (!editResponse.trim() && !editAttachment) {
      setToast({ type: 'error', message: 'Please enter a reply or attach a PDF.' });
      return;
    }

    const currentEsts = estimations;
    const targetEst = currentEsts.find(e => e.id === estId);
    if (!targetEst) return;

    const updatedData = {
      ...targetEst,
      total: Number(editPrice) || targetEst.total,
      adminResponse: editResponse.trim(),
      attachmentUrl: editAttachment || targetEst.attachmentUrl || null,
      seen: true
    };

    try {
      await updateEstimation(updatedData);
      
      // Update local state, noting that the backend will automatically set stage to 'replied'
      const finalEstimations = estimations.map(e => {
        if (e.id === estId) {
          return {
            ...updatedData,
            stage: 'replied'
          };
        }
        return e;
      });
      setEstimations(finalEstimations);
      
      setEditingEstId(null);
      setEditAttachment(null);
      setEditAttachmentName('');
      setToast({ type: 'success', message: 'Reply sent successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: 'Unable to send reply. Please try again.' });
    }
  };

  return (
    <AppShell title="Query Management" links={adminLinks}>
      <div className="space-y-8 pb-16">
        
        {/* Toast alert */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border ${
            toast.type === 'success' ? 'bg-emerald-200 text-emerald-950 border-emerald-300' : 'bg-red-200 text-red-950 border-red-300'
          }`}>
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-semibold text-sm">{toast.message}</span>
          </div>
        )}

        {/* Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <HelpCircle size={20} className="text-blue-600" />
              Customer Estimation Queries
            </h2>
            <p className="text-xs text-slate-500 mt-1">Review live inquiry requests, inspect linked products, send quotes, and attach proposal PDFs.</p>
          </div>

          <Tabs
            tabs={[
              { id: 'All', label: 'All Queries', count: estimations.length },
              { id: 'Pending', label: 'Pending', count: estimations.filter(e => e.stage !== 'replied' && e.stage !== 'completed').length },
              { id: 'Replied', label: 'Replied', count: estimations.filter(e => e.stage === 'replied' || e.stage === 'completed').length }
            ]}
            activeTab={estFilter}
            onChange={setEstFilter}
            size="sm"
          />
        </div>

        {/* Responsive Query Cards Grid */}
        {!filteredEstimations.length ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-6">
            <p className="text-xs text-slate-400 italic">No customer estimation inquiries matching "{estFilter}".</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {filteredEstimations.slice((Math.min(currentPage, Math.max(1, Math.ceil(filteredEstimations.length / PAGE_SIZE))) - 1) * PAGE_SIZE, Math.min(currentPage, Math.max(1, Math.ceil(filteredEstimations.length / PAGE_SIZE))) * PAGE_SIZE).map((est) => (
              <article key={est.id} className="p-2.5 bg-white border border-slate-200/90 rounded-2xl hover:border-blue-300 transition-all flex flex-col justify-between gap-4 h-full">
                <div className="space-y-3">
                  {/* Inquiry Header */}
                  <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">{est.productName}</h4>
                      <p className="text-xs text-slate-600 font-semibold mt-1">
                        {est.customerName} · {est.customerPhone}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={11} />
                        {formatDateTime(est.createdAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
 est.stage === 'replied' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
 }`}>
                      {est.stage || 'Pending'}
                    </span>
                  </div>

                  {/* Inquiry Content */}
                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Customer Query / Requirement</strong>
                    <p className="leading-relaxed font-semibold line-clamp-3">"{est.requirement || est.description || 'No detailed requirement provided'}"</p>
                  </div>

                  {/* Admin Response display */}
                  {(est.adminResponse || est.attachmentUrl) && (
                    <div className="text-xs text-blue-800 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                      <strong className="block text-[9px] uppercase tracking-wider text-blue-700 mb-1">Admin Response Sent</strong>
                      {est.adminResponse && <p className="leading-relaxed font-semibold line-clamp-2">"{est.adminResponse}"</p>}
                      {est.attachmentUrl && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); openPdfBase64(est.attachmentUrl); }}
                            className="inline-flex items-center gap-1.5 bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-bold text-xs"
                          >
                            <FileText size={13} className="shrink-0" />
                            <span>View Attached PDF</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Cost</span>
                    <strong className="text-sm text-blue-600 font-extrabold">{formatCurrency(est.total)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(est)}
                    className="text-xs bg-blue-50 border border-blue-200 text-blue-700 font-bold px-3.5 py-2 rounded-xl hover:bg-blue-100 transition flex items-center gap-1.5"
                  >
                    <Edit size={13} />
                    Update Inquiry
                  </button>
                </div>
              </article>
            ))}
            </div>
            <Pagination
              currentPage={Math.min(currentPage, Math.max(1, Math.ceil(filteredEstimations.length / PAGE_SIZE)))}
              totalItems={filteredEstimations.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {/* Update Inquiry & Linked Product Modal */}
        {editingEstId && (() => {
          const activeEst = estimations.find((e) => e.id === editingEstId);
          if (!activeEst) return null;
          return (
            <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" onClick={handleCancelEdit}>
              <div
                className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-4 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Update Customer Inquiry</h3>
                    <p className="text-xs text-slate-500">{activeEst.customerName} · {activeEst.customerPhone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-2">
                  {/* Linked Product Details inside modal */}
                  <div className="md:col-span-5 bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                      <Package size={14} className="text-blue-600" />
                      Linked Product
                    </h4>
                    {selectedProduct ? (
                      <div className="space-y-3">
                        <div className="h-32 bg-white rounded-lg p-2 border border-slate-100 flex items-center justify-center">
                          <img src={selectedProduct.image} alt={selectedProduct.name} className="max-h-full max-w-full object-contain" />
                        </div>
                        <p className="text-xs font-bold text-slate-900">{selectedProduct.name}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-3">{selectedProduct.description}</p>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-semibold">Base Price</span>
                          <strong className="text-blue-600">{formatCurrency(selectedProduct.price)}</strong>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">{activeEst.productName}</p>
                    )}
                  </div>

                  {/* Reply Form */}
                  <div className="md:col-span-7 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Price (₹)</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Write Response Message</label>
                      <textarea
                        value={editResponse}
                        onChange={(e) => setEditResponse(e.target.value)}
                        placeholder="Write response details, estimate values, setup times..."
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white h-24 resize-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Attach PDF (Optional)</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="w-full text-xs"
                      />
                      {editAttachmentName && (
                        <p className="text-[11px] text-blue-600 font-bold mt-1">Selected: {editAttachmentName}</p>
                      )}
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateEstimation(activeEst.id)}
                        className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition"
                      >
                        Send Reply
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl transition border border-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </AppShell>
  );
};

export default AdminBillingPage;
