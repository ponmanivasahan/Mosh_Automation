import React from "react";
const Badge = ({ children, variant = "default", className = "" }) => {
  const v = { default: "bg-neutral-100 text-neutral-700", success: "bg-green-100 text-green-700", warning: "bg-yellow-100 text-yellow-800", danger: "bg-red-100 text-red-700", info: "bg-blue-100 text-blue-700", primary: "bg-teal-50 text-teal-700 border border-teal-100" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${v[variant] || v.default} ${className}`}>{children}</span>;
};
export default Badge;
