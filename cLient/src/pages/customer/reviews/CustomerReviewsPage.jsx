import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  MessageSquare, 
  Edit3, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ThumbsUp, 
  CheckCircle2, 
  CheckCircle,
  Trash2, 
  Edit2, 
  X, 
  AlertTriangle,
  Award
} from 'lucide-react';
import AppShell from '../../../components/AppShell';
import { addReview, updateReview, deleteReview } from '../../../utils/storage';
import { API_URL } from '../../../utils/api';
import { useAuth } from '../../../utils/AuthContext';
import { customerLinks } from '../../../utils/customerLinks';
import ReviewModal from '../../../components/reviews/ReviewModal';
import './CustomerReviewsPage.css';

const getTimeAgo = (dateInput) => {
  if (!dateInput) return 'Recently';
  const now = new Date();
  const date = new Date(dateInput);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'MK';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const CustomerReviewsPage = () => {
  const { session } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Filter & Sort & Pagination state
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Local likes tracking
  const [likedReviews, setLikedReviews] = useState(() => {
    try {
      const stored = localStorage.getItem('mosh_liked_reviews');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Fetch live reviews from DB
  useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${API_URL}/api/reviews`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            setReviews(data.reviews || []);
          }
        } else if (isMounted) {
          setReviews([]);
        }
      } catch (err) {
        if (isMounted) setReviews([]);
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-dismiss toast feedback
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const totalCount = useMemo(() => {
    return reviews.length;
  }, [reviews]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    const total = reviews.reduce((sum, item) => sum + (Number(item.rating) || 5), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rating = Number(r.rating) || 5;
      if (counts[rating] !== undefined) counts[rating]++;
    });
    return counts;
  }, [reviews]);

  // Percentage distribution matching the UI breakdown
  const ratingPercentages = useMemo(() => {
    const percentages = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviews.length > 0) {
      [5, 4, 3, 2, 1].forEach((star) => {
        const exact = Math.round((ratingCounts[star] / reviews.length) * 100);
        percentages[star] = exact || 0;
      });
    }
    return percentages;
  }, [reviews, ratingCounts]);

  // Filtered & Sorted list
  const filteredAndSorted = useMemo(() => {
    let result = [...reviews];

    if (ratingFilter !== 'all') {
      const targetRating = Number(ratingFilter);
      result = result.filter((r) => Number(r.rating) === targetRating);
    }

    if (sortOrder === 'latest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortOrder === 'highest') {
      result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (sortOrder === 'lowest') {
      result.sort((a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));
    }

    return result;
  }, [reviews, ratingFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage));

  const pagedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage, itemsPerPage]);

  const handleLike = (reviewId, initialLikes = 0) => {
    setLikedReviews((prev) => {
      const isLiked = !prev[reviewId];
      const next = { ...prev, [reviewId]: isLiked };
      try {
        localStorage.setItem('mosh_liked_reviews', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

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
        setReviews(updatedList && updatedList.length > 0 ? updatedList : [payload, ...reviews]);
        setFeedback('Your review has been updated successfully.');
      } else {
        const toAdd = {
          ...payload,
          customerName: session?.name || payload.name || 'Verified Buyer',
          createdAt: new Date().toISOString(),
          likes: 0,
          commentsCount: 0
        };
        await addReview(toAdd);
        setReviews([toAdd, ...reviews]);
        setFeedback('Thank you! Your review has been submitted.');
      }
      setModalOpen(false);
    } catch (err) {
      setFeedback(err.message || 'Failed to submit review.');
    }
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      try {
        const updatedList = await deleteReview(deleteTargetId);
        setReviews(updatedList && updatedList.length > 0 ? updatedList : reviews.filter(r => r.id !== deleteTargetId));
        setFeedback('Your review has been deleted.');
        setDeleteTargetId(null);
      } catch (err) {
        alert(err.message || 'Failed to delete review.');
      }
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="cr-stars-group">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={17}
            className={star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
          />
        ))}
      </div>
    );
  };

  return (
    <AppShell title="Customer Reviews" links={customerLinks}>
      <div className="cr-container">

        {/* Feedback Alert Toast - Centered Top */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed top-6 left-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border bg-emerald-200 text-emerald-950 border-emerald-300 text-sm font-bold"
            >
              <CheckCircle size={18} />
              <span>{feedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Header Section */}
        <div className="cr-header-section">
          <div className="cr-eyebrow-row">
            <span className="cr-eyebrow-bar"></span>
            <span className="cr-eyebrow-text">CUSTOMER REVIEWS</span>
          </div>
          <h1 className="cr-main-heading">What Our Customers Say</h1>
          <p className="cr-subheading">
            Real feedback from our customers about MOSH Automation products and service.
          </p>
        </div>

        {/* 2. Top Rating Summary Banner Card */}
        <div className="cr-stats-card">
          {/* Left Column: Big Rating */}
          <div className="cr-stats-left">
            <div className="cr-big-score">{averageRating}</div>
            <div className="cr-score-stars">
              {renderStars(Number(averageRating))}
            </div>
            <div className="cr-reviews-count-label">{totalCount} {totalCount === 1 ? 'Review' : 'Reviews'}</div>
          </div>

          {/* Middle Column: Distribution Bar Chart */}
          <div className="cr-stats-middle">
            {[5, 4, 3, 2, 1].map((stars) => {
              const pct = ratingPercentages[stars] || 0;
              return (
                <div key={stars} className="cr-bar-row">
                  <span className="cr-bar-label">
                    {stars} <Star size={12} className="fill-slate-900 text-slate-900 inline align-baseline" />
                  </span>
                  <div className="cr-bar-track">
                    <div className="cr-bar-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="cr-bar-pct">{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Right Column: Total Reviews Badge */}
          <div className="cr-stats-right">
            <div className="cr-speech-bubble-icon">
              <MessageSquare size={38} className="text-slate-900" strokeWidth={1.75} />
              <Star size={13} className="cr-bubble-star fill-slate-900 text-slate-900" />
            </div>
            <div className="cr-total-label">Total Reviews</div>
            <div className="cr-total-big-num">{totalCount}</div>
          </div>
        </div>

        {/* 3. Subheader: Customer Feedbacks & Controls */}
        <div className="cr-feedbacks-header-row">
          <h2 className="cr-feedbacks-title">Customer Feedbacks</h2>

          <div className="cr-controls-group">
            {/* Filter by Rating */}
            <div className="cr-select-wrapper">
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="cr-select-pill"
                aria-label="Filter by rating"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
              <ChevronDown size={14} className="cr-select-arrow" />
            </div>

            {/* Sort Order */}
            <div className="cr-select-wrapper">
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                className="cr-select-pill"
                aria-label="Sort reviews"
              >
                <option value="latest">Latest Ratings</option>
                <option value="highest">Highest Ratings</option>
                <option value="lowest">Lowest Ratings</option>
              </select>
              <ChevronDown size={14} className="cr-select-arrow" />
            </div>

            {/* Write a Review Button with Page Theme Color */}
            <button
              onClick={openNewReview}
              className="cr-btn-write-review"
              type="button"
            >
              <Edit3 size={15} />
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* 4. Review Cards Grid (3 Columns) */}
        <div className="cr-reviews-grid">
          {pagedReviews.length === 0 ? (
            <div className="cr-empty-card">
              <MessageSquare size={42} className="cr-empty-icon" />
              <h3 className="cr-empty-title">No reviews yet</h3>
              <p className="cr-empty-subtitle">
                Be the first customer to share feedback about MOSH Automation products.
              </p>
              <button onClick={openNewReview} className="cr-btn-write-review mt-3" type="button">
                <Edit3 size={15} />
                <span>Write the First Review</span>
              </button>
            </div>
          ) : (
            pagedReviews.map((review) => {
            const dispName = review.customerName || review.name || 'Verified Buyer';
            const initials = getInitials(dispName);
            const isAuthor =
              session?.phone === (review.customerPhone || review.phone) ||
              session?.name === dispName;
            const timeAgoText = getTimeAgo(review.createdAt || review.date);
            const isLiked = Boolean(likedReviews[review.id]);
            const baseLikes = Number(review.likes) || 0;
            const currentLikes = baseLikes + (isLiked ? 1 : 0);
            const commentsNum = Number(review.commentsCount) || 0;

            return (
              <div key={review.id} className="cr-review-card">
                {/* Card Top: Author Profile */}
                <div className="cr-card-header">
                  <div className="cr-avatar-circle">
                    {initials}
                  </div>
                  <div className="cr-author-text">
                    <div className="cr-author-name">{dispName}</div>
                    <div className="cr-verified-badge">
                      <CheckCircle2 size={13} className="cr-badge-check" />
                      <span>Verified Buyer</span>
                    </div>
                  </div>

                  {/* Actions for Author / Admin */}
                  {isAuthor && (
                    <div className="cr-card-actions ml-auto">
                      <button
                        onClick={() => openEditReview(review)}
                        className="cr-action-icon-btn hover:text-blue-600"
                        title="Edit Review"
                        type="button"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(review.id)}
                        className="cr-action-icon-btn hover:text-red-600"
                        title="Delete Review"
                        type="button"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Rating Stars */}
                <div className="cr-card-stars">
                  {renderStars(review.rating || 5)}
                </div>

                {/* Card Message / Comment */}
                <p className="cr-card-comment">
                  {review.comment || review.message || 'Excellent automatic water level controller.'}
                </p>

                {/* Attached Photo Thumbnails (if present) */}
                {review.images && review.images.length > 0 && (
                  <div className="cr-card-thumbnails">
                    {review.images.map((imgSrc, idx) => (
                      <img
                        key={idx}
                        src={imgSrc}
                        alt="Customer verification photo"
                        className="cr-card-thumb-img"
                      />
                    ))}
                  </div>
                )}

                {/* Card Bottom Divider & Metadata */}
                <div className="cr-card-footer">
                  <span className="cr-time-ago">{timeAgoText}</span>

                  <div className="cr-card-interactions">
                    {/* Thumbs up / Like */}
                    <button
                      type="button"
                      onClick={() => handleLike(review.id, baseLikes)}
                      className={`cr-interact-btn ${isLiked ? 'liked' : ''}`}
                      title="Helpful review"
                    >
                      <ThumbsUp size={14} className={isLiked ? 'fill-blue-600 text-blue-600' : ''} />
                      <span>{currentLikes}</span>
                    </button>

                    {/* Comments Count */}
                    <div className="cr-interact-static" title="Comments">
                      <MessageSquare size={14} />
                      <span>{commentsNum}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>

        {/* 5. Pagination Bar */}
        {totalPages > 1 && (
          <div className="cr-pagination-bar">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="cr-page-nav-btn"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`cr-page-num-btn ${isActive ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="cr-page-nav-btn"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Write a Review Modal */}
        <ReviewModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initial={editing}
          onSave={handleSave}
        />

        {/* Custom Confirmation Modal for Deletion */}
        <AnimatePresence>
          {deleteTargetId && (
            <div className="fixed inset-0 !mt-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full mx-4 p-6 space-y-5 text-center relative"
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
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition -red-600/10"
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
