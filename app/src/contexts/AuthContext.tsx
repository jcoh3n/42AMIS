'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { get42AuthUrl } from '@/lib/api42';

interface AuthContextType {
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
  setToken: (token: string) => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for token in local storage
    const token = localStorage.getItem('accessToken');
    if (token) {
      setAccessToken(token);
    }
    setLoading(false);
  }, []);

  const login = () => {
    // Redirect to 42 OAuth login
    window.location.href = get42AuthUrl();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
  };

  const setToken = (token: string) => {
    localStorage.setItem('accessToken', token);
    setAccessToken(token);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated: !!accessToken,
        loading,
        login,
        logout,
        setToken,
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