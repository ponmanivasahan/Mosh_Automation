import React from 'react';

const Card = ({ children, className = '', hover = false, ...props }) => {
  const baseStyle = 'bg-white rounded-2xl border border-neutral-100 shadow-card transition-all duration-300';
  const hoverStyle = hover ? 'hover:shadow-hover hover:-translate-y-0.5' : '';

  return (
    <div className={`${baseStyle} ${hoverStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
