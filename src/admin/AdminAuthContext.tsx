import React, { createContext, useContext, useEffect, useState } from 'react';
import { ADMIN_TOKEN_KEY, adminFetch } from './adminApi';

interface AdminUser {
  email: string;
}

interface AdminAuthContextValue {
  token: string | null;
  adminUser: AdminUser | null;
  login: (token: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(ADMIN_TOKEN_KEY),
  );
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Restore user from token on mount
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload?.email) {
          setAdminUser({ email: payload.email });
        }
      } catch {
        // malformed token — clear it
        setToken(null);
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    }
  }, [token]);

  function login(newToken: string) {
    localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
    setToken(newToken);
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      if (payload?.email) {
        setAdminUser({ email: payload.email });
      }
    } catch {
      setAdminUser(null);
    }
  }

  async function logout() {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // best-effort — clear locally regardless
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setAdminUser(null);
  }

  return (
    <AdminAuthContext.Provider value={{ token, adminUser, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
