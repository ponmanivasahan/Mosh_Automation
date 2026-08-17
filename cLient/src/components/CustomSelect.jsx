import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check } from 'lucide-react';

const CustomSelect = ({
  label,
  placeholder = 'Select an option...',
  value,
  options = [],
  onChange,
  disabled = false,
  searchable = false,
  error = false,
  required = false,
  helperText,
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine if dropdown should open upwards
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If less than 250px below and more space above, open upwards
      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return normalizedOptions;
    const query = searchQuery.toLowerCase();
    return normalizedOptions.filter(
      opt => opt.label.toLowerCase().includes(query) || 
             (opt.description && opt.description.toLowerCase().includes(query))
    );
  }, [normalizedOptions, searchable, searchQuery]);

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="form-field-group relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 min-h-[48px] rounded-xl border transition-all duration-200 outline-none
            ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : 
              error ? 'bg-rose-50/50 border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 
              isOpen ? 'bg-white border-teal-500 ring-2 ring-teal-500/20' : 
              'bg-white border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 hover:bg-slate-50/50'
            }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {Icon && <Icon className={`h-4 w-4 shrink-0 ${disabled ? 'text-slate-300' : 'text-slate-400'}`} />}
            
            {selectedOption ? (
              <div className="flex items-center gap-2 truncate">
                {selectedOption.image && (
                  <img src={selectedOption.image} alt="" className="w-6 h-6 object-contain rounded bg-white p-0.5 border border-slate-100 shrink-0" />
                )}
                <span className={`text-sm font-semibold truncate ${disabled ? 'text-slate-500' : 'text-slate-800'}`}>
                  {selectedOption.label}
                </span>
              </div>
            ) : (
              <span className={`text-sm truncate ${disabled ? 'text-slate-400' : 'text-slate-400'}`}>
                {placeholder}
              </span>
            )}
          </div>
          
          <ChevronDown 
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              disabled ? 'text-slate-300' : 'text-slate-400'
            } ${isOpen ? 'rotate-180 text-teal-600' : ''}`} 
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: openUpwards ? 4 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: openUpwards ? 4 : -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden ${
                openUpwards ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
              }`}
            >
              {searchable && (
                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors mb-0.5 last:mb-0
                          ${isSelected 
                            ? 'bg-teal-50 text-teal-900' 
                            : 'hover:bg-slate-50 text-slate-700'
                          }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {opt.image && (
                            <img src={opt.image} alt="" className="w-8 h-8 object-contain rounded bg-white p-1 border border-slate-100 shrink-0" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className={`text-sm truncate ${isSelected ? 'font-bold text-teal-800' : 'font-semibold'}`}>
                              {opt.label}
                            </span>
                            {opt.description && (
                              <span className={`text-[10px] truncate ${isSelected ? 'text-teal-600/80' : 'text-slate-500'}`}>
                                {opt.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 shrink-0 text-teal-600 ml-2" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs font-semibold text-slate-500">No options found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {helperText && (
        <p className={`mt-1.5 text-[10px] font-semibold ${error ? 'text-rose-500' : 'text-slate-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default CustomSelect;
