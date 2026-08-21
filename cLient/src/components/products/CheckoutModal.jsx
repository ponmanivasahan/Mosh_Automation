import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const CheckoutModal = ({ open, onClose, product, onPlace }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState({});

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    if (!email.trim()) e.email = 'Email is required';
    if (!address.trim()) e.address = 'Delivery address is required';
    if (!quantity || Number(quantity) < 1) e.quantity = 'Quantity must be at least 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const order = {
      customer: { name: name.trim(), phone: phone.trim(), email: email.trim(), address: address.trim() },
      productId: product?.id,
      name: product?.name,
      image: product?.image,
      unitPrice: Number(product?.price || 0),
      quantity: Number(quantity),
      total: Number(product?.price || 0) * Number(quantity)
    };
    onPlace && onPlace(order);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-2xl max-w-2xl w-full mx-4 p-6 shadow-xl overflow-auto max-h-[90vh]"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="border p-3 rounded-md w-full" />
              {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium">Phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="border p-3 rounded-md w-full" />
              {errors.phone && <div className="text-red-600 text-sm mt-1">{errors.phone}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="border p-3 rounded-md w-full" />
              {errors.email && <div className="text-red-600 text-sm mt-1">{errors.email}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium">Quantity</label>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="border p-3 rounded-md w-full" />
              {errors.quantity && <div className="text-red-600 text-sm mt-1">{errors.quantity}</div>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Delivery address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" className="border p-3 rounded-md w-full" rows={3} />
            {errors.address && <div className="text-red-600 text-sm mt-1">{errors.address}</div>}
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="text-lg font-semibold">Order summary</h4>
            <div className="mt-2 text-sm text-slate-700">
              <div><strong>Product:</strong> {product?.name || '—'}</div>
              <div><strong>Unit price:</strong> ₹{product?.price ?? '—'}</div>
              <div><strong>Quantity:</strong> {quantity}</div>
              <div className="mt-2 text-teal-700 font-bold">Total: ₹{(Number(product?.price || 0) * Number(quantity)).toFixed(2)}</div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button type="submit" className="rounded-lg bg-teal-600 text-white px-4 py-3">Place Order</button>
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-3">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CheckoutModal;
