import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Plus, Edit2, Calendar, Award, Trash2, X, AlertTriangle } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { addReview, getReviews, updateReview, deleteReview } from '../../../utils/storage';
import { useAuth } from '../../../utils/AuthContext';
import { customerLinks } from '../../../utils/customerLinks';
import ReviewModal from '../../../components/reviews/ReviewModal';
import './CustomerReviewsPage.css';

const CustomerReviewsPage = () => {
  const { session } = useAuth();
  const storedReviews = getReviews();
  const [reviews, setReviews] = useState(storedReviews);
  const [feedback, setFeedback] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Custom Modal Delete Confirmation state
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Auto dismiss toast feedback
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const averageRating = useMemo(() => {
    const allRatings = reviews.map((item) => item.rating);
    const total = allRatings.reduce((sum, value) => sum + value, 0);
    return reviews.length ? (total / reviews.length).toFixed(1) : '0.0';
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (counts[r.rating] !== undefined) counts[r.rating]++;
    });
    return counts;
  }, [reviews]);

  const openNewReview = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEditReview = (review) => {
    setEditing(review);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    try {
      if (editing) {
        const updatedList = await updateReview(payload);
        setReviews(updatedList);
        setFeedback('Your review has been updated successfully.');
      } else {
        const toAdd = { ...payload, name: session?.name || 'Customer' };
        await addReview(toAdd);
        setReviews([toAdd, ...reviews]);
        setFeedback('Thank you! Your review has been added.');
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to submit review.');
    }
  };
 
  const confirmDelete = async () => {
    if (deleteTargetId) {
      try {
        const updatedList = await deleteReview(deleteTargetId);
        setReviews(updatedList);
        setFeedback('Your review has been deleted.');
        setDeleteTargetId(null);
      } catch (err) {
        alert(err.message || 'Failed to delete review.');
      }
    }
  };

  // Render stars helper
  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
          />
        ))}
      </div>
    );
  };

  return (
    <AppShell title="Rate & Reviews" links={customerLinks}>
      <div className="reviews-page-container">
        
        {/* Toast Alert Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-xl bg-teal-600 text-white border-teal-500"
            >
              <Award size={20} />
              <span className="font-semibold text-sm">{feedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Hero */}
        <div className="reviews-page-hero">
          <div className="hero-content">
            <span className="eyebrow-accent">Customer sentiment</span>
            <h2>Trusted by teams across the region</h2>
            <p>Read real experiences and share your feedback to help us continuously improve our automation solutions.</p>
          </div>
          
          {/* Summary Card with Rating Breakdown */}
          <div className="review-stats-card">
            <div className="stats-header">
              <span className="avg-num">{averageRating}</span>
              <div>
                {renderStars(Math.round(averageRating))}
                <span className="total-span">{reviews.length} customer reviews</span>
              </div>
            </div>
            <div className="breakdown-list">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingCounts[stars] || 0;
                const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={stars} className="breakdown-row">
                    <span className="star-label">{stars} ★</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="count-label">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reviews Layout Grid */}
        <div className="reviews-layout-grid">
          
          {/* Reviews List */}
          <div className="reviews-list-section">
            <h3 className="section-title">Recent Feedback ({reviews.length})</h3>
            <div className="reviews-scroll-list">
              {reviews.map((review) => {
                const isAuthor = session?.name === review.name;
                return (
                  <article key={review.id} className="premium-review-card">
                    <div className="review-card-top">
                      <div className="author-info">
                        <div className="avatar-placeholder">
                          {review.name?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <h4>{review.name}</h4>
                          <span className="review-date">
                            <Calendar size={11} /> {review.date}
                          </span>
                        </div>
                      </div>
                      <div className="rating-edit-row">
                        {renderStars(review.rating)}
                        {isAuthor && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditReview(review)}
                              className="btn-edit-review"
                              title="Edit Review"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(review.id)}
                              className="btn-edit-review hover:bg-red-500 hover:text-white"
                              style={{ transition: 'all 0.2s ease' }}
                              title="Delete Review"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="review-message-text">{review.message}</p>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Inline CTA card to leave review */}
          <aside className="review-cta-card">
            <div className="cta-icon-wrap">
              <MessageSquare size={24} />
            </div>
            <h3>Share your experience</h3>
            <p>
              Your feedback helps shape the future of Mosh Automation products. Write a review to share your thoughts.
            </p>
            <button onClick={openNewReview} className="btn-write-review">
              <Plus size={16} /> Write a Review
            </button>
          </aside>

        </div>

        <ReviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initial={editing}
          onSave={handleSave}
        />

        {/* Custom Confirmation Modal (No window.confirm popup) */}
        <AnimatePresence>
          {deleteTargetId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full mx-4 p-6 shadow-2xl space-y-5 text-center relative"
              >
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>

                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Delete Review?</h3>
                  <p className="text-xs text-slate-500 leading-relaxed px-4">
                    Are you sure you want to delete this review? This action cannot be undone.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setDeleteTargetId(null)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-red-600/10"
                  >
                    Delete
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

export default CustomerReviewsPage;
