import { defaultBillingSettings, defaultProducts, productImageOptions, defaultStories, defaultReviews } from '../data/defaults';
import { API_URL } from './api';

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

export const ensureInitialData = async () => {
  // Set offline/local defaults first
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

  // Attempt to sync from backend database
  try {
    const prodRes = await fetch(`${API_URL}/api/products`);
    const prodData = await prodRes.json();
    if (prodData.success && prodData.products?.length) {
      write(KEYS.products, prodData.products);
    }

    const billRes = await fetch(`${API_URL}/api/billing`);
    const billData = await billRes.json();
    if (billData.success && billData.settings) {
      write(KEYS.billingSettings, billData.settings);
    }

    const storyRes = await fetch(`${API_URL}/api/stories`);
    const storyData = await storyRes.json();
    if (storyData.success && storyData.stories) {
      write(KEYS.stories, storyData.stories);
    }

    const revRes = await fetch(`${API_URL}/api/reviews`);
    const revData = await revRes.json();
    if (revData.success && revData.reviews) {
      write(KEYS.reviews, revData.reviews);
    }

    const orderRes = await fetch(`${API_URL}/api/orders`, { credentials: 'include' });
    const orderData = await orderRes.json();
    if (orderData.success && orderData.orders) {
      write(KEYS.orders, orderData.orders);
    }

    const estRes = await fetch(`${API_URL}/api/estimations`, { credentials: 'include' });
    const estData = await estRes.json();
    if (estData.success && estData.estimations) {
      write(KEYS.estimations, estData.estimations);
    }

    const notifRes = await fetch(`${API_URL}/api/notifications`, { credentials: 'include' });
    const notifData = await notifRes.json();
    if (notifData.success && notifData.notifications) {
      write(KEYS.notifications, notifData.notifications);
    }
  } catch (e) {
    console.warn('Backend database unreachable. Running in offline fallback cache mode.', e);
  }
};

ensureInitialData();

export const getProducts = () => {
  const storedProducts = read(KEYS.products, null);
  const products = Array.isArray(storedProducts) && storedProducts.length ? storedProducts : defaultProducts;
  return products.map(normalizeProduct);
};

