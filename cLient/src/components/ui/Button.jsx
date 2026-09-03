import React from "react";

const Button = ({ children, variant = "primary", size = "md", className = "", isLoading = false, ...props }) => {
  const base = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-teal-700 text-white hover:bg-teal-800 shadow-sm focus:ring-teal-500",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm focus:ring-slate-400",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-red-500",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5", md: "px-4 py-2 text-sm rounded-xl gap-2", lg: "px-6 py-3 text-base rounded-xl gap-2" };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
      {children}
    </button>
  );
};
export default Button;
