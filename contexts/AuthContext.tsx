'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  tallac_role?: string;
  roles?: string[];
  territories?: any[];
  territory_count?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  canViewPartnersAndUsers: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        // Redirect to login if no token
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return;
      }

      // Check token expiry (JWT tokens have exp claim)
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const exp = payload.exp;
          if (exp && exp * 1000 < Date.now()) {
            // Token expired
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_token');
              document.cookie = 'auth_token=; path=/; max-age=0';
              window.location.href = '/login';
            }
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        // If token parsing fails, continue with API check
      }

      const response = await api.getCurrentUser();
      
      // Backend returns { success: true, user: {...} }
      // After request() it might be { success: true, data: { user: {...} } } or { success: true, data: {...} } or { success: true, user: {...} }
      const responseAny = response as any;
      const userData = responseAny.user || responseAny.data?.user || responseAny.data;
      
      if (response.success && userData && (userData.id || userData.email)) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Token invalid or expired - redirect to login
        setIsAuthenticated(false);
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          document.cookie = 'auth_token=; path=/; max-age=0';
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        document.cookie = 'auth_token=; path=/; max-age=0';
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      // Backend returns { success: true, token: "...", user: {...} }
      // After request() it becomes { success: true, token: "...", user: {...} }
      if (response.success) {
        // Check for user in different possible locations
        const responseAny = response as any;
        const userData = responseAny.user || responseAny.data?.user;
        
        if (userData && (userData.id || userData.email)) {
          // Set user data directly from login response - no need to call checkAuth
          setUser(userData);
          setIsAuthenticated(true);
          setIsLoading(false); // Set loading to false immediately
          
          // Token is already saved by api.login()
          return { success: true };
        } else {
          // If user data is missing, redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            document.cookie = 'auth_token=; path=/; max-age=0';
          }
          return { success: false, message: 'Login response missing user data' };
        }
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        // Also remove cookie
        document.cookie = 'auth_token=; path=/; max-age=0';
      }
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    const userRoles = [...(user.roles || [])];
    if (user.tallac_role) {
      userRoles.push(user.tallac_role);
    }
    return roles.some(role => userRoles.includes(role));
  };

  // Memoize canViewPartnersAndUsers to prevent unnecessary re-renders
  const canViewPartnersAndUsers = useMemo(() => {
    return hasRole([
    'Corporate Admin',
    'Administrator',
    'System Manager',
    'Business Coach',
    'Territory Admin'
  ]);
  }, [user?.tallac_role, user?.roles]);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
        hasRole,
        canViewPartnersAndUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

