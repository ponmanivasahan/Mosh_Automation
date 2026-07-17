import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const ProductModal = ({ open, onClose, product, onAdd }) => {
  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-4xl w-full mx-4 p-6 shadow-xl overflow-auto max-h-[90vh]"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
            <img src={product.image} alt={product.name} className="max-h-[360px] object-contain" />
          </div>

          <div>
            <div className="text-teal-700 font-extrabold text-2xl">{product.price ? `₹${product.price}` : '—'}</div>
            <p className="mt-3 text-slate-600">{product.description}</p>

            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <h4 className="text-lg font-semibold">Installation & Wire Charges</h4>
              <div className="mt-2 text-sm text-slate-700 space-y-2">
                <div><strong>Float installation fee:</strong> ₹{product.floatFee ?? 0}</div>
                <div>
                  <strong>Wire fee:</strong> ₹{product.wire?.baseFee ?? 0} for {product.wire?.baseMeters ?? 0} meters
                </div>
                <div className="text-sm text-slate-500">Extra wire laying: ₹{product.wire?.extraPerMeter ?? 0} per additional meter beyond {product.wire?.baseMeters ?? 0}m.</div>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={() => onAdd && onAdd(product)} className="rounded-lg bg-teal-600 text-white px-4 py-3">Add to cart</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductModal;
