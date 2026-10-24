import React from 'react';
import { Search } from 'lucide-react';
import CustomSelect from '../CustomSelect';

const ProductsToolbar = ({ filters, onChange, categories }) => {
  return (
    <div className="w-full bg-white rounded-2xl p-3 sm:p-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="flex items-center gap-2 flex-1 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-teal-500 transition-colors">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search controllers, models..."
          className="w-full bg-transparent outline-none text-xs sm:text-sm font-medium text-slate-800"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 sm:w-48 sm:min-w-[170px]">
          <CustomSelect
            value={filters.category}
            onChange={(val) => onChange({ ...filters, category: val })}
            placeholder="All Categories"
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(c => ({ value: c, label: c }))
            ]}
            searchable={categories.length > 5}
          />
        </div>

        {(filters.q || filters.category) && (
          <button
            type="button"
            onClick={() => onChange({ q: '', category: '', sort: 'newest' })}
            className="rounded-xl px-3.5 py-2 border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 transition shrink-0"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductsToolbar;
