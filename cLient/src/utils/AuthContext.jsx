import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, ensureInitialData, getSession, setSession } from './storage';
import { API_URL } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSessionState] = useState(getSession());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    ensureInitialData();
    
    // Validate session on mount
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          // Genuinely logged out, expired, or user deleted from database
          clearSession();
          setSessionState(null);
          return null;
        }
        return res.json().catch(() => null);
      })
      .then(data => {
        if (data && data.success && data.user) {
          const currentSession = getSession();
          const payload = {
            ...currentSession, // keep token
            name: data.user.name,
            phone: data.user.phone,
            role: data.user.role,
            loggedInAt: new Date().toISOString()
          };
          setSession(payload);
          setSessionState(payload);
        }
      })
      .catch(() => {
        // Network or server error: do not clear local auth state
      })
      .finally(() => {
        setAuthLoading(false);
      });
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
