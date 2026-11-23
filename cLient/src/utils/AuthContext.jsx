import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, ensureInitialData, getSession, setSession, forceUserSync } from './storage';
import { API_URL } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSessionState] = useState(getSession());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    ensureInitialData();

    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const checkSession = async () => {
      try {
        // Step 1: Check active session with /api/auth/me
        let res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
          signal: controller.signal
        });

        // If rate limited, preserve existing session state and finish loading
        if (res.status === 429) {
          if (isMounted) {
            setAuthLoading(false);
          }
          return;
        }

        // Step 2: If 401 (access token expired), attempt silent refresh via /api/auth/refresh
        if (res.status === 401) {
          const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            signal: controller.signal
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json().catch(() => ({}));
            if (refreshData.success && refreshData.user) {
              const payload = {
                id: refreshData.user.id,
                name: refreshData.user.name,
                phone: refreshData.user.phone,
                role: refreshData.user.role,
                email: refreshData.user.email || null,
                loggedInAt: new Date().toISOString()
              };
              if (isMounted) {
                setSession(payload);
                setSessionState(payload);
                setAuthLoading(false);
              }
              return;
            }
          }

          // Both /api/auth/me and /api/auth/refresh failed — session is genuinely invalid
          if (isMounted) {
            clearSession();
            setSessionState(null);
            setAuthLoading(false);
          }
          return;
        }

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data && data.success && data.user) {
            const currentSession = getSession();
            const payload = {
              ...currentSession,
              id: data.user.id,
              name: data.user.name,
              phone: data.user.phone,
              role: data.user.role,
              email: data.user.email || null,
              loggedInAt: new Date().toISOString()
            };
            if (isMounted) {
              setSession(payload);
              setSessionState(payload);
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[Auth] Session check failed, preserving cached state:', err.message);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const login = async (payload) => {
    const cleanPayload = { ...payload };
    delete cleanPayload.token; // Sensitive tokens are managed exclusively in HttpOnly cookies
    setSession(cleanPayload);
    setSessionState(cleanPayload);
    await forceUserSync().catch(err => console.warn('Failed to sync user data after login:', err));
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
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
