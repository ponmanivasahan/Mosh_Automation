import React from 'react';
import { Search } from 'lucide-react';
import CustomSelect from '../CustomSelect';

const ProductsToolbar = ({ filters, onChange, categories }) => {
  return (
    <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2 flex-1 min-w-[220px]">
        <Search className="h-5 w-5 text-slate-400" />
        <input
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search products"
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

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

      <button
        onClick={() => onChange({ q: '', category: '', sort: 'newest' })}
        className="ml-auto rounded-lg px-3 py-2 border border-slate-200 text-sm bg-slate-50"
      >
        Reset
      </button>
    </div>
  );
};

export default ProductsToolbar;
