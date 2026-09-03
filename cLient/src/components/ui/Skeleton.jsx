import React from 'react';

const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  const base = 'animate-pulse bg-neutral-200';
  const variants = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded',
  };

  return <div className={`${base} ${variants[variant]} ${className}`}></div>;
};

export default Skeleton;
