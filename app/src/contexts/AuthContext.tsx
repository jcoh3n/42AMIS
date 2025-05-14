'use client';

import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  setToken: () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated (e.g. saved token)
    const checkAuth = async () => {
      try {
        // In a real app, you would check if the token is valid
        const token = localStorage.getItem('auth_token');
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Check for auth code in URL (after redirect from 42 login)
    const url = new URL(window.location.href);
    const authCode = url.searchParams.get('code');
    if (authCode) {
      handleAuthCode(authCode);
    }
  }, []);

  const handleAuthCode = async (authCode: string) => {
    try {
      // Clear the code from URL to prevent reuse
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Exchange the code for a token
      const response = await fetch(`/api/auth/callback?code=${authCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      
      // Store the token
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to handle auth code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      // Redirect to 42 OAuth
      const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
      
      if (!clientId || !redirectUri) {
        throw new Error('Missing OAuth configuration');
      }
      
      const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=public`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
  };

  const setToken = useCallback((token: string) => {
    localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      loading: isLoading, 
      login, 
      logout, 
      setToken
    }}>
      {children}
    </AuthContext.Provider>
  );
} 