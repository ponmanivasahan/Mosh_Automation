import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { getProducts } from '../../utils/storage';

const ReviewModal = ({ open, onClose, onSave, initial }) => {
  const [products] = useState(() => getProducts());
  const [productName, setProductName] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setRating(initial.rating || 5);
      setMessage(initial.comment || initial.message || '');
      setProductName(initial.productName || (products.length > 0 ? products[0].name : 'Mosh Water Controller'));
    } else {
      setRating(5);
      setMessage('');
      setProductName(products.length > 0 ? products[0].name : 'Mosh Water Controller');
    }
    setError('');
  }, [initial, open, products]);

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
      productName: productName,
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
          <div className="block text-sm font-semibold text-slate-700">
            <CustomSelect
              label="Select Product"
              value={productName}
              onChange={setProductName}
              options={products.map(p => ({ value: p.name, label: p.name }))}
            />
          </div>

          <div className="block text-sm font-semibold text-slate-700">
            <span className="mb-2 block">Rating</span>
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

          <label className="block text-sm font-semibold text-slate-700">
            Review
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full mt-2 border p-2 rounded text-sm" placeholder="Write your feedback..." />
          </label>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" className="rounded-lg bg-teal-600 text-white px-4 py-2 text-sm font-semibold">{initial ? 'Update Review' : 'Submit Review'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReviewModal;
