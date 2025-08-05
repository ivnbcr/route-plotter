// AuthContext.tsx
import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '../services/auth.service';
import type { LoginCredentials, AuthenticatedUser } from '../types';

interface AuthContextType {
  user: AuthenticatedUser | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const { token, user } = await AuthService.login(credentials);
      const authenticatedUser: AuthenticatedUser = { ...user, token };
      setUser(authenticatedUser);
      sessionStorage.setItem('user', JSON.stringify(authenticatedUser));
    } catch (error) {
      throw error instanceof Error ? error : new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    sessionStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user?.token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

AuthContext.displayName = 'AuthContext';