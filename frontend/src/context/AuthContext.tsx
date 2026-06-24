import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '../types/domain';
import { authApi } from '../api/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('hc_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password);
      localStorage.setItem('hc_token', result.token);
      localStorage.setItem('hc_user', JSON.stringify(result.user));
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hc_token');
    localStorage.removeItem('hc_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
