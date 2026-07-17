import React from 'react';
import { Search } from 'lucide-react';

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

      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={filters.sort}
        onChange={(e) => onChange({ ...filters, sort: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>

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
