import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../../../components/CustomSelect';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  Edit2,
  Paperclip,
  Check,
  X,
  AlertCircle,
  FileText,
  ShieldCheck,
  Sparkles,
  Inbox
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { useAuth } from '../../../utils/AuthContext';
import { getProducts, getEstimations, addEstimation, updateEstimation, addNotification } from '../../../utils/storage';
import { formatDateTime } from '../../../utils/format';
import { customerLinks } from '../../../utils/customerLinks';
import { API_URL } from '../../../utils/api';
import { useLocation } from 'react-router-dom';

import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

const getProductFeatures = (productName) => {
  if (productName.includes('Wireless')) {
    return [
      'Up to 500m wireless communication range',
      'Ultra-low power RF transmitter module',
      'LED signal strength & level indicator',
      'Advanced digital noise filtering algorithm'
    ];
  }
  if (productName.includes('Three Phase')) {
    return [
      'Industrial-grade phase failure protection',
      'Overload and dry-run auto preventer',
      'High-voltage surge protection circuit',
      'Auto-recovery delay timer integration'
    ];
  }
  if (productName.includes('Dry Run')) {
    return [
      'Current-sensing dry run protection',
      'LED status diagnostics panel',
      'Adjustable dry run restart timer',
      'Compact panel mounting enclosures'
    ];
  }
  return [
    'Automated micro-controller switching logic',
    'Rust-proof premium steel level sensors',
    'Saves up to 35% water & power consumption',
    'Compatible with overhead and underground tanks'
  ];
};