export const setProducts = async (products) => {
  const normalizedNew = products.map(normalizeProduct);
  const oldProducts = getProducts();
  
  write(KEYS.products, normalizedNew);

  try {
    // 1. Delete removed products
    for (const oldP of oldProducts) {
      if (!normalizedNew.some(newP => newP.id === oldP.id)) {
        await fetch(`${API_URL}/api/products/${oldP.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      }
    }

    // 2. Create or Update products
    for (const newP of normalizedNew) {
      const oldP = oldProducts.find(p => p.id === newP.id);
      if (!oldP) {
        await fetch(`${API_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newP),
          credentials: 'include'
        });
      } else if (JSON.stringify(newP) !== JSON.stringify(oldP)) {
        await fetch(`${API_URL}/api/products/${newP.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newP),
          credentials: 'include'
        });
      }
    }
  } catch (error) {
    console.error('Failed to sync products with backend database:', error);
  }
};

export const getBillingSettings = () => read(KEYS.billingSettings, defaultBillingSettings);

export const setBillingSettings = async (settings) => {
  write(KEYS.billingSettings, settings);
  try {
    await fetch(`${API_URL}/api/billing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to sync billing settings:', error);
  }
};

export const getEstimations = () => read(KEYS.estimations, []);

export const addEstimation = async (estimation) => {
  const estimations = getEstimations();
  write(KEYS.estimations, [estimation, ...estimations]);
  try {
    await fetch(`${API_URL}/api/estimations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(estimation),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to sync estimation inquiry:', error);
  }
};

export const updateEstimation = async (estimation) => {
  const estimations = getEstimations();
  const next = estimations.map((e) => (e.id === estimation.id ? { ...e, ...estimation } : e));
  write(KEYS.estimations, next);
  try {
    await fetch(`${API_URL}/api/estimations/${estimation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(estimation),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to sync estimation updates:', error);
  }
  return next;
};

export const getOrders = () => read(KEYS.orders, []);

export const addOrder = async (order) => {
  const orders = getOrders();
  write(KEYS.orders, [order, ...orders]);
  try {
    await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to sync new order:', error);
  }
};

export const updateOrder = async (order) => {
  const orders = getOrders();
  const next = orders.map((o) => (o.id === order.id ? { ...o, ...order } : o));
  write(KEYS.orders, next);
  try {
    await fetch(`${API_URL}/api/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: order.status }),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to sync order status:', error);
  }
  return next;
};

export const deleteOrder = async (id) => {
  const orders = getOrders();
  const next = orders.filter((o) => o.id !== id);
  write(KEYS.orders, next);
  try {
    await fetch(`${API_URL}/api/orders/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to sync order deletion:', error);
  }
  return next;
};

export const verifyPayment = async (orderId, transactionId, paymentMethod) => {
  try {
    const res = await fetch(`${API_URL}/api/orders/${orderId}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, paymentMethod }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      const orders = getOrders();
      const next = orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Paid',
              paymentStatus: 'Paid',
              paymentMethod,
              transactionId,
              paymentTime: data.order.paymentTime
            }
          : o
      );
      write(KEYS.orders, next);
      return { success: true, order: data.order };
    }
    return { success: false, message: data.message || 'Payment verification failed.' };
  } catch (error) {
    console.error('Failed to verify payment:', error);
    return { success: false, message: 'Server communication error during payment verification.' };
  }
};

export const getNotifications = () => read(KEYS.notifications, []);

export const addNotification = async (notification) => {
  const notifications = getNotifications();
  write(KEYS.notifications, [notification, ...notifications]);
  try {
    await fetch(`${API_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to sync notification creation:', error);
  }
};

export const markAllNotificationsRead = async () => {
  const notifications = getNotifications().map((item) => ({ ...item, read: true }));
  write(KEYS.notifications, notifications);
  try {
    const list = read(KEYS.notifications, []);
    for (const item of list) {
      await fetch(`${API_URL}/api/notifications/${item.id}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
    }
  } catch (error) {
    console.error('Failed to mark notifications read:', error);
  }
};

export const markNotificationRead = async (id) => {
  const notifications = getNotifications();
  const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  write(KEYS.notifications, next);
  try {
    await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to mark notification read:', error);
  }
  return next;
};

export const deleteNotification = async (id) => {
  const notifications = getNotifications();
  const next = notifications.filter((n) => n.id !== id);
  write(KEYS.notifications, next);
  try {
    await fetch(`${API_URL}/api/notifications/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
  return next;
};


export const getReviews = () => read(KEYS.reviews, []);

export const addReview = async (review) => {
  const reviews = getReviews();
  write(KEYS.reviews, [review, ...reviews]);
  try {
    await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to sync product review:', error);
  }
};

export const updateReview = async (review) => {
  const reviews = getReviews();
  const next = reviews.map((r) => (r.id === review.id ? { ...r, ...review } : r));
  write(KEYS.reviews, next);
  try {
    if (review.adminReply !== undefined) {
      await fetch(`${API_URL}/api/reviews/${review.id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: review.adminReply }),
        credentials: 'include'
      });
    }
    if (review.featured !== undefined) {
      await fetch(`${API_URL}/api/reviews/${review.id}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: review.featured }),
        credentials: 'include'
      });
    }
  } catch (error) {
    console.error('Failed to update review status:', error);
  }
  return next;
};

export const deleteReview = async (id) => {
  const reviews = getReviews();
  const next = reviews.filter((r) => r.id !== id);
  write(KEYS.reviews, next);
  try {
    await fetch(`${API_URL}/api/reviews/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to delete product review:', error);
  }
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
  const filtered = allCarts.filter((item) => item.customerPhone !== session.phone);
  const updatedItems = cartItems.map((item) => ({ ...item, customerPhone: session.phone }));
  const nextCarts = [...updatedItems, ...filtered];
  write(KEYS.cart, nextCarts);
  try {
    const event = new CustomEvent('mosh_cart_updated', { detail: updatedItems });
    window.dispatchEvent(event);
  } catch (e) {
    // ignore
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
    // ignore
  }
};

export const getSession = () => read(KEYS.session, null);
export const setSession = (session) => write(KEYS.session, session);
export const clearSession = () => localStorage.removeItem(KEYS.session);

export const updateUser = async (user) => {
  const rawUsers = localStorage.getItem('mosh_users');
  let usersList = rawUsers ? JSON.parse(rawUsers) : [];
  usersList = usersList.map((u) => (u.phone === user.phone ? { ...u, ...user } : u));
  localStorage.setItem('mosh_users', JSON.stringify(usersList));
  try {
    await fetch(`${API_URL}/api/auth/users/${user.phone}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to sync user updates:', error);
  }
  return usersList;
};

export const deleteUser = async (phone) => {
  const rawUsers = localStorage.getItem('mosh_users');
  let usersList = rawUsers ? JSON.parse(rawUsers) : [];
  usersList = usersList.filter((u) => u.phone !== phone);
  localStorage.setItem('mosh_users', JSON.stringify(usersList));
  try {
    await fetch(`${API_URL}/api/auth/users/${phone}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to sync user deletion:', error);
  }
  return usersList;
};

export const getStories = () => read(KEYS.stories, defaultStories);

export const addStory = async (story) => {
  const stories = getStories();
  write(KEYS.stories, [story, ...stories]);
  try {
    await fetch(`${API_URL}/api/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(story),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to create success story:', error);
  }
};

export const updateStory = async (story) => {
  const stories = getStories();
  const next = stories.map((s) => (s.id === story.id ? { ...s, ...story } : s));
  write(KEYS.stories, next);
  try {
    await fetch(`${API_URL}/api/stories/${story.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(story),
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to update success story:', error);
  }
  return next;
};

export const deleteStory = async (id) => {
  const stories = getStories();
  const next = stories.filter((s) => s.id !== id);
  write(KEYS.stories, next);
  try {
    await fetch(`${API_URL}/api/stories/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Failed to delete success story:', error);
  }
  return next;
};
