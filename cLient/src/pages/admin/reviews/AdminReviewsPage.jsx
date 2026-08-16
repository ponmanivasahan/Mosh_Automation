import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, CheckCircle, Reply, Check, AlertCircle, X } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { getReviews, updateReview, deleteReview } from '../../../utils/storage';
import { formatDateTime } from '../../../utils/format';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Product Management' },
  { to: '/admin/billing', label: 'Query Management' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/stories', label: 'Success Stories' },
  { to: '/admin/estimations', label: 'Estimation Calculator' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/customers', label: 'Customers' }
];

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState(() => getReviews());
  const [replyText, setReplyText] = useState({});
  const [replyingId, setReplyingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [toast, setToast] = useState(null);
 
  // Live Syncing feed
  useEffect(() => {
    const fetchLatest = () => {
      setReviews(getReviews());
    };
    const interval = setInterval(fetchLatest, 1500);
    window.addEventListener('storage', fetchLatest);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchLatest);
    };
  }, []);
 
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
 
  const handleConfirmDelete = () => {
    if (!deletingId) return;
    deleteReview(deletingId);
    const next = reviews.filter(r => r.id !== deletingId);
    setReviews(next);
    setToast({ type: 'success', message: 'Review deleted successfully.' });
    setDeletingId('');
  };

  const handleToggleFeatured = (review) => {
    const updated = { ...review, featured: !review.featured };
    updateReview(updated);
    const next = reviews.map(r => r.id === review.id ? updated : r);
    setReviews(next);
    setToast({
      type: 'success',
      message: updated.featured ? 'Review marked as featured.' : 'Review removed from featured.'
    });
  };

  const handleSubmitReply = (id, review) => {
    const text = replyText[id];
    if (!text || !text.trim()) return;

    const updated = {
      ...review,
      adminReply: text.trim(),
      repliedAt: new Date().toISOString()
    };
    updateReview(updated);
    const next = reviews.map(r => r.id === id ? updated : r);
    setReviews(next);
    setReplyingId('');
    setReplyText(prev => ({ ...prev, [id]: '' }));
    setToast({ type: 'success', message: 'Reply submitted successfully.' });
  };

  return (
    <AppShell title="Customer Reviews Manager" links={adminLinks}>
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        
        {/* Toast alerts */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border backdrop-blur-xl ${
            toast.type === 'success' ? 'bg-teal-600 text-white border-teal-500' : 'bg-rose-600 text-white border-rose-500'
          }`}>
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-semibold text-sm">{toast.message}</span>
          </div>
        )}

        <div className="bg-slate-100 border border-slate-200/80 p-6 rounded-lg space-y-6 max-h-[78vh] overflow-y-auto overflow-x-hidden">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Customer Feedback & Reviews</h2>
              <p className="text-xs text-slate-500 mt-1">Manage ratings, reply to customer inquiries, and highlight key reviews on the storefront.</p>
            </div>
            <span className="text-xs bg-white border px-3 py-1.5 rounded-full font-bold shadow-sm text-slate-600">
              {reviews.length} Total Reviews
            </span>
          </div>

          {!reviews.length ? (
            <div className="text-center py-16 bg-white border rounded-lg p-6">
              <p className="text-xs text-slate-400 italic">No reviews submitted by customers yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {reviews.map((rev) => (
                <article key={rev.id} className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{rev.customerName}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
                          Product: {rev.productName} · {formatDateTime(rev.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} size={13} fill="currentColor" />
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="text-xs text-slate-700 italic mt-3 font-semibold leading-relaxed">
                      "{rev.comment || rev.review}"
                    </p>

                    {/* Admin Reply display */}
                    {rev.adminReply && (
                      <div className="mt-3 bg-teal-50/50 border border-teal-100 p-3 rounded-lg text-xs text-teal-800">
                        <strong className="block text-[9px] uppercase tracking-wider text-teal-700 font-bold mb-1">Your Response</strong>
                        <p className="font-semibold">"{rev.adminReply}"</p>
                        {rev.repliedAt && (
                          <span className="text-[8px] text-teal-600/80 block mt-1">Replied on: {formatDateTime(rev.repliedAt)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline Reply Input Form */}
                  {replyingId === rev.id && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-lg border flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-600">Reply Message</label>
                      <input
                        type="text"
                        value={replyText[rev.id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                        placeholder="Write your answer..."
                        className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-semibold"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleSubmitReply(rev.id, rev)}
                          className="text-[10px] bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-3 rounded-lg transition"
                        >
                          Submit
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyingId('')}
                          className="text-[10px] bg-slate-100 border text-slate-600 font-bold py-1 px-3 rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                    <button
                      onClick={() => handleToggleFeatured(rev)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition ${
                        rev.featured
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {rev.featured ? 'Featured Highlighted' : 'Mark as Featured'}
                    </button>

                    <div className="flex gap-2">
                      {replyingId !== rev.id && (
                        <button
                          onClick={() => setReplyingId(rev.id)}
                          className="text-[10px] bg-slate-50 border text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-100 transition flex items-center gap-1"
                        >
                          <Reply size={12} /> Reply
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingId(rev.id)}
                        className="text-[10px] bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-100 transition flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-sm w-full p-6 shadow-2xl border flex flex-col space-y-4"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
                <button onClick={() => setDeletingId('')} className="p-1 rounded hover:bg-slate-100">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Are you sure you want to delete the review from "{reviews.find(r => r.id === deletingId)?.customerName}"?
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
    </AppShell>
  );
};

export default AdminReviewsPage;
