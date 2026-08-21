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
  session: 'mosh_session',
  invoices: 'mosh_invoices'
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

const normalizeProduct = (product) => {
  let img = product.image;
  if (img && (img.includes('src/assets') || img.includes('src\\assets'))) {
    // Extract filename supporting both Windows and Unix slashes
    const parts = img.split(/[/\\]/);
    const filename = parts[parts.length - 1];
    img = '/' + filename;
  }
  if (!img) {
    img = fallbackImage;
  }

  // Ensure wire layout matches what client UI expects
  const wire = product.wire || {
    baseFee: Number(product.wire_base_fee || 0),
    baseMeters: Number(product.wire_base_meters || 0),
    extraPerMeter: Number(product.wire_extra_per_meter || 0)
  };

  // Derive category from product name if not present
  const name = product.name || '';
  const nameLower = name.toLowerCase();
  let category = product.category || '';
  if (!category) {
    if (nameLower.includes('gsm'))             category = 'GSM Controllers';
    else if (nameLower.includes('wireless'))   category = 'Wireless';
    else if (nameLower.includes('three phase'))category = 'Three Phase';
    else if (nameLower.includes('single phase'))category = 'Single Phase';
    else if (nameLower.includes('float'))      category = 'Float Switch';
    else if (nameLower.includes('sensor'))     category = 'Sensors';
    else                                       category = 'Water Level';
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    image: img,
    category,
    floatFee: Number(product.float_fee || product.floatFee || 0),
    wire: {
      baseFee: Number(wire.baseFee || 0),
      baseMeters: Number(wire.baseMeters || 0),
      extraPerMeter: Number(wire.extraPerMeter || 0)
    },
    offers: product.offers || []
  };
};

export const getDbStatus = () => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('mosh_db_connected') !== 'false';
};

let initialDataPromise = null;

