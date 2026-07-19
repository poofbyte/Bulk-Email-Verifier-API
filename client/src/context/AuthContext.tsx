import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as api from '@/api/client';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  apiKey: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  apiKey: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('bev_api_key'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (apiKey) {
      api.getMe()
        .then((res) => {
          if (res.success) setUser(res.data);
          else if (res.error?.code === 'INVALID_API_KEY') {
            localStorage.removeItem('bev_api_key');
            setApiKey(null);
          }
          // On other errors (500, network), keep the key and try later
        })
        .catch(() => {
          // Network error - keep the key, user might be offline
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [apiKey]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (!res.success) throw new Error(res.error?.message || 'Login failed');
    localStorage.setItem('bev_api_key', res.data.apiKey);
    setApiKey(res.data.apiKey);
    setUser(res.data.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.signup(name, email, password);
    if (!res.success) throw new Error(res.error?.message || 'Signup failed');
    localStorage.setItem('bev_api_key', res.data.apiKey);
    setApiKey(res.data.apiKey);
    setUser(res.data.user);
  }, []);

   const logout = useCallback(() => {
     localStorage.removeItem('bev_api_key');
     localStorage.removeItem('bev_admin_key');
     setApiKey(null);
     setUser(null);
   }, []);

  return (
    <AuthContext.Provider value={{ user, apiKey, isAuthenticated: !!user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
