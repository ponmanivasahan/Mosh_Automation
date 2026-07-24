import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, ensureInitialData, getSession, setSession } from './storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSessionState] = useState(getSession());

  useEffect(() => {
    ensureInitialData();
  }, []);

  const login = (payload) => {
    setSession(payload);
    setSessionState(payload);
  };

  const logout = () => {
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
