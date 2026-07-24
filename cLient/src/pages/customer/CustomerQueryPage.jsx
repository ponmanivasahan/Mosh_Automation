import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import AppShell from '../../components/AppShell';
import { useAuth } from '../../utils/AuthContext';
import { getProducts, getEstimations, addEstimation, updateEstimation, addNotification } from '../../utils/storage';
import { formatDateTime } from '../../utils/format';
import { customerLinks } from '../../utils/customerLinks';

// Static feature list seed for products (Enterprise-level details)
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
  const products = getProducts();

  // Queries local state loaded from storage
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // All, Pending, Completed

  // Form State
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  // Editing Modal State
  const [editingQuery, setEditingQuery] = useState(null);
  const [editProductId, setEditProductId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDropdownOpen, setEditDropdownOpen] = useState(false);
  const [editSearchQuery, setEditSearchQuery] = useState('');

  // Toast / Messages
  const [toast, setToast] = useState(null);

  // Load queries on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const allQueries = getEstimations();
      // Filter for current signed-in customer
      const filtered = allQueries.filter((q) => q.customerPhone === session?.phone);
      setQueries(filtered);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [session]);

  // Toast dismissal helper
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Search filter for product list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Product selection preview info
  const productFeatures = useMemo(() => {
    if (!selectedProduct) return [];
    return getProductFeatures(selectedProduct.name);
  }, [selectedProduct]);

  // Search filter for editing dropdown
  const editFilteredProducts = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(editSearchQuery.toLowerCase()));
  }, [products, editSearchQuery]);

  const editSelectedProduct = useMemo(() => {
    return products.find((p) => p.id === editProductId);
  }, [products, editProductId]);

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      const isReplied = !!q.adminResponse || q.stage?.toLowerCase() === 'replied' || q.stage?.toLowerCase() === 'completed';
      if (activeTab === 'Pending') return !isReplied;
      if (activeTab === 'Completed') return isReplied;
      return true;
    });
  }, [queries, activeTab]);

  // Handle Query Submission
  const handleSubmitQuery = (e) => {
    e.preventDefault();

    if (!selectedProduct) {
      setToast({ type: 'error', message: 'Please select a product first.' });
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
      total: selectedProduct.price, // Fallback price
      quantity: 1,
      complexity: 'medium',
      createdAt: new Date().toISOString(),
      stage: 'requested' // Stage acts as status (requested = pending, processed = under_review / replied / closed)
    };

    addEstimation(newQuery);
    addNotification({
      id: `not-${Date.now()}`,
      title: 'New Customer Query',
      message: `${session?.name || 'Customer'} submitted a query for ${selectedProduct.name}.`,
      createdAt: new Date().toISOString(),
      read: false,
      estimationId: newQueryId
    });

    // Refresh query list
    setQueries([newQuery, ...queries]);
    setQueryDescription('');
    setAttachmentName('');
    setToast({ type: 'success', message: 'Your query has been submitted successfully.' });
  };

  // Open Edit Modal
  const handleOpenEdit = (query) => {
    setEditingQuery(query);
    setEditProductId(query.productId);
    setEditDescription(query.requirement);
    setEditSearchQuery('');
  };

  // Save Edits
  const handleUpdateQuery = () => {
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

    updateEstimation(updated);
    
    // Refresh UI list
    setQueries(queries.map((q) => (q.id === editingQuery.id ? updated : q)));
    setEditingQuery(null);
    setToast({ type: 'success', message: 'Query updated successfully.' });
  };

  // Status mapping to Lucide/Colors
  const getStatusConfig = (stage) => {
    switch (stage?.toLowerCase()) {
      case 'requested':
      case 'pending':
        return { label: 'Pending', colorClass: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'under review':
      case 'review':
        return { label: 'Under Review', colorClass: 'bg-blue-50 text-blue-700 border-blue-200', icon: Search };
      case 'replied':
      case 'processed':
        return { label: 'Replied', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: MessageSquare };
      case 'closed':
        return { label: 'Closed', colorClass: 'bg-slate-100 text-slate-600 border-slate-200', icon: CheckCircle };
      default:
        return { label: 'Pending', colorClass: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
    }
  };

  return (
    <AppShell title="Customer Query" links={customerLinks}>
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        
        {/* Toast alert */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-xl ${
                toast.type === 'success' ? 'bg-teal-600 text-white border-teal-500' : 'bg-rose-600 text-white border-rose-500'
              }`}
            >
              {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
              <span className="font-semibold text-sm">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Hero */}
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

        {/* Dynamic Submission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main submission card form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Searchable Product dropdown trigger */}
            <div className="space-y-2 relative">
              <label className="block text-sm font-semibold text-slate-800">Select Product</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl transition text-left focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {selectedProduct ? (
                    <div className="flex items-center gap-3">
                      <img src={selectedProduct.image} alt={selectedProduct.name} className="w-8 h-8 object-contain rounded-lg bg-white p-1 border border-slate-100" />
                      <span className="font-semibold text-slate-800 text-sm">{selectedProduct.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">Select Product...</span>
                  )}
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute z-30 w-full mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search product..."
                          className="w-full text-sm outline-none bg-transparent"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {filteredProducts.length ? (
                          filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setDropdownOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left border-b border-slate-100 last:border-0"
                            >
                              <img src={p.image} alt={p.name} className="w-8 h-8 object-contain rounded-lg bg-white p-1 border border-slate-100" />
                              <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                            </button>
                          ))
                        ) : (
                          <div className="py-4 text-center text-xs text-slate-400">No products found</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Query Entry Textarea */}
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

            {/* Optional Attachment (UI only) */}
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

            {/* Submit CTA */}
            <button
              onClick={handleSubmitQuery}
              className="w-full flex items-center justify-center py-3.5 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white rounded-2xl font-bold text-sm transition-all duration-300 shadow-md hover:shadow-lg shadow-teal-600/20"
            >
              Submit Query
            </button>
          </div>

          {/* Selected Product Information Card */}
          <div className="lg:col-span-5">
            {selectedProduct && (
              <motion.div
                key={selectedProduct.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm"
              >
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
                      <span className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide bg-teal-50 text-teal-700 rounded-full">
                        {selectedProduct.category || 'Automation'}
                      </span>
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        In Stock
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-slate-800 leading-snug">{selectedProduct.name}</h3>
                    <p className="mt-2 text-slate-500 text-xs leading-relaxed">{selectedProduct.description}</p>
                  </div>

                  {/* Bulleted Features */}
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

                  {/* Warranty and Trust row */}
                  <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500">
                      <ShieldCheck size={16} className="text-teal-600" />
                      <span className="text-xs font-semibold">1 Year Warranty Included</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Submitted Queries Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex p-2 rounded-xl bg-slate-100 text-slate-700">
              <FileText size={20} />
            </span>
            <h3 className="text-xl font-bold text-slate-800">My Submitted Queries</h3>
          </div>

          {/* Tabs Filter Bar */}
          <div className="flex gap-2 border-b border-slate-200 pb-3">
            {['All', 'Pending', 'Completed'].map((tab) => {
              const count = tab === 'All'
                ? queries.length
                : tab === 'Pending'
                ? queries.filter(q => !q.adminResponse && q.stage !== 'replied' && q.stage !== 'completed').length
                : queries.filter(q => !!q.adminResponse || q.stage === 'replied' || q.stage === 'completed').length;
              
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                    activeTab === tab
                      ? 'bg-teal-600 text-white shadow-md'
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
                <div key={i} className="h-56 bg-slate-100 animate-pulse border border-slate-200 rounded-3xl" />
              ))}
            </div>
          ) : filteredQueries.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredQueries.map((q) => {
                const statusInfo = getStatusConfig(q.adminResponse ? 'replied' : q.stage);
                const StatusIcon = statusInfo.icon;
                const isPending = (q.stage?.toLowerCase() === 'requested' || q.stage?.toLowerCase() === 'pending') && !q.seen && !q.adminResponse;

                return (
                  <article key={q.id} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-6 hover:shadow-md hover:border-slate-300 transition duration-300">
                    <div className="space-y-4">
                      {/* Query ID, Status and Date header */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-400 tracking-wider">#{q.id}</span>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-bold ${statusInfo.colorClass}`}>
                            <StatusIcon size={12} />
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Product display info */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                        <img src={q.productImage || '/logo background.png'} alt={q.productName} className="w-10 h-10 object-contain rounded-lg bg-white p-1 border border-slate-100" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{q.productName}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">{formatDateTime(q.createdAt)}</span>
                        </div>
                      </div>

                      {/* Question details */}
                      <div className="space-y-1">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Question / Inquiry</span>
                        <p className="text-slate-700 text-sm font-medium leading-relaxed">{q.requirement}</p>
                      </div>

                      {q.adminResponse && (
                        <div className="rounded-2xl bg-teal-50/50 p-3 border border-teal-100/50 text-slate-800 text-xs">
                          <strong className="block text-teal-800 font-bold uppercase tracking-wider text-[9px] mb-1">Admin Response</strong>
                          <p className="leading-relaxed font-semibold">{q.adminResponse}</p>
                        </div>
                      )}
                    </div>

                    {/* Edit Option with Guard Message */}
                    <div className="pt-4 border-t border-slate-100">
                      {isPending ? (
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="flex items-center gap-2 text-xs font-bold text-teal-600 hover:text-teal-700 transition"
                        >
                          <Edit2 size={13} /> Edit Query
                        </button>
                      ) : (
                        <div className="flex items-start gap-2 text-slate-400">
                          <XCircle size={14} className="mt-0.5 flex-shrink-0" />
                          <span className="text-[11px] font-medium leading-normal">
                            This query can no longer be edited because it is currently being processed by our support team.
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-slate-200/80 rounded-3xl flex flex-col items-center justify-center p-6 space-y-4">
              <div className="p-4 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
                <Inbox size={42} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">No Queries Submitted</h4>
                <p className="mt-1 text-sm text-slate-500 max-w-sm">
                  You haven't submitted any questions or custom requirements yet. Choose a product above to start a direct query with support.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Editing Dialog Modal */}
      <AnimatePresence>
        {editingQuery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full mx-4 p-6 sm:p-8 shadow-2xl relative space-y-6"
            >
              {/* Header */}
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

              {/* Product Selection drop inside modal */}
              <div className="space-y-2 relative">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Associated Product</label>
                <button
                  type="button"
                  onClick={() => setEditDropdownOpen(!editDropdownOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-left focus:outline-none"
                >
                  {editSelectedProduct ? (
                    <div className="flex items-center gap-3">
                      <img src={editSelectedProduct.image} alt={editSelectedProduct.name} className="w-6 h-6 object-contain rounded bg-white p-0.5 border" />
                      <span className="font-semibold text-slate-800 text-xs">{editSelectedProduct.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">Select Product...</span>
                  )}
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {/* Modal Dropdown panel */}
                <AnimatePresence>
                  {editDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute z-40 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="p-2.5 border-b flex items-center gap-2">
                        <Search className="h-4.5 w-4.5 text-slate-400" />
                        <input
                          type="text"
                          value={editSearchQuery}
                          onChange={(e) => setEditSearchQuery(e.target.value)}
                          placeholder="Search product..."
                          className="w-full text-xs outline-none bg-transparent"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {editFilteredProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setEditProductId(p.id);
                              setEditDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition text-left text-xs font-semibold text-slate-800"
                          >
                            <img src={p.image} alt={p.name} className="w-6 h-6 object-contain rounded bg-white p-0.5 border" />
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Requirement Edit details */}
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

              {/* Action submit modal CTAs */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditingQuery(null)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 transition text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateQuery}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition text-xs font-bold"
                >
                  Update Query
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

export default CustomerQueryPage;
