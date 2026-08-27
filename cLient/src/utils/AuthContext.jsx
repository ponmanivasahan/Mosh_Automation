import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, ensureInitialData, getSession, setSession } from './storage';
import { API_URL } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSessionState] = useState(getSession());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    ensureInitialData();

    // Abort controller so we can cancel on timeout (handles Render cold-start on mobile)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    // Validate session on mount
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include', signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        // Only 401 means "token invalid / expired" — log out
        // 403/404/5xx are server-side errors, keep local session alive
        if (res.status === 401) {
          clearSession();
          setSessionState(null);
          return null;
        }
        if (!res.ok) return null; // server error — preserve session
        return res.json().catch(() => null);
      })
      .then(data => {
        if (data && data.success && data.user) {
          const currentSession = getSession();
          const payload = {
            ...currentSession, // keep existing fields
            name: data.user.name,
            phone: data.user.phone,
            role: data.user.role,
            // Always update token if server returned a fresher one
            ...(data.token ? { token: data.token } : {}),
            loggedInAt: new Date().toISOString()
          };
          setSession(payload);
          setSessionState(payload);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        // Network error (offline, Render cold-start timeout, etc.) — keep local session
        if (err.name !== 'AbortError') {
          console.warn('[Auth] Session check failed, keeping local session:', err.message);
        }
      })
      .finally(() => {
        setAuthLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const login = async (payload) => {
    setSession(payload);
    setSessionState(payload);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Logout request failed', e);
    }
    clearSession();
    setSessionState(null);
  };

  const value = useMemo(
    () => ({
      session,
      authLoading,
      login,
      logout
    }),
    [session, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
