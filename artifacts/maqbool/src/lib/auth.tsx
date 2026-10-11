import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, customFetch } from '@workspace/api-client-react';
import type { User } from './mock-data';
import type { Role } from './mock-data';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const roles: Role[] = ['candidate', 'recruiter', 'admin'];

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  return customFetch<T>(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    responseType: 'json',
  });
}

function isAuthenticatedUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.email === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.role === 'string' &&
    roles.includes(candidate.role as Role) &&
    (candidate.avatarUrl === undefined ||
      candidate.avatarUrl === null ||
      typeof candidate.avatarUrl === 'string') &&
    (candidate.createdAt === undefined || typeof candidate.createdAt === 'string')
  );
}

function isAuthenticationFailure(error: unknown): boolean {
  return error instanceof ApiError && [401, 403, 404].includes(error.status);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data;
    if (data && typeof data === 'object') {
      const body = data as {
        error?: { message?: unknown };
        message?: unknown;
      };
      if (typeof body.error?.message === 'string') return body.error.message;
      if (typeof body.message === 'string') return body.message;
    }
  }
  return error instanceof Error ? error.message : 'Request failed.';
}

async function getCurrentUser(): Promise<User> {
  const currentUser = await request<unknown>('/auth/me');
  if (!isAuthenticatedUser(currentUser)) {
    throw new Error('The server returned an invalid authenticated user.');
  }
  return currentUser;
}

function clearLegacyAuthenticationData(): void {
  try {
    localStorage.removeItem('maqbool_auth_session');
    localStorage.removeItem('maqbool_role');
    localStorage.removeItem('maqbool_user_id');
  } catch (error) {
    console.error('Unable to clear legacy authentication data.', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const authActionVersion = useRef(0);

  useEffect(() => {
    let mounted = true;
    clearLegacyAuthenticationData();

    const restoreSession = async () => {
      const restoreVersion = authActionVersion.current;
      try {
        let restoredUser: User;
        try {
          restoredUser = await getCurrentUser();
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 401) throw error;
          await request<unknown>('/auth/refresh', { method: 'POST' });
          restoredUser = await getCurrentUser();
        }

        if (mounted && restoreVersion === authActionVersion.current) {
          setUser(restoredUser);
        }
      } catch (error) {
        if (!isAuthenticationFailure(error)) {
          console.error('Unable to restore the authenticated session.', error);
        }
        if (mounted && restoreVersion === authActionVersion.current) setUser(null);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    void restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    authActionVersion.current += 1;
    await request<unknown>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const authenticatedUser = await getCurrentUser();
    setUser(authenticatedUser);
    setIsInitializing(false);
    return authenticatedUser;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    await request<unknown>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
  }, []);

  const signOut = useCallback(async () => {
    authActionVersion.current += 1;
    setUser(null);
    setIsInitializing(false);

    try {
      try {
        await request<unknown>('/auth/logout', { method: 'POST' });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        await request<unknown>('/auth/refresh', { method: 'POST' });
        await request<unknown>('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error(`Unable to invalidate the server session: ${getErrorMessage(error)}`, error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        login,
        register,
        signOut,
        isAuthenticated: !!user,
        isInitializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
