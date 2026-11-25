import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  ChevronDown,
  Send,
  Check,
  ShieldCheck,
  Clock,
  Search,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  FileText,
  Edit2,
  X,
  Award,
  Eye,
  Download,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import Tabs from '../../../components/ui/Tabs';
import Pagination from '../../../components/ui/Pagination';
import { useAuth } from '../../../utils/AuthContext';
import { getProducts, addEstimation, updateEstimation, addNotification } from '../../../utils/storage';
import { openPdfBase64, downloadPdf } from '../../../utils/pdfHelper';
import { customerLinks } from '../../../utils/customerLinks';
import { API_URL } from '../../../utils/api';
import { trackEnquirySubmit } from '../../../utils/analytics';
import { productTechnicalData } from '../../../data/productSlugs';
import './CustomerQueryPage.css';

const PAGE_SIZE = 6;

const CustomerQueryPage = () => {
  const { session } = useAuth();
  const location = useLocation();
  const products = useMemo(() => getProducts(), []);

  // Form State
  const initialProductId = location.state?.productId || products[0]?.id || '';
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [queryDescription, setQueryDescription] = useState('');
  const [toast, setToast] = useState(null);

  // Queries local state loaded from production API
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Query State
  const [editingQuery, setEditingQuery] = useState(null);
  const [editProductId, setEditProductId] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // View Query Details & Attachments Modal State
  const [viewingQuery, setViewingQuery] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Load queries from DB
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
        console.error('Failed to fetch customer queries', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchQueries();
    return () => {
      isMounted = false;
    };
  }, [session]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Selected product lookup
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || {};
  }, [products, selectedProductId]);

  // Dynamic Key Features for the selected product
  const keyFeatures = useMemo(() => {
    if (!selectedProduct) return [];
    const tech = productTechnicalData[selectedProduct.id];
    if (tech && tech.keyFeatures && tech.keyFeatures.length >= 4) {
      return tech.keyFeatures.slice(0, 4);
    }
    return [
      'Automated micro-controller switching logic',
      'Rust-proof premium steel level sensors',
      'Saves up to 35% water & power consumption',
      'Compatible with overhead and underground tanks'
    ];
  }, [selectedProduct]);

  // Handle Query Submission
  const handleSubmitQuery = async (e) => {
    e.preventDefault();

    if (!selectedProduct || !selectedProduct.id) {
      setToast({ type: 'error', message: 'Please select a product first.' });
      return;
    }
    if (!queryDescription.trim()) {
      setToast({ type: 'error', message: 'Please describe your requirement or question.' });
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

      // GA4 Enquiry Lead Event
      trackEnquirySubmit({
        inquiryId: newQueryId,
        inquiryType: selectedProduct.name
      });

      // Admin Notification
      addNotification({
        id: `not-${Date.now()}`,
        title: 'New Customer Query',
        message: `${session?.name || 'Customer'} submitted an inquiry for ${selectedProduct.name}.`,
        createdAt: new Date().toISOString(),
        read: false,
        estimationId: newQueryId
      });

      setQueries([newQuery, ...queries]);
      setQueryDescription('');
      setToast({ type: 'success', message: 'Your query has been submitted successfully.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to submit query. Please try again.' });
    }
  };

  // Clear query textarea
  const handleClear = () => {
    setQueryDescription('');
  };

  // Save Query Edit
  const handleSaveEdit = async () => {
    if (!editDescription.trim()) {
      setToast({ type: 'error', message: 'Query description cannot be empty.' });
      return;
    }
    const editProd = products.find((p) => p.id === editProductId) || selectedProduct;
    const updated = {
      ...editingQuery,
      productId: editProd.id,
      productName: editProd.name,
      total: editProd.price,
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

  // Filtered queries for past inquiries section
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      const isReplied =
        !!q.adminResponse ||
        !!q.attachmentUrl ||
        q.stage?.toLowerCase() === 'replied' ||
        q.stage?.toLowerCase() === 'completed';
      if (activeTab === 'Pending') return !isReplied;
      if (activeTab === 'Completed') return isReplied;
      return true;
    });
  }, [queries, activeTab]);

  const getStatusBadge = (stage) => {
    switch (stage?.toLowerCase()) {
      case 'requested':
      case 'pending':
        return { label: 'Pending', bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'under review':
      case 'review':
        return { label: 'Under Review', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'replied':
      case 'processed':
      case 'completed':
        return { label: 'Replied', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'closed':
        return { label: 'Closed', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
      default:
        return { label: 'Pending', bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    }
  };

  return (
    <AppShell title="Customer Query" links={customerLinks}>
      <div className="cq-container">

        {/* Toast Feedback - Centered Top */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`fixed top-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-sm font-bold ${
                toast.type === 'success' ? 'bg-emerald-200 text-emerald-950 border-emerald-300' : 'bg-red-200 text-red-950 border-red-300'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Header Section */}
        <div className="cq-header-section">
          <div className="cq-header-title-row">
            <span className="cq-accent-bar"></span>
            <h1 className="cq-main-heading">Customer Query</h1>
          </div>
          <p className="cq-subheading">
            Submit your product-related questions and get assistance from our support team.
          </p>
        </div>

        {/* 2. Main Two-Column Grid */}
        <div className="cq-main-grid">

          {/* Left Column: Query Details */}
          <div className="cq-card">
            <h2 className="cq-card-title">Query Details</h2>

            <form onSubmit={handleSubmitQuery} className="flex flex-col flex-grow">
              {/* Product Selector Dropdown */}
              <div className="cq-form-group" ref={dropdownRef}>
                <label className="cq-form-label">
                  Select Product <span className="cq-req-star">*</span>
                </label>

                <div
                  className={`cq-product-select-trigger ${dropdownOpen ? 'active' : ''}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="cq-trigger-left">
                    <img
                      src={selectedProduct?.image || '/Auto_Change_WaterLevel_Controller.png'}
                      alt={selectedProduct?.name}
                      className="cq-trigger-img"
                    />
                    <span className="cq-trigger-name">
                      {selectedProduct?.name || 'Select Product'}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`cq-trigger-chevron ${dropdownOpen ? 'open' : ''}`} />
                </div>

                {dropdownOpen && (
                  <div className="cq-dropdown-menu">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className={`cq-dropdown-item ${p.id === selectedProductId ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setDropdownOpen(false);
                        }}
                      >
                        <img src={p.image} alt={p.name} className="cq-item-img" />
                        <div>
                          <div className="cq-item-name">{p.name}</div>
                          <div className="cq-item-cat">{p.category || 'Automation'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Query Description Textarea */}
              <div className="cq-form-group">
                <label className="cq-form-label">
                  Your Query <span className="cq-req-star">*</span>
                </label>
                <textarea
                  value={queryDescription}
                  onChange={(e) => setQueryDescription(e.target.value)}
                  maxLength={1000}
                  placeholder="Describe your requirement, ask a question, or explain the issue you need assistance with..."
                  className="cq-textarea"
                />
                <div className="cq-char-counter">
                  {queryDescription.length} / 1000
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="cq-actions-row">
                <button
                  type="button"
                  onClick={handleClear}
                  className="cq-btn-clear"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  className="cq-btn-submit"
                >
                  <Send size={15} />
                  <span>Submit Query</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Selected Product Showcase */}
          <div className="cq-card">
            <h2 className="cq-card-title">Selected Product</h2>

            {selectedProduct && (
              <div className="flex flex-col flex-grow">
                {/* Product Showcase */}
                <div className="cq-product-showcase">
                  <div className="cq-product-thumb-box">
                    <img
                      src={selectedProduct.image || '/Auto_Change_WaterLevel_Controller.png'}
                      alt={selectedProduct.name}
                    />
                  </div>

                  <div className="cq-product-details">
                    <div className="cq-badges-row">
                      <span className="cq-cat-pill">
                        {selectedProduct.category || 'AUTOMATION'}
                      </span>
                      <span className="cq-stock-pill">
                        <span className="cq-stock-dot"></span>
                        In Stock
                      </span>
                    </div>

                    <h3 className="cq-product-name">{selectedProduct.name}</h3>
                    <p className="cq-product-desc">{selectedProduct.description}</p>
                  </div>
                </div>

                <hr className="cq-divider" />

                {/* Key Features */}
                <div className="cq-features-section">
                  <h4 className="cq-features-title">Key Features</h4>
                  <ul className="cq-features-list">
                    {keyFeatures.map((feature, idx) => (
                      <li key={idx} className="cq-feature-item">
                        <Check size={14} className="cq-check-icon" strokeWidth={2.5} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 1 Year Warranty Banner */}
                <div className="cq-warranty-banner">
                  <ShieldCheck size={20} className="cq-warranty-icon" />
                  <span className="cq-warranty-text">1 Year Warranty Included</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. My Submitted Queries Section */}
        {queries.length > 0 && (
          <div className="cq-history-section">
            <div className="cq-history-header">
              <div className="cq-history-title-group">
                <div className="cq-history-icon-badge">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="cq-history-title">My Submitted Queries</h3>
                  <p className="cq-history-subtitle">
                    Track questions, official engineering responses, and quotation updates
                  </p>
                </div>
              </div>

              <div className="cq-tabs-wrapper">
                <Tabs
                  tabs={[
                    { id: 'All', label: 'All Queries', count: queries.length },
                    {
                      id: 'Pending',
                      label: 'In Review',
                      count: queries.filter(
                        (q) => !q.adminResponse && !q.attachmentUrl && q.stage !== 'replied' && q.stage !== 'completed'
                      ).length
                    },
                    {
                      id: 'Completed',
                      label: 'Replied & Resolved',
                      count: queries.filter(
                        (q) => !!q.adminResponse || !!q.attachmentUrl || q.stage === 'replied' || q.stage === 'completed'
                      ).length
                    }
                  ]}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />
              </div>
            </div>

            <div className="cq-queries-grid">
              {filteredQueries.slice((Math.min(currentPage, Math.max(1, Math.ceil(filteredQueries.length / PAGE_SIZE))) - 1) * PAGE_SIZE, Math.min(currentPage, Math.max(1, Math.ceil(filteredQueries.length / PAGE_SIZE))) * PAGE_SIZE).map((query) => {
                const badge = getStatusBadge(query.stage);
                const dispDate = query.createdAt
                  ? new Date(query.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Recent';

                const isReplied =
                  query.stage?.toLowerCase() === 'replied' ||
                  query.stage?.toLowerCase() === 'completed' ||
                  query.stage?.toLowerCase() === 'processed' ||
                  Boolean(query.adminResponse && query.adminResponse.trim().length > 0) ||
                  Boolean(query.attachmentUrl);

                return (
                  <div
                    key={query.id}
                    className="cq-query-grid-card group"
                    onClick={() => setViewingQuery(query)}
                  >
                    {/* Card Top: Product Thumb, Name, Date, Status */}
                    <div className="cq-qcard-grid-header">
                      <div className="cq-qcard-grid-product">
                        <div className="cq-qcard-grid-thumb">
                          <img
                            src={query.productImage || '/Auto_Change_WaterLevel_Controller.png'}
                            alt={query.productName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="cq-qcard-grid-meta">
                          <h4 className="cq-qcard-grid-name" title={query.productName}>
                            {query.productName}
                          </h4>
                          <span className="cq-qcard-grid-date">{dispDate}</span>
                        </div>
                      </div>

                      <div className="cq-qcard-grid-actions">
                        <span
                          className="cq-status-pill"
                          style={{
                            background: badge.bg,
                            color: badge.text,
                            borderColor: badge.border
                          }}
                        >
                          {badge.label}
                        </span>

                        {!isReplied && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingQuery(query);
                              setEditProductId(query.productId);
                              setEditDescription(query.requirement);
                            }}
                            className="cq-qcard-grid-edit"
                            title="Edit query"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Requirement Text */}
                    <div className="cq-qcard-grid-body">
                      <p className="cq-qcard-grid-requirement">
                        {query.requirement}
                      </p>
                    </div>

                    {/* Response snippet if MOSH engineering replied */}
                    {query.adminResponse && (
                      <div className="cq-qcard-grid-reply">
                        <MessageSquare size={13} className="text-blue-600 shrink-0" />
                        <span className="truncate">Replied: {query.adminResponse}</span>
                      </div>
                    )}

                    {/* Card Footer: View Details & Attachments Link */}
                    <div className="cq-qcard-grid-footer">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        {query.attachmentUrl ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                            <FileText size={12} />
                            Quotation Ready
                          </span>
                        ) : (
                          <span>Details</span>
                        )}
                      </div>

                      <div className="cq-qcard-grid-cta">
                        <span>View Details</span>
                        <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={Math.min(currentPage, Math.max(1, Math.ceil(filteredQueries.length / PAGE_SIZE)))}
              totalItems={filteredQueries.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Edit Query Modal */}
        <AnimatePresence>
          {editingQuery && (
            <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full mx-4 p-6 relative"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Update Query</h3>
                  <button
                    onClick={() => setEditingQuery(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="py-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Target Product
                    </label>
                    <select
                      value={editProductId}
                      onChange={(e) => setEditProductId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-600"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Query
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={5}
                      className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-blue-600 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingQuery(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* View Query Details & Attachments Modal */}
        <AnimatePresence>
          {viewingQuery && (
            <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inquiry Details</span>
                      <span
                        className="cq-status-pill text-[10px]"
                        style={{
                          background: getStatusBadge(viewingQuery.stage).bg,
                          color: getStatusBadge(viewingQuery.stage).text,
                          borderColor: getStatusBadge(viewingQuery.stage).border
                        }}
                      >
                        {getStatusBadge(viewingQuery.stage).label}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                      {viewingQuery.productName}
                    </h3>
                  </div>
                  <button
                    onClick={() => setViewingQuery(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="py-5 space-y-5">
                  {/* Product Mini Preview */}
                  <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <img
                      src={viewingQuery.productImage || '/Auto_Change_WaterLevel_Controller.png'}
                      alt={viewingQuery.productName}
                      className="w-14 h-14 object-contain bg-white rounded-xl p-1 border border-slate-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{viewingQuery.productName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Submitted on{' '}
                        {viewingQuery.createdAt
                          ? new Date(viewingQuery.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Recent'}
                      </p>
                    </div>
                  </div>

                  {/* Customer Requirement */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Your Query / Requirement
                    </label>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 leading-relaxed">
                      {viewingQuery.requirement || 'No requirement provided.'}
                    </div>
                  </div>

                  {/* Engineering Response */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Support Team Response
                    </label>
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-sm text-slate-800 leading-relaxed">
                      {viewingQuery.adminResponse ? (
                        <p className="text-slate-800">{viewingQuery.adminResponse}</p>
                      ) : (
                        <p className="text-slate-500 text-xs italic">
                          Your query is currently under review by our senior automation engineering team. You will be notified once a response and technical estimate are issued.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Official Quotation & Attachments
                    </label>
                    {viewingQuery.attachmentUrl ? (
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              MOSH_Official_Quotation_{viewingQuery.id}.pdf
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">Verified PDF Document</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const targetUrl = viewingQuery.attachmentUrl.startsWith('http') || viewingQuery.attachmentUrl.startsWith('data:')
                                ? viewingQuery.attachmentUrl
                                : `${API_URL}${viewingQuery.attachmentUrl.startsWith('/') ? '' : '/'}${viewingQuery.attachmentUrl}`;
                              openPdfBase64(targetUrl, `Quotation-${viewingQuery.id}.pdf`);
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const targetUrl = viewingQuery.attachmentUrl.startsWith('http') || viewingQuery.attachmentUrl.startsWith('data:')
                                ? viewingQuery.attachmentUrl
                                : `${API_URL}${viewingQuery.attachmentUrl.startsWith('/') ? '' : '/'}${viewingQuery.attachmentUrl}`;
                              downloadPdf(targetUrl, `Quotation-${viewingQuery.id}.pdf`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No PDF quotation or attachments added yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setViewingQuery(null)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
};

export default CustomerQueryPage;
