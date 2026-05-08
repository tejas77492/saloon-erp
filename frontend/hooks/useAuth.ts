'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser]         = useState<User | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('salon_token');
    const savedUser  = localStorage.getItem('salon_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res   = await authApi.login({ email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('salon_token', t);
    localStorage.setItem('salon_user',  JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password, role: 'customer' });
    const { token: t, user: u } = res.data;
    localStorage.setItem('salon_token', t);
    localStorage.setItem('salon_user',  JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('salon_token');
    localStorage.removeItem('salon_user');
    setToken(null);
    setUser(null);
  }, []);

  return {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isAdmin:         user?.role === 'admin',
    isCustomer:      user?.role === 'customer',
    login,
    register,
    logout,
  };
}
