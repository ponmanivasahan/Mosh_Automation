import React from "react";
const Skeleton = ({ className = "", variant = "rectangular" }) => {
  const v = { rectangular: "rounded-xl", circular: "rounded-full", text: "rounded" };
  return <div className={`animate-pulse bg-neutral-200 ${v[variant] || v.rectangular} ${className}`}></div>;
};
export default Skeleton;
