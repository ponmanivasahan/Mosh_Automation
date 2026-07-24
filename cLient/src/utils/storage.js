import { defaultBillingSettings, defaultProducts, productImageOptions, defaultStories, defaultReviews } from '../data/defaults';

const KEYS = {
  products: 'mosh_products',
  estimations: 'mosh_estimations',
  cart: 'mosh_cart',
  orders: 'mosh_orders',
  notifications: 'mosh_notifications',
  reviews: 'mosh_reviews',
  stories: 'mosh_stories',
  billingSettings: 'mosh_billing_settings',
  session: 'mosh_session'
};

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const fallbackImage = productImageOptions[0]?.value || '';

const normalizeProduct = (product, index) => {
  const defaultProduct = defaultProducts[index] || defaultProducts.find((item) => item.id === product.id);

  let img = product.image;
  if (img && (img.includes('src/assets') || img.includes('src\\assets'))) {
    // Extract filename supporting both Windows and Unix slashes
    const parts = img.split(/[/\\]/);
    const filename = parts[parts.length - 1];
    img = '/' + filename;
  }
  if (!img) {
    img = defaultProduct?.image || fallbackImage;
  }

  return {
    ...defaultProduct,
    ...product,
    image: img
  };
};

export const ensureInitialData = () => {
  const existingProducts = read(KEYS.products, []);
  if (!Array.isArray(existingProducts) || !existingProducts.length) {
    write(KEYS.products, defaultProducts);
  }

  if (!localStorage.getItem(KEYS.billingSettings)) {
    write(KEYS.billingSettings, defaultBillingSettings);
  }

  if (!localStorage.getItem(KEYS.estimations)) {
    write(KEYS.estimations, []);
  }

  if (!localStorage.getItem(KEYS.orders)) {
    write(KEYS.orders, []);
  }

  if (!localStorage.getItem(KEYS.notifications)) {
    write(KEYS.notifications, []);
  }

  if (!localStorage.getItem(KEYS.reviews)) {
    write(KEYS.reviews, defaultReviews);
  }

  if (!localStorage.getItem(KEYS.stories)) {
    write(KEYS.stories, defaultStories);
  }

  if (!localStorage.getItem(KEYS.cart)) {
    write(KEYS.cart, []);
  }
};

ensureInitialData();

export const getProducts = () => {
  const storedProducts = read(KEYS.products, null);
  const products = Array.isArray(storedProducts) && storedProducts.length ? storedProducts : defaultProducts;
  return products.map(normalizeProduct);
};
export const setProducts = (products) => write(KEYS.products, products.map(normalizeProduct));

export const getBillingSettings = () => read(KEYS.billingSettings, defaultBillingSettings);
export const setBillingSettings = (settings) => write(KEYS.billingSettings, settings);

export const getEstimations = () => read(KEYS.estimations, []);
export const addEstimation = (estimation) => {
  const estimations = getEstimations();
  write(KEYS.estimations, [estimation, ...estimations]);
};
export const updateEstimation = (estimation) => {
  const estimations = getEstimations();
  const next = estimations.map((e) => (e.id === estimation.id ? { ...e, ...estimation } : e));
  write(KEYS.estimations, next);
  return next;
};

export const getOrders = () => read(KEYS.orders, []);
export const addOrder = (order) => {
  const orders = getOrders();
  write(KEYS.orders, [order, ...orders]);
};
export const updateOrder = (order) => {
  const orders = getOrders();
  const next = orders.map((o) => (o.id === order.id ? { ...o, ...order } : o));
  write(KEYS.orders, next);
  return next;
};

export const getNotifications = () => read(KEYS.notifications, []);
export const addNotification = (notification) => {
  const notifications = getNotifications();
  write(KEYS.notifications, [notification, ...notifications]);
};
export const markAllNotificationsRead = () => {
  const notifications = getNotifications().map((item) => ({ ...item, read: true }));
  write(KEYS.notifications, notifications);
};

export const getReviews = () => read(KEYS.reviews, []);
export const addReview = (review) => {
  const reviews = getReviews();
  write(KEYS.reviews, [review, ...reviews]);
};

export const updateReview = (review) => {
  const reviews = getReviews();
  const next = reviews.map((r) => (r.id === review.id ? { ...r, ...review } : r));
  write(KEYS.reviews, next);
  return next;
};

export const deleteReview = (id) => {
  const reviews = getReviews();
  const next = reviews.filter((r) => r.id !== id);
  write(KEYS.reviews, next);
  return next;
};

export const getCart = () => {
  const session = getSession();
  if (!session || !session.phone) return [];
  const allCarts = read(KEYS.cart, []);
  return allCarts.filter((item) => item.customerPhone === session.phone);
};
export const setCart = (cartItems) => {
  const session = getSession();
  if (!session || !session.phone) return;
  const allCarts = read(KEYS.cart, []);
  // Remove existing cart items of this customer, then add new ones
  const filtered = allCarts.filter((item) => item.customerPhone !== session.phone);
  const updatedItems = cartItems.map((item) => ({ ...item, customerPhone: session.phone }));
  const nextCarts = [...updatedItems, ...filtered];
  write(KEYS.cart, nextCarts);
  try {
    const event = new CustomEvent('mosh_cart_updated', { detail: updatedItems });
    window.dispatchEvent(event);
  } catch (e) {
    // ignore when not in browser
  }
};
export const clearCart = () => {
  const session = getSession();
  if (!session || !session.phone) return;
  const allCarts = read(KEYS.cart, []);
  const filtered = allCarts.filter((item) => item.customerPhone !== session.phone);
  write(KEYS.cart, filtered);
  try {
    const event = new CustomEvent('mosh_cart_updated', { detail: [] });
    window.dispatchEvent(event);
  } catch (e) {
    // ignore when not in browser
  }
};

export const getSession = () => read(KEYS.session, null);
export const setSession = (session) => write(KEYS.session, session);
export const clearSession = () => localStorage.removeItem(KEYS.session);

export const getStories = () => read(KEYS.stories, defaultStories);
export const addStory = (story) => {
  const stories = getStories();
  write(KEYS.stories, [story, ...stories]);
};
export const updateStory = (story) => {
  const stories = getStories();
  const next = stories.map((s) => (s.id === story.id ? { ...s, ...story } : s));
  write(KEYS.stories, next);
  return next;
};
export const deleteStory = (id) => {
  const stories = getStories();
  const next = stories.filter((s) => s.id !== id);
  write(KEYS.stories, next);
  return next;
};
