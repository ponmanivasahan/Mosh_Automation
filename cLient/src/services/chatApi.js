import { API_URL } from '../utils/api';

const base = API_URL ? `${API_URL}/api/chat` : '/api/chat';

export async function sendChatMessage({ message, history = [], enableSearch = true }) {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, history, enableSearch })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to get AI response.');
  }
  return data;
}

export async function fetchChatHistory(limit = 50) {
  const res = await fetch(`${base}/history?limit=${encodeURIComponent(limit)}`, {
    method: 'GET',
    credentials: 'include'
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to fetch chat history.');
  }
  return data;
}

export async function clearChatHistory() {
  const res = await fetch(`${base}/history`, {
    method: 'DELETE',
    credentials: 'include'
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to clear chat history.');
  }
  return data;
}
