import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Company } from '../types/index.ts';
import { apiFetch, getStoredToken, setStoredToken } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerCompany: (formData: any) => Promise<any>;
  registerClient: (formData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  quickLoginAs: (preset: 'super_admin' | 'epicerie' | 'grille' | 'client') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const curToken = getStoredToken();
    if (!curToken) {
      setUser(null);
      setCompany(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/api/auth/me');
      setUser(data.user);
      setCompany(data.company || null);
    } catch (err) {
      console.warn('Session check failed:', err);
      setStoredToken(null);
      setToken(null);
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setCompany(data.company || null);
  };

  const registerCompany = async (formData: any) => {
    const data = await apiFetch('/api/auth/register-company', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setCompany(data.company || null);
    return data;
  };

  const registerClient = async (formData: any) => {
    const data = await apiFetch('/api/auth/register-client', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setCompany(null);
    return data;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setCompany(null);
  };

  const quickLoginAs = async (preset: 'super_admin' | 'epicerie' | 'grille' | 'client') => {
    const presets = {
      super_admin: { email: 'admin@jmarket.africa', pass: 'Admin@2026!' },
      epicerie: { email: 'dakar@jmarket.africa', pass: 'Store@2026!' },
      grille: { email: 'grille@jmarket.africa', pass: 'Store@2026!' },
      client: { email: 'client@jmarket.africa', pass: 'Client@2026!' },
    };
    const { email, pass } = presets[preset];
    await login(email, pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        loading,
        login,
        registerCompany,
        registerClient,
        logout,
        refreshUser,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
