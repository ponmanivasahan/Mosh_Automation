import React from 'react';

/**
 * Reusable, perfectly aligned Tabs component for professional SaaS UI
 * Supports pill (segmented capsule) and underline variants, count badges, and mobile swipe/scroll.
 */
const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  className = '',
  fullWidth = false
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-sm sm:text-base px-4 py-2 gap-2.5'
  };

  const badgeSizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.2',
    md: 'text-[11px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-0.5'
  };

  if (variant === 'underline') {
    return (
      <div className={`border-b border-slate-200 overflow-x-auto no-scrollbar ${className}`}>
        <nav className="flex space-x-6 sm:space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const id = typeof tab === 'string' ? tab : tab.id ?? tab.value;
            const label = typeof tab === 'string' ? tab : tab.label;
            const count = typeof tab === 'object' ? tab.count : undefined;
            const Icon = typeof tab === 'object' ? tab.icon : undefined;
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className={`group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'border-teal-600 text-teal-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {Icon && (
                  <Icon
                    className={`h-4 w-4 mr-2 transition-colors ${
                      isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-500'
                    }`}
                  />
                )}
                <span>{label}</span>
                {count !== undefined && (
                  <span
                    className={`ml-2 rounded-full font-bold transition-colors ${badgeSizeClasses[size]} ${
                      isActive
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // Default: Pill (Segmented capsule) variant
  return (
    <div
      className={`inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 max-w-full overflow-x-auto no-scrollbar scroll-smooth ${
        fullWidth ? 'w-full justify-between' : ''
      } ${className}`}
    >
      <div className={`flex items-center gap-1 min-w-max ${fullWidth ? 'w-full' : ''}`}>
        {tabs.map((tab) => {
          const id = typeof tab === 'string' ? tab : tab.id ?? tab.value;
          const label = typeof tab === 'string' ? tab : tab.label;
          const count = typeof tab === 'object' ? tab.count : undefined;
          const Icon = typeof tab === 'object' ? tab.icon : undefined;
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 whitespace-nowrap select-none ${
                sizeClasses[size]
              } ${fullWidth ? 'flex-1' : ''} ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60 font-semibold text-teal-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {Icon && (
                <Icon
                  className={`h-3.5 w-3.5 transition-colors ${
                    isActive ? 'text-teal-600' : 'text-slate-400'
                  }`}
                />
              )}
              <span>{label}</span>
              {count !== undefined && (
                <span
                  className={`rounded-full font-bold transition-colors ${badgeSizeClasses[size]} ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
