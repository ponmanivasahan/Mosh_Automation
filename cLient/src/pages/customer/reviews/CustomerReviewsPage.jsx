import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Plus, Edit2, Calendar, Award, Trash2, X, AlertTriangle, Inbox } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { addReview, updateReview, deleteReview } from '../../../utils/storage';
import { API_URL } from '../../../utils/api';
import { useAuth } from '../../../utils/AuthContext';
import { customerLinks } from '../../../utils/customerLinks';
import ReviewModal from '../../../components/reviews/ReviewModal';

import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';

const CustomerReviewsPage = () => {
  const { session } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${API_URL}/api/reviews`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.reviews) {
            setReviews(data.reviews);
          }
        }
      } catch (err) {
        console.error('Failed to fetch reviews', err);
      }
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const renderStars = (rating) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}
        />
      ))}
    </div>
  );

  return (
    <AppShell title="Rate & Reviews" links={customerLinks}>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-neutral-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col justify-between">
            <div>
              <span className="text-teal-400 text-sm font-bold tracking-wider uppercase mb-2 block">Customer sentiment</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Trusted by teams across the region</h2>
              <p className="text-neutral-400 max-w-lg leading-relaxed mb-8">
                Read real experiences and share your feedback to help us continuously improve our automation solutions.
              </p>
            </div>
            <div>
              <Button onClick={openNewReview} className="w-auto">
                <Plus size={16} className="mr-2" /> Write a Review
              </Button>
            </div>
          </div>
          
          <Card className="p-8 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-5xl font-black text-neutral-900">{averageRating}</span>
              <div>
                {renderStars(Math.round(averageRating))}
                <span className="text-sm text-neutral-500 mt-1 block font-medium">{reviews.length} customer reviews</span>
              </div>
            </div>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingCounts[stars] || 0;
                const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-sm font-medium text-neutral-600">
                    <span className="w-8">{stars} ★</span>
                    <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-8 text-right text-neutral-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-neutral-900">Recent Feedback</h3>
            <Badge variant="primary">{reviews.length} Reviews</Badge>
          </div>

          {reviews.length === 0 ? (
            <EmptyState 
              icon={Inbox}
              title="No Reviews Yet"
              description="Be the first to share your experience with our products."
              action={<Button onClick={openNewReview}>Write a Review</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => {
                const isAuthor = session?.phone === (review.customerPhone || review.phone) || session?.name === (review.customerName || review.name);
                const dispName = review.customerName || review.name || 'Customer';
                const dispDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : review.date;
                return (
                  <Card key={review.id} className="p-6 flex flex-col h-full" hover>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg">
                          {dispName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-neutral-900 leading-tight">{dispName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-full">
                              {review.productName || 'General'}
                            </span>
                            <span className="text-xs text-neutral-400 flex items-center gap-1">
                              <Calendar size={10} /> {dispDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {renderStars(review.rating)}
                        {isAuthor && (
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => openEditReview(review)}
                              className="p-1.5 text-neutral-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(review.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-neutral-600 text-sm leading-relaxed flex-1">{review.comment || review.message}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <ReviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initial={editing}
          onSave={handleSave}
        />

        <AnimatePresence>
          {deleteTargetId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-center relative"
              >
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 transition"
                >
                  <X size={16} />
                </button>

                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle size={24} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-1">Delete Review?</h3>
                  <p className="text-sm text-neutral-500">
                    Are you sure you want to delete this review? This action cannot be undone.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setDeleteTargetId(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={confirmDelete} className="flex-1">
                    Delete
                  </Button>
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
