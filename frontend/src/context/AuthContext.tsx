'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (
    email: string,
    pass: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    pass: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // Access token stored purely in memory state
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async (token: string): Promise<User | null> => {
    try {
      const res = await fetch('/api/v1/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data as User;
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      if (data && data.accessToken) {
        setAccessToken(data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch (err) {
      return null;
    }
  }, []);

  // Initialize session on mount via refresh token cookie
  useEffect(() => {
    let mounted = true;
    async function init() {
      setIsLoading(true);
      const token = await refreshSession();
      if (token && mounted) {
        const currentUser = await fetchCurrentUser(token);
        if (currentUser && mounted) {
          setUser(currentUser);
        }
      }
      if (mounted) {
        setIsLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [refreshSession, fetchCurrentUser]);

  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || 'Failed to login';
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      const token = data.accessToken;
      setAccessToken(token);

      const currentUser = await fetchCurrentUser(token);
      if (currentUser) {
        setUser(currentUser);
        return { success: true };
      } else {
        const errMsg = 'Failed to retrieve user profile after login';
        setError(errMsg);
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      const errMsg = err.message || 'Network error during login';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || 'Registration failed';
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      // Automatically log in after registration
      return await login(email, pass);
    } catch (err: any) {
      const errMsg = err.message || 'Network error during registration';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      router.push('/login');
    }
  };

  const apiFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers || {});
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
      };

      const url = endpoint.startsWith('http') || endpoint.startsWith('/api')
        ? endpoint
        : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

      let response = await fetch(url, config);

      // Attempt token refresh once if 401
      if (response.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(url, { ...config, headers });
        } else {
          setUser(null);
          setAccessToken(null);
        }
      }

      return response;
    },
    [accessToken, refreshSession]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        error,
        login,
        register,
        logout,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