const CustomerQueryPage = () => {
  const { session } = useAuth();
  const location = useLocation();
  const products = getProducts();

  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const initialProductId = location.state?.productId || (products[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [searchQuery, setSearchQuery] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const [editingQuery, setEditingQuery] = useState(null);
  const [editProductId, setEditProductId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSearchQuery, setEditSearchQuery] = useState('');

  const [toast, setToast] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchQueries = async () => {
      try {
        const res = await fetch(`${API_URL}/api/estimations`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.estimations && isMounted) {
            setQueries(data.estimations);
          }
        }
      } catch (err) {
        console.error('Failed to fetch queries', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchQueries();
    return () => { isMounted = false; };
  }, [session]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  const productFeatures = useMemo(() => {
    if (!selectedProduct) return [];
    return getProductFeatures(selectedProduct.name);
  }, [selectedProduct]);

  const editSelectedProduct = useMemo(() => {
    return products.find((p) => p.id === editProductId);
  }, [products, editProductId]);

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      const isReplied = !!q.adminResponse || !!q.attachmentUrl || q.stage?.toLowerCase() === 'replied' || q.stage?.toLowerCase() === 'completed';
      if (activeTab === 'Pending') return !isReplied;
      if (activeTab === 'Completed') return isReplied;
      return true;
    });
  }, [queries, activeTab]);

  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      setToast({ type: 'error', message: 'Please select a product.' });
      return;
    }
    if (!queryDescription.trim()) {
      setToast({ type: 'error', message: 'Query description cannot be empty.' });
      return;
    }

    const newQueryId = `est-${Date.now()}`;
    const newQuery = {
      id: newQueryId,
      customerName: session?.name || 'Customer',
      customerPhone: session?.phone || '0000000000',
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productImage: selectedProduct.image,
      requirement: queryDescription.trim(),
      total: selectedProduct.price,
      quantity: 1,
      complexity: 'medium',
      createdAt: new Date().toISOString(),
      stage: 'requested'
    };

    try {
      await addEstimation(newQuery);
      addNotification({
        id: `not-${Date.now()}`,
        title: 'New Customer Query',
        message: `${session?.name || 'Customer'} submitted a query for ${selectedProduct.name}.`,
        createdAt: new Date().toISOString(),
        read: false,
        estimationId: newQueryId
      });
      setQueries([newQuery, ...queries]);
      setQueryDescription('');
      setAttachmentName('');
      setToast({ type: 'success', message: 'Your query has been submitted successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to submit query.' });
    }
  };

  const handleOpenEdit = (query) => {
    setEditingQuery(query);
    setEditProductId(query.productId);
    setEditDescription(query.requirement);
  };

  const handleUpdateQuery = async () => {
    if (!editSelectedProduct) return;
    if (!editDescription.trim()) {
      setToast({ type: 'error', message: 'Query description cannot be empty.' });
      return;
    }

    const updated = {
      ...editingQuery,
      productId: editSelectedProduct.id,
      productName: editSelectedProduct.name,
      total: editSelectedProduct.price,
      requirement: editDescription.trim()
    };

    try {
      await updateEstimation(updated);
      setQueries(queries.map((q) => (q.id === editingQuery.id ? updated : q)));
      setEditingQuery(null);
      setToast({ type: 'success', message: 'Query updated successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update query.' });
    }
  };

  const getStatusVariant = (stage) => {
    switch (stage?.toLowerCase()) {
      case 'requested':
      case 'pending': return 'warning';
      case 'under review':
      case 'review': return 'info';
      case 'replied':
      case 'processed': return 'success';
      case 'closed': return 'default';
      default: return 'warning';
    }
  };

  const getStatusLabel = (stage) => {
    switch (stage?.toLowerCase()) {
      case 'requested':
      case 'pending': return 'Pending';
      case 'under review':
      case 'review': return 'Under Review';
      case 'replied':
      case 'processed': return 'Replied';
      case 'closed': return 'Closed';
      default: return 'Pending';
    }
  };

  const getStatusIcon = (stage) => {
    switch (stage?.toLowerCase()) {
      case 'requested':
      case 'pending': return Clock;
      case 'under review':
      case 'review': return Search;
      case 'replied':
      case 'processed': return MessageSquare;
      case 'closed': return CheckCircle;
      default: return Clock;
    }
  };

  return (
    <AppShell title="Customer Query" links={customerLinks}>
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl ${
                toast.type === 'success' ? 'bg-teal-600 text-white border-teal-500' : 'bg-rose-600 text-white border-rose-500'
              }`}
            >
              {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
              <span className="font-semibold text-sm">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-gradient-to-br from-teal-700/10 via-sky-600/5 to-transparent border border-slate-200/80 p-8 sm:p-10 rounded-3xl space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-teal-600/10 text-teal-700">
            <HelpCircle size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Customer Query</h2>
            <p className="mt-2 text-slate-600 max-w-2xl text-base font-medium leading-relaxed">
              Submit your product-related questions and communicate directly with our support team.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <Card className="lg:col-span-7 p-6 sm:p-8 space-y-6">
            <CustomSelect
              label="Select Product"
              value={selectedProductId}
              onChange={setSelectedProductId}
              options={products.map(p => ({
                value: p.id,
                label: p.name,
                image: p.image,
                description: p.description
              }))}
              searchable={true}
              placeholder="Select Product..."
            />

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">Describe Your Requirement</label>
              <textarea
                value={queryDescription}
                onChange={(e) => setQueryDescription(e.target.value)}
                maxLength={1000}
                rows={6}
                placeholder="Describe your requirement, ask your question, or explain the issue you need assistance with..."
                className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition text-sm text-slate-800 leading-relaxed"
              />
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                <span>Maximum 1000 characters</span>
                <span>{queryDescription.length} / 1000</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Attachment (Optional)</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 text-slate-600 hover:text-teal-700 transition cursor-pointer text-xs font-bold">
                  <Paperclip size={14} />
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setAttachmentName(e.target.files[0]?.name || '')}
                  />
                </label>
                {attachmentName && (
                  <span className="text-xs text-teal-600 font-semibold flex items-center gap-2">
                    <FileText size={12} /> {attachmentName}
                  </span>
                )}
              </div>
            </div>

            <Button onClick={handleSubmitQuery} className="w-full" size="lg">
              Submit Query
            </Button>
          </Card>

          <div className="lg:col-span-5">
            {selectedProduct && (
              <motion.div
                key={selectedProduct.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="overflow-hidden">
                  <div className="h-48 bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6 border-b border-slate-100">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="max-h-full max-w-full object-contain transition-transform hover:scale-105 duration-300"
                    />
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <Badge variant="primary" className="uppercase tracking-wide">
                          {selectedProduct.category || 'Automation'}
                        </Badge>
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          In Stock
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-slate-800 leading-snug">{selectedProduct.name}</h3>
                      <p className="mt-2 text-slate-500 text-xs leading-relaxed">{selectedProduct.description}</p>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Features</span>
                      <ul className="space-y-1.5">
                        {productFeatures.map((f, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                            <Check className="text-teal-600 mt-0.5 flex-shrink-0" size={12} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <ShieldCheck size={16} className="text-teal-600" />
                        <span className="text-xs font-semibold">1 Year Warranty Included</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex p-2 rounded-xl bg-slate-100 text-slate-700">
              <FileText size={20} />
            </span>
            <h3 className="text-xl font-bold text-slate-800">My Submitted Queries</h3>
          </div>

          <div className="flex gap-2 border-b border-slate-200 pb-3">
            {['All', 'Pending', 'Completed'].map((tab) => {
              const count = tab === 'All'
                ? queries.length
                : tab === 'Pending'
                ? queries.filter(q => !q.adminResponse && !q.attachmentUrl && q.stage !== 'replied' && q.stage !== 'completed').length
                : queries.filter(q => !!q.adminResponse || !!q.attachmentUrl || q.stage === 'replied' || q.stage === 'completed').length;
              
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                    activeTab === tab
                      ? 'bg-teal-600 text-white '
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-56 bg-slate-100 animate-pulse border-2 border-slate-200 rounded-xl" />
              ))}
            </div>
          ) : filteredQueries.length ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredQueries.map((q) => {
                const effectiveStage = q.adminResponse || q.attachmentUrl ? 'replied' : q.stage;
                const variant = getStatusVariant(effectiveStage);
                const label = getStatusLabel(effectiveStage);
                const Icon = getStatusIcon(effectiveStage);
                const isPending = (q.stage?.toLowerCase() === 'requested' || q.stage?.toLowerCase() === 'pending') && !q.seen && !q.adminResponse && !q.attachmentUrl;

                return (
                  <Card hover key={q.id} className="p-6 flex flex-col gap-6">
                    <div className="space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-slate-400 tracking-wider">#{q.id}</span>
                          <div className="flex items-center gap-3">
                            <img src={q.productImage || '/logo background.png'} alt={q.productName} className="w-8 h-8 object-contain bg-slate-50 rounded p-1 border border-slate-100" />
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">{q.productName}</h4>
                              <span className="text-[10px] text-slate-400 font-semibold">{formatDateTime(q.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={variant} className="gap-1.5 px-3 py-1 text-xs">
                          <Icon size={12} /> {label}
                        </Badge>
                      </div>

                      <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex flex-col gap-1 items-end">
                          <span className="text-[10px] text-slate-400 font-bold px-1">You</span>
                          <div className="bg-teal-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[90%]">
                            {q.requirement}
                          </div>
                        </div>
                        
                        {(q.adminResponse || q.attachmentUrl) && (
                          <div className="flex flex-col gap-1 items-start mt-2">
                            <span className="text-[10px] text-slate-400 font-bold px-1">Support Team</span>
                            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-700 shadow-sm max-w-[90%]">
                              {q.adminResponse && <p className="leading-relaxed font-medium">{q.adminResponse}</p>}
                              {q.attachmentUrl && (
                                <div className="mt-3 flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <span className="text-slate-600 font-bold text-xs flex items-center gap-1.5">
                                    <FileText size={14}/> Estimation.pdf
                                  </span>
                                  <a href={q.attachmentUrl} download="Estimation.pdf" className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md transition shadow-sm font-bold">
                                    Download PDF
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      {isPending ? (
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="flex items-center gap-2 text-xs font-bold text-teal-600 hover:text-teal-700 transition"
                        >
                          <Edit2 size={13} /> Edit Query
                        </button>
                      ) : (
                        <div className="flex items-start gap-2 text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <XCircle size={14} className="mt-0.5 flex-shrink-0" />
                          <span className="text-[11px] font-medium leading-normal">
                            This query can no longer be edited because it is currently being processed by our support team.
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              icon={Inbox}
              title="No Queries Submitted"
              description="You haven't submitted any questions or custom requirements yet. Choose a product above to start a direct query with support."
            />
          )}
        </div>

      </div>

      <AnimatePresence>
        {editingQuery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="max-w-lg w-full p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Edit2 size={18} className="text-teal-600" />
                    Modify Query
                  </h3>
                  <button
                    onClick={() => setEditingQuery(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <CustomSelect
                  label="Associated Product"
                  value={editProductId}
                  onChange={setEditProductId}
                  options={products.map(p => ({
                    value: p.id,
                    label: p.name,
                    image: p.image,
                    description: p.description
                  }))}
                  searchable={true}
                  placeholder="Select Product..."
                />

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Query Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    maxLength={1000}
                    rows={5}
                    className="w-full p-3.5 border border-slate-200 rounded-xl outline-none focus:border-teal-600 transition text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="secondary" onClick={() => setEditingQuery(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateQuery}>
                    Update Query
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

export default CustomerQueryPage;
