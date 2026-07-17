import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const ReviewModal = ({ open, onClose, onSave, initial }) => {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setRating(initial.rating || 5);
      setMessage(initial.message || '');
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
      name: initial?.name || (initial?.name === null ? 'Customer' : undefined),
      rating: Number(rating),
      message: message.trim(),
      date: new Date().toISOString().slice(0, 10)
    };
    onSave && onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl max-w-lg w-full mx-4 p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{initial ? 'Update your review' : 'Write a review'}</h3>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <label className="block">
            Rating
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full mt-2 border p-2 rounded">
              {[5, 4, 3, 2, 1].map((v) => (
                <option key={v} value={v}>{v} stars</option>
              ))}
            </select>
          </label>

          <label className="block">
            Review
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full mt-2 border p-2 rounded" />
          </label>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button>
            <button type="submit" className="rounded-lg bg-teal-600 text-white px-4 py-2">{initial ? 'Update Review' : 'Submit Review'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReviewModal;
