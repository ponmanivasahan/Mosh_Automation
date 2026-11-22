import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star } from 'lucide-react';

const ReviewModal = ({ open, onClose, onSave, initial }) => {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setRating(initial.rating || 5);
      setMessage(initial.comment || initial.message || '');
    } else {
      setRating(5);
      setMessage('');
    }
    setError('');
  }, [initial, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please write your review.');
      return;
    }
    const payload = {
      id: initial?.id || `rev-${Date.now()}`,
      name: initial?.name || undefined,
      rating: Number(rating),
      message: message.trim(),
      productName: initial?.productName || 'MOSH Automation System',
      date: new Date().toISOString().slice(0, 10)
    };
    onSave && onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl max-w-lg w-full mx-4 p-6 shadow-xl relative"
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{initial ? 'Update your review' : 'Write a review'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
          <div className="block text-sm font-semibold text-slate-700">
            <span className="mb-2 block text-xs font-bold text-slate-800">Rating</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={`${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-800">
            Review
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              rows={6} 
              className="w-full mt-2 border border-slate-200 p-3 rounded-xl text-xs font-normal text-slate-800 outline-none focus:border-blue-600 leading-relaxed resize-none" 
              placeholder="Write your feedback..." 
            />
          </label>

          {error && <div className="text-red-600 text-xs font-semibold">{error}</div>}

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-bold transition shadow-sm shadow-blue-500/20"
            >
              {initial ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReviewModal;
