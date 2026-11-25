import React from "react";
const Card = ({ children, className = "", hover = false, ...props }) => {
  const hoverStyle = hover ? "transition-all duration-300  hover:-translate-y-0.5" : "";
  return <div className={`bg-white rounded-2xl border border-neutral-100 ${hoverStyle} ${className}`} {...props}>{children}</div>;
};
export default Card;
