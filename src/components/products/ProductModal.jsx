import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingCart, Star, Heart, ShieldAlert, Award, Layers } from 'lucide-react';
import { getReviews, getProducts } from '../../utils/storage';
import { formatCurrency } from '../../utils/format';

const ProductModal = ({ open, onClose, product, onAdd }) => {
  const [selectedImage, setSelectedImage] = useState(product?.image);

  // Sync selected image if product switches
  useMemo(() => {
    if (product) {
      setSelectedImage(product.image);
    }
  }, [product]);

  // Load reviews and related products
  const productReviews = useMemo(() => {
    if (!product) return [];
    return getReviews().filter(r => r.productName === product.name);
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return getProducts()
      .filter(p => p.id !== product.id && p.category === product.category)
      .slice(0, 3);
  }, [product]);

  if (!open || !product) return null;

  // Visual gallery thumbnails simulated
  const gallery = [product.image, product.image, product.image];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-2xl max-w-4xl w-full mx-4 p-6 shadow-2xl overflow-y-auto max-h-[92vh] border border-slate-100 flex flex-col space-y-6"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">{product.category || 'Automation'}</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2">{product.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image gallery */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 border rounded-2xl p-4 flex items-center justify-center h-[280px]">
              <img src={selectedImage} alt={product.name} className="max-h-full max-w-full object-contain" />
            </div>

            {/* Simulated Thumbnails */}
            <div className="flex gap-2 justify-center">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-14 h-14 p-1 bg-white border rounded-xl flex items-center justify-center hover:border-teal-500 transition ${
                    selectedImage === img ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'
                  }`}
                >
                  <img src={img} alt="thumb" className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>

            {/* Meta badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 p-3 rounded-xl border flex flex-col items-center justify-center text-center">
                <ShieldAlert size={16} className="text-teal-600 mb-1" />
                <span className="text-[9px] text-slate-400 font-bold uppercase">Warranty</span>
                <span className="text-xs font-bold text-slate-700">{product.warranty || '1 Year Warranty'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border flex flex-col items-center justify-center text-center">
                <Award size={16} className="text-teal-600 mb-1" />
                <span className="text-[9px] text-slate-400 font-bold uppercase">Availability</span>
                <span className="text-xs font-bold text-emerald-600">{product.availability || 'In Stock'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Spec list & Actions */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Price section */}
            <div className="flex justify-between items-end bg-slate-50 border p-4 rounded-xl">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Standard Price</p>
                <strong className="text-2xl font-extrabold text-teal-600">{formatCurrency(product.price)}</strong>
              </div>
              <button
                onClick={() => {
                  onAdd && onAdd(product);
                  onClose();
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-teal-200 hover:shadow-teal-300 transition-all flex items-center gap-2"
              >
                <ShoppingCart size={14} /> Add to Cart
              </button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Product Overview</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">{product.description}</p>
            </div>

            {/* Specs & Features Tab block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Features list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Core Features</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-semibold">
                  {product.features ? (
                    product.features.split(',').map((f, i) => (
                      <li key={i}>{f.trim()}</li>
                    ))
                  ) : (
                    <>
                      <li>High Reliability dry-run protect</li>
                      <li>Auto tank levels change monitoring</li>
                      <li>Safe modular design architecture</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specifications</h4>
                <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border font-bold">
                  <div>Load Relay: 20A / 30A AC</div>
                  <div>Pumping: Single & 3-Phase</div>
                  {product.specifications && (
                    <div className="mt-2 text-slate-500 font-semibold">{product.specifications}</div>
                  )}
                </div>
              </div>

            </div>

            {/* Customer reviews section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Customer Reviews ({productReviews.length})</h4>
              {productReviews.length === 0 ? (
                <p className="text-xs text-slate-400 italic font-semibold">No ratings published for this product yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {productReviews.map(r => (
                    <div key={r.id} className="p-3 border rounded-xl bg-slate-50 space-y-1 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-800">{r.customerName}</span>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: r.rating || 5 }).map((_, idx) => (
                            <Star key={idx} size={10} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-500 font-semibold italic">"{r.comment || r.review}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related products */}
            {relatedProducts.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Layers size={12} className="text-teal-600" />
                  Related Products
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {relatedProducts.map(p => (
                    <div key={p.id} className="bg-slate-50 border p-2.5 rounded-xl flex flex-col items-center text-center gap-1.5 hover:shadow transition">
                      <img src={p.image} alt={p.name} className="h-10 object-contain" />
                      <span className="text-[10px] font-bold text-slate-800 truncate w-full">{p.name}</span>
                      <strong className="text-[10px] text-teal-600 font-bold">{formatCurrency(p.price)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default ProductModal;
