import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, ensureInitialData, getSession, setSession } from './storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSessionState] = useState(getSession());

  useEffect(() => {
    ensureInitialData();
    // Validate session on mount
    fetch('http://localhost:5000/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          const payload = {
            name: data.user.name,
            phone: data.user.phone,
            role: data.user.role,
            loggedInAt: new Date().toISOString()
          };
          setSession(payload);
          setSessionState(payload);
        } else {
          // If server says not authenticated, clear frontend session
          clearSession();
          setSessionState(null);
        }
      })
      .catch(() => {
        // Fallback to offline session if server is unreachable
      });
  }, []);

  const login = async (payload) => {
    setSession(payload);
    setSessionState(payload);
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Logout request failed', e);
    }
    clearSession();
    setSessionState(null);
  };

  const value = useMemo(
    () => ({
      session,
      login,
      logout
    }),
    [session]
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
