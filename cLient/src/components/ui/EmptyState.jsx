import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-200">
      {Icon && (
        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 mb-4">
          <Icon size={32} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 mb-6 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
