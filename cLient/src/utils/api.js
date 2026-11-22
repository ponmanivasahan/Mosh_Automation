const getApiUrl = () => {
  // 1. Get raw configured API URL from environment variables
  const envUrl = import.meta.env.VITE_API_URL;
  
  // 2. Check if we are running in the browser and what domain we are on
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  
  const isPageLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPageIp = /^(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)$/.test(hostname);
  const isPageRender = hostname.endsWith('.onrender.com');
  const isPageVercel = hostname.endsWith('.vercel.app') || hostname === 'moshautomation.com' || hostname === 'www.moshautomation.com';
  
  const isUrlLocal = (url) => {
    if (!url) return false;
    const cleanUrl = url.toLowerCase();
    return cleanUrl.includes('localhost') || 
           cleanUrl.includes('127.0.0.1') || 
           cleanUrl.includes('0.0.0.0') || 
           /https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)/.test(cleanUrl);
  };
  
  // 3. Resolve API URL
  // If explicitly configured, use it (sanitized for production)
  if (envUrl) {
    if (isBrowser && !isPageLocal && !isPageIp && isUrlLocal(envUrl)) {
      return isPageRender ? window.location.origin : 'https://mosh-automation.onrender.com';
    }
    return envUrl.replace(/\/+$/, '');
  }

  // When deployed on Vercel with rewrites, use same-origin relative URL
  if (isBrowser && isPageVercel) {
    return '';
  }

  // When developing locally with Vite dev proxy, use same-origin relative URL
  if (isBrowser && isPageLocal) {
    return '';
  }

  if (isPageRender) {
    return window.location.origin;
  }
  if (isPageIp) {
    return `http://${hostname}:5001`;
  }
  
  return 'https://mosh-automation.onrender.com';
};

export const API_URL = getApiUrl();

// Helper to extract CSRF token from document.cookie
export const getCsrfToken = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(^|;\s*)mosh_csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
};

// Shared promise for concurrent requests waiting on a token refresh
let refreshPromise = null;

// Execute silent refresh using HttpOnly refresh token cookie
export const executeRefresh = async () => {
  try {
    const refreshEndpoint = API_URL ? `${API_URL}/api/auth/refresh` : '/api/auth/refresh';
    const res = await originalFetch.call(window, refreshEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include'
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.success && data.user) {
      const rawSession = localStorage.getItem('mosh_session');
      if (rawSession) {
        try {
          const session = JSON.parse(rawSession);
          const updated = {
            ...session,
            id: data.user.id,
            name: data.user.name,
            phone: data.user.phone,
            role: data.user.role,
            email: data.user.email
          };
          delete updated.token; // Sensitive tokens are managed exclusively in HttpOnly cookies
          localStorage.setItem('mosh_session', JSON.stringify(updated));
        } catch {}
      }
      return data.user;
    }
    return null;
  } catch {
    return null;
  }
};

// Globally intercept fetch to attach credentials, CSRF token, and handle silent refresh
let originalFetch;
if (typeof window !== 'undefined') {
  originalFetch = window.fetch;
  window.fetch = async function (resource, config = {}) {
    // Intercept all requests targeting our API (absolute or relative)
    const isTargetApi = typeof resource === 'string' && (
      (API_URL && resource.startsWith(API_URL)) ||
      resource.startsWith('/api') ||
      resource.startsWith('http://localhost:5001/api') ||
      resource.startsWith('http://127.0.0.1:5001/api') ||
      resource.startsWith('https://mosh-automation.onrender.com/api')
    );

    if (isTargetApi) {
      config = config || {};
      config.credentials = 'include';

      // Attach CSRF protection headers for mutating requests
      const method = (config.method || 'GET').toUpperCase();
      const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

      const csrfToken = getCsrfToken();
      if (isMutating) {
        if (config.headers instanceof Headers) {
          if (csrfToken && !config.headers.has('X-CSRF-Token')) {
            config.headers.set('X-CSRF-Token', csrfToken);
          }
          if (!config.headers.has('X-Requested-With')) {
            config.headers.set('X-Requested-With', 'XMLHttpRequest');
          }
        } else {
          config.headers = {
            ...config.headers,
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
            'X-Requested-With': 'XMLHttpRequest'
          };
        }
      }

      // Execute request
      let response = await originalFetch.call(this, resource, config);

      // On 401 Unauthorized, perform silent token refresh and retry once
      const isAuthEndpoint = resource.includes('/api/auth/refresh') || 
                             resource.includes('/api/auth/login') ||
                             resource.includes('/api/auth/logout');

      if (response.status === 401 && !isAuthEndpoint) {
        if (!refreshPromise) {
          refreshPromise = executeRefresh().finally(() => {
            refreshPromise = null;
          });
        }

        const refreshedUser = await refreshPromise;
        if (refreshedUser) {
          const updatedCsrfToken = getCsrfToken();
          if (isMutating && updatedCsrfToken) {
            if (config.headers instanceof Headers) {
              config.headers.set('X-CSRF-Token', updatedCsrfToken);
            } else {
              config.headers = {
                ...config.headers,
                'X-CSRF-Token': updatedCsrfToken
              };
            }
          }
          return originalFetch.call(this, resource, config);
        }
      }

      return response;
    }

    return originalFetch.call(this, resource, config);
  };
}
