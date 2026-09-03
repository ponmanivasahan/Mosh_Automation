import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Star, ShieldAlert, Award, Layers, Gift, Clock, Check } from 'lucide-react';
import { getReviews, getProducts } from '../../utils/storage';
import { formatCurrency } from '../../utils/format';
import { API_URL } from '../../utils/api';

import Badge from '../ui/Badge';
import Button from '../ui/Button';

const ProductModal = ({ open, onClose, product, onAdd }) => {
  const [selectedImage, setSelectedImage] = useState(product?.image);
  const [liveOffers, setLiveOffers] = useState(product?.offers || []);
  const [isAdding, setIsAdding] = useState(false);

  // Sync selected image and offers if product switches
  useMemo(() => {
    if (product) {
      setSelectedImage(product.image);
      setLiveOffers(product.offers || []);
    }
  }, [product]);

  // Targeted refetch of offers when product modal opens
  useEffect(() => {
    if (product?.id && open) {
      fetch(`${API_URL}/api/products/${product.id}/offers`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.offers) {
            setLiveOffers(data.offers.map(o => ({
              id: o.id,
              title: o.title,
              description: o.description,
              type: o.offer_type,
              value: Number(o.offer_value),
              validUntil: o.valid_until,
              showOffer: Boolean(o.show_offer)
            })));
          }
        })
        .catch(err => console.error("Failed to sync live offers", err));
    }
  }, [product?.id, open]);

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

  const handleAdd = () => {
    setIsAdding(true);
    setTimeout(() => {
      onAdd && onAdd(product);
      setIsAdding(false);
      onClose();
    }, 400);
  };

  if (!open || !product) return null;

  // Active offers computation
  const activeOffers = liveOffers.filter(o => {
    if (!o.showOffer) return false;
    if (o.validUntil) {
      const until = new Date(o.validUntil);
      until.setHours(23, 59, 59, 999);
      if (until < new Date()) return false;
    }
    return true;
  });

  let promoPrice = null;
  for (const offer of activeOffers) {
    if (offer.type === 'Flat Discount' && offer.value > 0) {
      const candidate = product.price - offer.value;
      if (candidate > 0 && (!promoPrice || candidate < promoPrice)) {
        promoPrice = candidate;
      }
    } else if (offer.type === 'Percentage Discount' && offer.value > 0) {
      const candidate = product.price - (product.price * (offer.value / 100));
      if (candidate > 0 && (!promoPrice || candidate < promoPrice)) {
        promoPrice = candidate;
      }
    }
  }

  // Visual gallery thumbnails simulated
  const gallery = [product.image, product.image, product.image];

  return (
    <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Close Button - Absolute */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-50 p-2 bg-white/80 hover:bg-neutral-100 backdrop-blur-md rounded-full text-neutral-500 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Left Column: Image Gallery (Sticky on Desktop) */}
          <div className="md:w-5/12 lg:w-1/2 bg-neutral-50 p-6 md:p-8 flex flex-col md:h-[90vh] md:overflow-y-auto custom-scrollbar">
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 flex items-center justify-center aspect-square shadow-sm mb-4 relative group">
              <Badge variant="primary" className="absolute top-4 left-4 z-10 shadow-sm">
                {product.category || 'Automation'}
              </Badge>
              <img 
                src={selectedImage} 
                alt={product.name} 
                className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
              />
            </div>

            {/* Simulated Thumbnails */}
            <div className="flex gap-3 justify-center mb-8">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 p-2 bg-white rounded-xl flex items-center justify-center transition-all ${
                    selectedImage === img 
                      ? 'border-2 border-teal-500 shadow-md ring-2 ring-teal-100 ring-offset-1' 
                      : 'border border-neutral-200 hover:border-teal-300 hover:shadow-sm'
                  }`}
                >
                  <img src={img} alt="thumb" className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>

            {/* Meta Badges */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="bg-white p-4 rounded-2xl border border-neutral-100 flex flex-col items-center justify-center text-center shadow-sm">
                <ShieldAlert size={20} className="text-teal-600 mb-2" />
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Warranty</span>
                <span className="text-sm font-semibold text-neutral-800 mt-0.5">{product.warranty || '1 Year Warranty'}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-neutral-100 flex flex-col items-center justify-center text-center shadow-sm">
                <Award size={20} className="text-teal-600 mb-2" />
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Availability</span>
                <span className="text-sm font-semibold text-emerald-600 mt-0.5">{product.availability || 'In Stock'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Details & Sticky Buy Section */}
          <div className="md:w-7/12 lg:w-1/2 flex flex-col md:h-[90vh]">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8">
              
              {/* Header Info */}
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 mb-3">{product.name}</h2>
                <div className="flex items-center gap-4 text-sm">
                  {productReviews.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center text-amber-400">
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" />
                        <Star size={16} fill="currentColor" className="text-neutral-200" />
                      </div>
                      <span className="font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4">
                        {productReviews.length} Reviews
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Display */}
              <div className="flex flex-col">
                {promoPrice ? (
                  <div className="flex items-end gap-3">
                    <strong className="text-4xl font-black text-teal-700 tracking-tight">{formatCurrency(promoPrice)}</strong>
                    <span className="text-lg text-neutral-400 line-through decoration-red-400 decoration-2 font-semibold mb-1">
                      {formatCurrency(product.price)}
                    </span>
                    <Badge variant="danger" className="mb-2 uppercase font-bold text-[10px]">On Sale</Badge>
                  </div>
                ) : (
                  <strong className="text-4xl font-black text-neutral-900 tracking-tight">{formatCurrency(product.price)}</strong>
                )}
                <p className="text-xs text-neutral-500 mt-2 font-medium">Inclusive of all taxes.</p>
              </div>

              {/* Active Offers Section */}
              {activeOffers.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none transform rotate-12">
                    <Award size={100} />
                  </div>
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5 mb-3 relative z-10">
                    <Award size={14} /> Offers & Benefits
                  </h4>
                  <div className="space-y-3 relative z-10">
                    {activeOffers.map((offer, idx) => (
                      <div key={idx} className="flex flex-col gap-1 items-start bg-white/60 p-3 rounded-xl border border-amber-100/50 shadow-sm">
                        <span className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                          <Gift size={14} className="text-amber-600" /> {offer.title}
                        </span>
                        {offer.validUntil && (
                          <span className="text-[10px] text-red-600 font-bold bg-red-50/80 px-2 py-0.5 rounded-md flex items-center gap-1 mt-1">
                            <Clock size={10} /> Ends: {new Date(offer.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {offer.description && (
                          <p className="text-xs text-amber-800/80 font-medium mt-1.5 leading-snug">{offer.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">Product Overview</h3>
                <p className="text-sm text-neutral-600 leading-relaxed font-medium">{product.description}</p>
              </div>

              {/* Features & Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">Core Features</h4>
                  <ul className="text-sm text-neutral-600 space-y-2 font-medium">
                    {product.features ? (
                      product.features.split(',').map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check size={16} className="text-teal-500 shrink-0 mt-0.5" />
                          <span>{f.trim()}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-2"><Check size={16} className="text-teal-500 shrink-0 mt-0.5" /><span>High Reliability dry-run protect</span></li>
                        <li className="flex items-start gap-2"><Check size={16} className="text-teal-500 shrink-0 mt-0.5" /><span>Auto tank levels change monitoring</span></li>
                        <li className="flex items-start gap-2"><Check size={16} className="text-teal-500 shrink-0 mt-0.5" /><span>Safe modular design architecture</span></li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">Specifications</h4>
                  <div className="text-xs text-neutral-600 space-y-2 bg-neutral-50 p-4 rounded-xl border border-neutral-100 font-medium">
                    <div className="flex justify-between border-b border-neutral-200/60 pb-1.5">
                      <span className="text-neutral-500">Load Relay</span>
                      <span className="font-bold text-neutral-800">20A / 30A AC</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-200/60 pb-1.5">
                      <span className="text-neutral-500">Pumping</span>
                      <span className="font-bold text-neutral-800">Single & 3-Phase</span>
                    </div>
                    {product.specifications && (
                      <div className="pt-1 text-neutral-700">{product.specifications}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-1.5">
                    <Layers size={16} className="text-teal-600" />
                    Compare Related Items
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {relatedProducts.map(p => (
                      <div key={p.id} className="bg-white border border-neutral-100 p-3 rounded-xl flex flex-col items-center text-center gap-2 hover:shadow-md hover:border-teal-100 transition-all cursor-pointer group">
                        <div className="h-12 flex items-center justify-center p-1">
                          <img src={p.image} alt={p.name} className="max-h-full object-contain group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-700 truncate w-full">{p.name}</span>
                        <strong className="text-[11px] text-teal-700 font-extrabold bg-teal-50 px-2 py-0.5 rounded-full">{formatCurrency(p.price)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Spacer for sticky footer */}
              <div className="h-4"></div>
            </div>

            {/* Sticky Buy Section */}
            <div className="border-t border-neutral-200 bg-white p-4 sm:p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
              <div className="flex items-center gap-4">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="px-6"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="flex-1 text-base font-bold shadow-teal-600/20"
                  onClick={handleAdd}
                  isLoading={isAdding}
                >
                  <ShoppingCart size={18} className="mr-2" /> 
                  Add to Cart — {promoPrice ? formatCurrency(promoPrice) : formatCurrency(product.price)}
                </Button>
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );
};

export default ProductModal;
