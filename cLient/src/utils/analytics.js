/**
 * MOSH Automation - Google Analytics 4 (GA4) & Google Tag Manager (GTM)
 * Integrated via environment variables (VITE_GA_MEASUREMENT_ID, VITE_GTM_ID)
 * Compliant with privacy standards (No PII, tokens, or payment credentials collected).
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const GTM_ID = import.meta.env.VITE_GTM_ID || '';

// Deduplication cache
const recentEvents = new Set();

const isEventDuplicate = (key, cooldownMs = 2000) => {
  if (recentEvents.has(key)) return true;
  recentEvents.add(key);
  setTimeout(() => recentEvents.delete(key), cooldownMs);
  return false;
};

/**
 * Initialize Google Analytics 4 / Google Tag Manager safely
 */
export const initAnalytics = () => {
  if (typeof window === 'undefined') return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  // 1. Google Tag Manager initialization if GTM_ID is provided
  if (GTM_ID && GTM_ID.startsWith('GTM-') && !document.getElementById('gtm-script')) {
    const gtmScript = document.createElement('script');
    gtmScript.id = 'gtm-script';
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(gtmScript);
  }

  // 2. Google Analytics 4 (gtag.js) initialization if GA_ID is provided
  if (GA_ID && GA_ID.startsWith('G-') && !document.getElementById('ga4-script')) {
    const gaScript = document.createElement('script');
    gaScript.id = 'ga4-script';
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(gaScript);

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      send_page_view: false, // We handle page views manually on SPA route transitions
      anonymize_ip: true,
      cookie_flags: 'SameSite=Lax;Secure'
    });
  }
};

/**
 * Generic helper to emit events to dataLayer and gtag
 */
const emitEvent = (eventName, params = {}) => {
  if (typeof window === 'undefined') return;

  // Ensure window.gtag exists
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('event', eventName, params);

  // Push to GTM dataLayer
  window.dataLayer.push({
    event: eventName,
    ...params
  });
};

/**
 * Track SPA Route Page View
 */
export const trackPageView = (path, title) => {
  const currentPath = path || window.location.pathname;
  const currentTitle = title || document.title;
  const dedupKey = `pv:${currentPath}`;

  if (isEventDuplicate(dedupKey, 1500)) return;

  emitEvent('page_view', {
    page_path: currentPath,
    page_title: currentTitle,
    page_location: window.location.href
  });
};

/**
 * Track Product Detail View (GA4 view_item)
 */
export const trackProductView = (product) => {
  if (!product) return;
  const dedupKey = `prod_view:${product.id}`;
  if (isEventDuplicate(dedupKey, 3000)) return;

  emitEvent('view_item', {
    currency: 'INR',
    value: Number(product.price) || 0,
    items: [
      {
        item_id: String(product.id),
        item_name: product.name,
        item_category: product.category || 'Water Level Controllers',
        price: Number(product.price) || 0,
        quantity: 1
      }
    ]
  });
};

/**
 * Track Product Search (GA4 search)
 */
export const trackProductSearch = (searchTerm, resultsCount = 0) => {
  if (!searchTerm || !searchTerm.trim()) return;
  const cleaned = searchTerm.trim().toLowerCase();
  const dedupKey = `search:${cleaned}`;
  if (isEventDuplicate(dedupKey, 4000)) return;

  emitEvent('search', {
    search_term: cleaned,
    results_count: resultsCount
  });
};

/**
 * Track Add To Cart (GA4 add_to_cart)
 */
export const trackAddToCart = (product, quantity = 1) => {
  if (!product) return;

  emitEvent('add_to_cart', {
    currency: 'INR',
    value: (Number(product.price) || 0) * quantity,
    items: [
      {
        item_id: String(product.id),
        item_name: product.name,
        price: Number(product.price) || 0,
        quantity
      }
    ]
  });
};

/**
 * Track Begin Checkout (GA4 begin_checkout)
 */
export const trackBeginCheckout = (items = [], totalValue = 0) => {
  if (!items || !items.length) return;

  emitEvent('begin_checkout', {
    currency: 'INR',
    value: Number(totalValue) || 0,
    items: items.map(item => ({
      item_id: String(item.id || item.productId),
      item_name: item.name || 'Water Controller Item',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1
    }))
  });
};

/**
 * Track Successful Purchase (GA4 purchase)
 * Only invoked after backend signature and payment verification succeeds!
 */
export const trackPurchase = ({
  transactionId,
  value,
  items = [],
  tax = 0,
  shipping = 0
}) => {
  if (!transactionId) return;
  const dedupKey = `purchase:${transactionId}`;
  if (isEventDuplicate(dedupKey, 60000)) return; // 1 min deduplication

  emitEvent('purchase', {
    transaction_id: String(transactionId),
    value: Number(value) || 0,
    currency: 'INR',
    tax: Number(tax) || 0,
    shipping: Number(shipping) || 0,
    items: items.map(item => ({
      item_id: String(item.id || item.productId),
      item_name: item.name || 'MOSH Controller Product',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1
    }))
  });
};

/**
 * Track Customer Query / Estimation Inquiry Lead (GA4 generate_lead)
 */
export const trackEnquirySubmit = ({ inquiryId, inquiryType = 'Estimation Inquiry' }) => {
  const dedupKey = `lead:${inquiryId || Date.now()}`;
  if (isEventDuplicate(dedupKey, 3000)) return;

  emitEvent('generate_lead', {
    lead_type: inquiryType,
    currency: 'INR',
    value: 3200 // Indicative nominal lead value
  });
};
