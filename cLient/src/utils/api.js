const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const isIp = typeof window !== 'undefined' && (/^(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)$/.test(window.location.hostname));
const isRender = typeof window !== 'undefined' && window.location.hostname.endsWith('.onrender.com');

export const API_URL = import.meta.env.VITE_API_URL || 
  (isRender ? window.location.origin : 
  (isIp ? `http://${window.location.hostname}:5001` : 
  (isLocal ? 'http://localhost:5001' : 'https://mosh-automation.onrender.com')));