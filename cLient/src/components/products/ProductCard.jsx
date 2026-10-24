import React from 'react';
import { Eye, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCard = ({ product, onView, onAdd }) => {
  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className="customer-product-card bg-white rounded-2xl shadow-xs hover:shadow-md border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between h-full transition-all"
    >
      <div>
        <div className="w-full h-48 sm:h-52 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center p-3 overflow-hidden cursor-pointer" onClick={() => onView && onView(product)}>
          <motion.img
            src={product.image}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {product.category && (
              <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                {product.category}
              </span>
            )}
            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              product.availability === 'Out of Stock'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {product.availability || 'In Stock'}
            </span>
          </div>

          <h3
            onClick={() => onView && onView(product)}
            className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors"
          >
            {product.name}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-blue-600 font-extrabold text-base sm:text-lg">
            {product.price ? `₹${product.price.toLocaleString('en-IN')}` : '—'}
          </span>
          {product.mrp && (
            <span className="text-xs text-slate-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => onView && onView(product)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </button>
          <button
            type="button"
            onClick={() => onAdd && onAdd(product)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs font-bold shadow-xs transition"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