export const ensureInitialData = async () => {
  if (initialDataPromise) return initialDataPromise;

  initialDataPromise = (async () => {
    try {
      const prodRes = await fetch(`${API_URL}/api/products?t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } 
      });
      if (!prodRes.ok) throw new Error('Products request failed');
      const prodData = await prodRes.json();
      if (prodData.success) {
        write(KEYS.products, prodData.products || []);
      }
      const billRes = await fetch(`${API_URL}/api/billing`);
      if (!billRes.ok) throw new Error('Billing request failed');
    const billData = await billRes.json();
    if (billData.success && billData.settings) {
      write(KEYS.billingSettings, billData.settings);
    }

    const storyRes = await fetch(`${API_URL}/api/stories`);
    if (!storyRes.ok) throw new Error('Stories request failed');
    const storyData = await storyRes.json();
    if (storyData.success && storyData.stories) {
      write(KEYS.stories, storyData.stories);
    }

    const revRes = await fetch(`${API_URL}/api/reviews`);
    if (!revRes.ok) throw new Error('Reviews request failed');
    const revData = await revRes.json();
    if (revData.success && revData.reviews) {
      write(KEYS.reviews, revData.reviews);
    }

    const invRes = await fetch(`${API_URL}/api/invoices`, { credentials: 'include' });
    if (invRes.ok) {
      const invData = await invRes.json();
      if (invData.success && invData.invoices) {
        write(KEYS.invoices, invData.invoices);
      }
    }

    const orderRes = await fetch(`${API_URL}/api/orders`, { credentials: 'include' });
    if (orderRes.ok) {
      const orderData = await orderRes.json();
      if (orderData.success && orderData.orders) {
        write(KEYS.orders, orderData.orders);
      }
    } else if (orderRes.status !== 401 && orderRes.status !== 403) {
      throw new Error('Orders request failed');
    }

    const estRes = await fetch(`${API_URL}/api/estimations`, { credentials: 'include' });
    if (estRes.ok) {
      const estData = await estRes.json();
      if (estData.success && estData.estimations) {
        write(KEYS.estimations, estData.estimations);
      }
    } else if (estRes.status !== 401 && estRes.status !== 403) {
      throw new Error('Estimations request failed');
    }

    const session = getSession();
    const isAdmin = session && session.role === 'admin';
    if (isAdmin) {
      const notifRes = await fetch(`${API_URL}/api/notifications`, { credentials: 'include' });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.success && notifData.notifications) {
          write(KEYS.notifications, notifData.notifications);
        }
      } else if (notifRes.status !== 401 && notifRes.status !== 403) {
        throw new Error('Notifications request failed');
      }
    }

    localStorage.setItem('mosh_db_connected', 'true');
  } catch (e) {
    console.warn('Backend database unreachable. Running in offline fallback cache mode.', e);
    localStorage.setItem('mosh_db_connected', 'false');
  }
  })();
  return initialDataPromise;
};

ensureInitialData();

// Individual sync helpers — re-fetch a single resource from the backend
const syncOrders = async () => {
  try {
    const res = await fetch(`${API_URL}/api/orders`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.orders) write(KEYS.orders, data.orders);
    }
  } catch (e) {
    console.warn('syncOrders failed:', e);
  }
};

const syncReviews = async () => {
  try {
    const res = await fetch(`${API_URL}/api/reviews`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.reviews) write(KEYS.reviews, data.reviews);
    }
  } catch (e) {
    console.warn('syncReviews failed:', e);
  }
};

const syncStories = async () => {
  try {
    const res = await fetch(`${API_URL}/api/stories`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.stories) write(KEYS.stories, data.stories);
    }
  } catch (e) {
    console.warn('syncStories failed:', e);
  }
};

export const getProducts = () => {
  const storedProducts = read(KEYS.products, null);
  const products = Array.isArray(storedProducts) ? storedProducts : [];
  return products.map(normalizeProduct);
};

export const addProduct = async (product) => {
  const response = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
    credentials: 'include'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to add product to database.');
  }
  
  if (data.product) {
    const products = read(KEYS.products, []);
    products.unshift(data.product);
    write(KEYS.products, products);
  } else {
    await ensureInitialData();
  }
};

export const updateProduct = async (id, product) => {
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
    credentials: 'include'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update product in database.');
  }

  if (data.product) {
    const products = read(KEYS.products, []);
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...data.product, offers: product.offers || [] };
      write(KEYS.products, products);
    } else {
      await ensureInitialData();
    }
  } else {
    await ensureInitialData();
  }
};

export const deleteProduct = async (id) => {
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete product from database.');
  }
  
  const products = read(KEYS.products, []);
  const updated = products.filter(p => p.id !== id);
  write(KEYS.products, updated);
};

export const getBillingSettings = () => read(KEYS.billingSettings, {});

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
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to place order. Please try again.');
  }
  await syncOrders();
};

export const updateOrder = async (order) => {
  const res = await fetch(`${API_URL}/api/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: order.status }),
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to update order. Please try again.');
  }
  await syncOrders();
  return getOrders();
};

export const deleteOrder = async (id) => {
  const res = await fetch(`${API_URL}/api/orders/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to delete order. Please try again.');
  }
  await syncOrders();
  return getOrders();
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
  const res = await fetch(`${API_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to submit review. Please try again.');
  }
  await syncReviews();
};

export const updateReview = async (review) => {
  let res;
  if (review.adminReply !== undefined) {
    res = await fetch(`${API_URL}/api/reviews/${review.id}/reply`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminReply: review.adminReply }),
      credentials: 'include'
    });
  } else if (review.featured !== undefined) {
    res = await fetch(`${API_URL}/api/reviews/${review.id}/featured`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: review.featured }),
      credentials: 'include'
    });
  } else {
    res = await fetch(`${API_URL}/api/reviews/${review.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
      credentials: 'include'
    });
  }
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to update review. Please try again.');
  }
  await syncReviews();
  return getReviews();
};

export const deleteReview = async (id) => {
  const res = await fetch(`${API_URL}/api/reviews/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to delete review. Please try again.');
  }
  await syncReviews();
  return getReviews();
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

export const getStories = () => read(KEYS.stories, []);

export const addStory = async (story) => {
  const res = await fetch(`${API_URL}/api/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(story),
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to create success story. Please try again.');
  }
  await syncStories();
};

export const updateStory = async (story) => {
  const res = await fetch(`${API_URL}/api/stories/${story.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(story),
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to update success story. Please try again.');
  }
  await syncStories();
  return getStories();
};

export const deleteStory = async (id) => {
  const res = await fetch(`${API_URL}/api/stories/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Unable to delete success story. Please try again.');
  }
  await syncStories();
  return getStories();
};

export const addProductOffer = async (productId, offer) => {
  const response = await fetch(`${API_URL}/api/products/${productId}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(offer),
    credentials: 'include'
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to add product offer.');
  }
  await ensureInitialData();
  return data.offer;
};

export const updateProductOffer = async (productId, offerId, offer) => {
  const response = await fetch(`${API_URL}/api/products/${productId}/offers/${offerId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(offer),
    credentials: 'include'
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update product offer.');
  }
  await ensureInitialData();
  return data.offer;
};

export const deleteProductOffer = async (productId, offerId) => {
  const response = await fetch(`${API_URL}/api/products/${productId}/offers/${offerId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete product offer.');
  }
  await ensureInitialData();
};

// Start background sync polling to keep local state up-to-date with MySQL single source of truth
if (typeof window !== 'undefined') {
  setInterval(async () => {
    await ensureInitialData();
  }, 2500);
}


// --- INVOICES ---
export const getInvoices = () => read(KEYS.invoices, []);

export const addInvoice = async (invoice) => {
  const response = await fetch(`${API_URL}/api/invoices`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice)
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Failed');
  await ensureInitialData();
  return data;
};

export const deleteInvoice = async (id) => {
  const response = await fetch(`${API_URL}/api/invoices/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Failed');
  await ensureInitialData();
  return data;
};
