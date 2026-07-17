import React from 'react';
import { Eye, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCard = ({ product, onView, onOrder, onAdd }) => {
  return (
    <motion.article
      layout
      whileHover={{ y: -6 }}
      className="customer-product-card bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full"
    >
      <div className="w-full h-[240px] bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
        <motion.img
          src={product.image}
          alt={product.name}
          className="max-h-[220px] object-contain"
          whileHover={{ scale: 1.04 }}
        />
      </div>

      <div className="mt-4 flex-1 flex flex-col justify-between min-h-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {product.category && (
              <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-teal-50 text-teal-700">{product.category}</span>
            )}
            {product.availability && (
              <span className="inline-block text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">In Stock</span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">{product.name}</h3>
          <p className="mt-2 text-sm text-slate-500 line-clamp-3">{product.description}</p>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div />

          <div className="flex flex-col items-start">
            <div className="text-teal-700 font-extrabold text-lg"><p>Price: {product.price ? `₹${product.price}` : '—'}</p></div>
            {product.mrp && (
              <div className="text-sm text-slate-400 line-through">₹{product.mrp}</div>
            )}

            <div className="flex gap-3 w-52 sm:w-60 md:w-72">
              <button
                onClick={() => onView && onView(product)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:shadow-md transition"
              >
                <Eye className="h-4 w-4" /> View
              </button>
              <button
                onClick={() => onAdd && onAdd(product)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 text-white px-3 py-2 text-sm font-semibold hover:scale-[1.02] transition"
              >
                <ShoppingCart className="h-4 w-4" /> Add to cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
