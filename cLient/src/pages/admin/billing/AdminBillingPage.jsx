import { useState, useEffect, useMemo } from 'react';
import { Package, HelpCircle, Check, AlertCircle, Edit, DollarSign, Clock, ListFilter, FileText } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { getProducts, getBillingSettings, setBillingSettings, updateEstimation } from '../../../utils/storage';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { openPdfBase64 } from '../../../utils/pdfHelper';
import { API_URL } from '../../../utils/api';

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

const AdminBillingPage = () => {
  const [products, setProducts] = useState([]);
  const [estimations, setEstimations] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [toast, setToast] = useState(null);

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

    if (file.type !== 'application/pdf') {
      setToast({ type: 'error', message: 'Only PDF files are allowed.' });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setToast({ type: 'error', message: 'PDF file exceeds the allowed size of 5MB.' });
      e.target.value = '';
      return;
    }

    setEditAttachment(file);
    setEditAttachmentName(file.name);
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
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-6 lg:sticky lg:top-28">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Linked Product Details
              </h3>
              <p className="text-xs text-slate-500 mt-1">Examine product details connected to the active customer query.</p>
            </div>

            {selectedProduct ? (
              <Card className="p-4 space-y-4">
                <div className="h-44 bg-slate-50 rounded-lg p-3 border flex items-center justify-center">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{selectedProduct.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">Product ID: {selectedProduct.id}</p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed font-semibold">{selectedProduct.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Base Price</span>
                    <strong className="text-sm text-primary font-bold">{formatCurrency(selectedProduct.price)}</strong>
                  </div>
                </div>
              </Card>
            ) : (
              <EmptyState 
                icon={Package} 
                title="No product selected" 
                description="Click 'Update Inquiry' on a query card to view its linked product specifications." 
              />
            )}
          </div>

          {/* Right Column: Customer Queries Viewer & Updater */}
          <div className="lg:col-span-8 bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-6 max-h-[78vh] overflow-y-auto overflow-x-hidden">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <HelpCircle size={16} className="text-primary" />
                  Customer Estimation Queries
                </h3>
                <p className="text-xs text-slate-500 mt-1">Review live inquiry requests and update values directly.</p>
              </div>
              <Badge variant="default" className="text-[10px]">
                {estimations.length} inquiries
              </Badge>
            </div>

            {!estimations.length ? (
              <EmptyState
                icon={HelpCircle}
                title="No inquiries"
                description="No customer estimation inquiries found."
              />
            ) : (
              <div className="space-y-4">
                {estimations.map((est) => {
                  const isEditing = editingEstId === est.id;
                  return (
                    <Card key={est.id} className="p-5 space-y-4">
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
                        <Badge variant={est.stage === 'replied' ? 'success' : 'warning'}>
                          {est.stage || 'Pending'}
                        </Badge>
                      </div>

                      {/* Inquiry Content */}
                      <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <strong className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Customer Query / Requirement</strong>
                        <p className="leading-relaxed font-semibold">"{est.requirement || est.description || 'No detailed requirement provided'}"</p>
                      </div>

                      {/* Admin Response display if not editing */}
                      {!isEditing && (est.adminResponse || est.attachmentUrl) && (
                        <div className="text-xs text-teal-800 bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                          <strong className="block text-[9px] uppercase tracking-wider text-teal-700 mb-1">Admin Response Sent</strong>
                          {est.adminResponse && <p className="leading-relaxed font-semibold">"{est.adminResponse}"</p>}
                          {est.attachmentUrl && (
                            <div className="mt-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => { e.preventDefault(); openPdfBase64(est.attachmentUrl); }}
                                className="font-bold text-primary border-primary/20"
                              >
                                <FileText size={14} className="mr-1" /> View Attached PDF
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Display Edit Fields if in edit mode */}
                      {isEditing ? (
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 mt-3 space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Estimated Price (₹)</label>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Write Response Message</label>
                            <textarea
                              value={editResponse}
                              onChange={(e) => setEditResponse(e.target.value)}
                              placeholder="Write response details, estimate values, setup times..."
                              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none h-[70px] resize-none font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Attach PDF (Optional)</label>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handleFileChange}
                              className="w-full text-xs"
                            />
                            {editAttachmentName && (
                              <p className="text-[10px] text-primary font-bold mt-1">Selected: {editAttachmentName}</p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleUpdateEstimation(est.id)}
                              className="flex-1"
                            >
                              Send Reply
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Estimated Cost:</span>
                            <strong className="text-sm text-primary font-bold">{formatCurrency(est.total)}</strong>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStartEdit(est)}
                            className="text-xs font-bold"
                          >
                            <Edit size={12} className="mr-1.5" />
                            Update Inquiry
                          </Button>
                        </div>
                      )}
                    </Card>
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
