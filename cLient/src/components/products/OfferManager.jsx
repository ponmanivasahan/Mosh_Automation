import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';
import CustomSelect from '../CustomSelect';

const offerTypes = [
  { value: 'Flat Discount', label: 'Flat Discount' },
  { value: 'Percentage Discount', label: 'Percentage Discount' },
  { value: 'Free Delivery', label: 'Free Delivery' },
  { value: 'Free Installation', label: 'Free Installation' },
  { value: 'Free Accessory', label: 'Free Accessory' },
  { value: 'Combo Offer', label: 'Combo Offer' },
  { value: 'Limited Time Offer', label: 'Limited Time Offer' },
  { value: 'Special Offer', label: 'Special Offer' }
];

const emptyOffer = {
  title: '',
  description: '',
  type: 'Flat Discount',
  value: '',
  validUntil: '',
  showOffer: true
};

const OfferManager = ({ offers, onChange }) => {
  const [newOffer, setNewOffer] = useState({ ...emptyOffer });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newOffer.title || !newOffer.type) return;
    onChange([...(offers || []), newOffer]);
    setNewOffer({ ...emptyOffer });
    setIsAdding(false);
  };

  const handleRemove = (index) => {
    const updated = [...(offers || [])];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleToggleShow = (index) => {
    const updated = [...(offers || [])];
    updated[index].showOffer = !updated[index].showOffer;
    onChange(updated);
  };

  const renderValueField = () => {
    if (newOffer.type === 'Flat Discount') {
      return (
        <div className="form-field-group">
          <label className="text-xs font-bold text-slate-700">Offer Value (₹)</label>
          <input
            type="number"
            value={newOffer.value}
            onChange={(e) => setNewOffer({ ...newOffer, value: e.target.value })}
            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
            placeholder="e.g. 500"
            min="0"
          />
        </div>
      );
    }
    if (newOffer.type === 'Percentage Discount') {
      return (
        <div className="form-field-group">
          <label className="text-xs font-bold text-slate-700">Offer Value (%)</label>
          <input
            type="number"
            value={newOffer.value}
            onChange={(e) => setNewOffer({ ...newOffer, value: e.target.value })}
            className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
            placeholder="e.g. 10"
            max="100"
            min="0"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Tag size={16} className="text-teal-600" /> OFFERS & BENEFITS
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">Add special offers and benefits that will be displayed to customers.</p>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold text-teal-600 flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <Plus size={14} /> Add Offer
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 space-y-4">
          <div className="form-field-group">
            <label className="text-xs font-bold text-slate-700">Offer Title *</label>
            <input
              type="text"
              value={newOffer.title}
              onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold"
              placeholder="e.g. Special Discount"
            />
          </div>
          <div className="form-field-group">
            <label className="text-xs font-bold text-slate-700">Offer Description</label>
            <textarea
              value={newOffer.description}
              onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none"
              placeholder="e.g. Get ₹500 off on this product."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field-group">
              <label className="text-xs font-bold text-slate-700">Offer Type *</label>
              <CustomSelect
                value={newOffer.type}
                onChange={(val) => setNewOffer({ ...newOffer, type: val, value: '' })}
                options={offerTypes}
              />
            </div>
            {renderValueField()}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field-group">
              <label className="text-xs font-bold text-slate-700">Valid Until (Optional)</label>
              <input
                type="date"
                value={newOffer.validUntil}
                onChange={(e) => setNewOffer({ ...newOffer, validUntil: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold text-slate-600"
              />
            </div>
            <div className="form-field-group flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={newOffer.showOffer}
                  onChange={(e) => setNewOffer({ ...newOffer, showOffer: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="text-xs font-bold text-slate-700">Show Offer</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs font-semibold text-slate-500 px-4 py-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newOffer.title || !newOffer.type || ((newOffer.type === 'Flat Discount' || newOffer.type === 'Percentage Discount') && !newOffer.value)}
              className="text-xs font-bold text-white bg-teal-600 px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              Save Offer
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(offers || []).map((offer, index) => {
          let isExpired = false;
          if (offer.validUntil) {
            const until = new Date(offer.validUntil);
            // set until to end of day
            until.setHours(23, 59, 59, 999);
            isExpired = until < new Date();
          }
          return (
            <div key={index} className={`p-4 rounded-xl border relative ${offer.showOffer ? 'bg-white border-teal-100 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">{offer.title}</h5>
                  {isExpired && (
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-red-50 text-red-600 rounded-full border border-red-100 uppercase tracking-wider">Expired</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {offer.description && <p className="text-xs text-slate-600 mb-3">{offer.description}</p>}
              
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
                <div>Type: <span className="text-slate-800">{offer.type}</span></div>
                {offer.value > 0 && <div>Value: <span className="text-slate-800">{offer.type === 'Percentage Discount' ? `${offer.value}%` : `₹${offer.value}`}</span></div>}
                {offer.validUntil && <div className="col-span-2">Valid Until: <span className="text-slate-800">{new Date(offer.validUntil).toLocaleDateString()}</span></div>}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleShow(index)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${offer.showOffer ? 'bg-teal-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${offer.showOffer ? 'left-6' : 'left-1'}`} />
                </button>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  {offer.showOffer ? 'Visible to customers' : 'Hidden'}
                </span>
              </div>
            </div>
          );
        })}
        {(!offers || offers.length === 0) && !isAdding && (
          <div className="text-center py-6 text-xs font-semibold text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No offers added yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferManager;
