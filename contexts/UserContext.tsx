'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserInfo {
  id?: string;
  email?: string;
  full_name?: string;
  role?: string;
  name?: string;
  password_change_required?: boolean;
  is_active?: boolean;
}

interface UserContextType {
  user: UserInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      
      // Check if we're in the browser
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token, user is not authenticated
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Validate token format immediately
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        // Invalid token format, clear it immediately
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        // Decode JWT to check expiry BEFORE making API call
        const payload = JSON.parse(atob(tokenParts[1]));
        
        // Check if token is expired - clear immediately if expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token is expired, clear it immediately
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Token decoding failed, clear invalid token immediately
        console.error('Invalid token format:', e);
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Token format is valid and not expired, verify with API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout (reduced from 5)
      
      try {
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const userData = await response.json();
          const verifiedUser = userData.user || userData;
          
          // Only set user after API verification succeeds
          setUser(verifiedUser);
          setLoading(false);
        } else if (response.status === 401 || response.status === 403) {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
        } else {
          // Other error, clear token to be safe
          localStorage.removeItem('token');
          setUser(null);
          setLoading(false);
        }
      } catch (apiError: any) {
        clearTimeout(timeoutId);
        
        // If API call fails, don't trust the token - clear it and require login
        // This prevents redirecting to change-password with invalid tokens
        if (apiError.name === 'AbortError') {
          console.warn('API call timeout, clearing token for security');
        } else {
          console.warn('Failed to verify token with API, clearing token:', apiError);
        }
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear user state immediately
    setUser(null);
    setLoading(false);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refresh: fetchUserInfo, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}


