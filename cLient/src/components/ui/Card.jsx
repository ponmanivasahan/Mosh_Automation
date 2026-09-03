import React from "react";
const Card = ({ children, className = "", hover = false, ...props }) => {
  const hoverStyle = hover ? "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5" : "";
  return <div className={`bg-white rounded-2xl border border-neutral-100 shadow-sm ${hoverStyle} ${className}`} {...props}>{children}</div>;
};
export default Card;
