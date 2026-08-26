const getApiUrl = () => {
  // 1. Get raw configured API URL from environment variables
  const envUrl = import.meta.env.VITE_API_URL;
  
  // 2. Check if we are running in the browser and what domain we are on
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  
  const isPageLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPageIp = /^(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)$/.test(hostname);
  const isPageRender = hostname.endsWith('.onrender.com');
  
  // A URL is local/private if it contains localhost, 127.0.0.1, or a private LAN IP pattern
  const isUrlLocal = (url) => {
    if (!url) return false;
    const cleanUrl = url.toLowerCase();
    return cleanUrl.includes('localhost') || 
           cleanUrl.includes('127.0.0.1') || 
           cleanUrl.includes('0.0.0.0') || 
           /https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)/.test(cleanUrl);
  };
  
  // 3. Resolve the API URL
  // If we are on a public deployment (like Vercel or Render) but the envUrl is local/private,
  // we MUST ignore the envUrl and force the public Render backend URL to prevent Private Network Access (PNA) blocks.
  if (isBrowser && !isPageLocal && !isPageIp) {
    if (isUrlLocal(envUrl)) {
      // Discard misconfigured local envUrl on production deployment
      return isPageRender ? window.location.origin : 'https://mosh-automation.onrender.com';
    }
  }
  
  // If envUrl is valid and not misconfigured, use it
  if (envUrl) {
    return envUrl;
  }
  
  // Fallbacks:
  if (isPageRender) {
    return window.location.origin;
  }
  if (isPageIp) {
    return `http://${hostname}:5001`;
  }
  if (isPageLocal) {
    return 'http://localhost:5001';
  }
  
  return 'https://mosh-automation.onrender.com';
};

export const API_URL = getApiUrl();

// Automatically attach Bearer token to all requests heading to our API
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async function () {
    let [resource, config] = arguments;
    
    // Only intercept requests to our API
    if (typeof resource === 'string' && resource.startsWith(API_URL)) {
      try {
        const rawSession = localStorage.getItem('mosh_session');
        if (rawSession) {
          const session = JSON.parse(rawSession);
          if (session && session.token) {
            config = config || {};
            
            // Handle merging if headers is a Headers object
            if (config.headers instanceof Headers) {
              config.headers.set('Authorization', `Bearer ${session.token}`);
            } else {
              config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${session.token}`
              };
            }
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    
    return originalFetch.call(this, resource, config);
  };
}