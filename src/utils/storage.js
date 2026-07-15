import { defaultBillingSettings, defaultProducts, productImageOptions } from '../data/defaults';

const KEYS = {
  products: 'mosh_products',
  estimations: 'mosh_estimations',
  cart: 'mosh_cart',
  orders: 'mosh_orders',
  notifications: 'mosh_notifications',
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

  return {
    ...defaultProduct,
    ...product,
    image: product.image || defaultProduct?.image || fallbackImage
  };
};

export const ensureInitialData = () => {
  if (!localStorage.getItem(KEYS.products)) {
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

  if (!localStorage.getItem(KEYS.cart)) {
    write(KEYS.cart, []);
  }
};

export const getProducts = () => read(KEYS.products, defaultProducts).map(normalizeProduct);
export const setProducts = (products) => write(KEYS.products, products.map(normalizeProduct));

export const getBillingSettings = () => read(KEYS.billingSettings, defaultBillingSettings);
export const setBillingSettings = (settings) => write(KEYS.billingSettings, settings);

export const getEstimations = () => read(KEYS.estimations, []);
export const addEstimation = (estimation) => {
  const estimations = getEstimations();
  write(KEYS.estimations, [estimation, ...estimations]);
};

export const getOrders = () => read(KEYS.orders, []);
export const addOrder = (order) => {
  const orders = getOrders();
  write(KEYS.orders, [order, ...orders]);
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

export const getCart = () => read(KEYS.cart, []);
export const setCart = (cartItems) => write(KEYS.cart, cartItems);
export const clearCart = () => write(KEYS.cart, []);

export const getSession = () => read(KEYS.session, null);
export const setSession = (session) => write(KEYS.session, session);
export const clearSession = () => localStorage.removeItem(KEYS.session);
