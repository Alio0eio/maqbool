import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User, Role } from './mock-data';
import { USERS } from './mock-data';

const SESSION_STORAGE_KEY = 'maqbool_auth_session';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

interface LoginResponse {
  message: string;
  token: string;
  accessToken: string;
  refreshToken: string;
  user: Pick<User, 'id' | 'email' | 'name'>;
}

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<User>;
  signIn: (email: string, role: Role) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredSession(): StoredSession | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as StoredSession;
    if (
      typeof session.accessToken === 'string' &&
      typeof session.refreshToken === 'string' &&
      session.user &&
      typeof session.user.id === 'number' &&
      typeof session.user.email === 'string' &&
      typeof session.user.name === 'string' &&
      ['candidate', 'recruiter', 'admin'].includes(session.user.role)
    ) {
      return session;
    }
  } catch {}
  return null;
}

function loadFromStorage(): StoredSession | { user: User | null; role: Role | null } {
  const session = getStoredSession();
  if (session) return session;

  try {
    const role = localStorage.getItem('maqbool_role') as Role | null;
    const userId = localStorage.getItem('maqbool_user_id');
    if (role && userId) {
      const user = USERS.find(u => u.id === Number(userId)) ?? null;
      return { user, role };
    }
  } catch {}
  return { user: null, role: null };
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string };
      message?: string;
    };
    return body.error?.message || body.message || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [stored] = useState(loadFromStorage);
  const [user, setUser] = useState<User | null>(stored.user);
  const [role, setRole] = useState<Role | null>(
    'role' in stored ? stored.role : stored.user?.role ?? null,
  );
  const [accessToken, setAccessToken] = useState<string | null>(
    'accessToken' in stored ? stored.accessToken : null,
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    'refreshToken' in stored ? stored.refreshToken : null,
  );

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response));

    const result = (await response.json()) as LoginResponse;
    const token = result.accessToken || result.token;
    if (!token || !result.refreshToken) {
      throw new Error('The server returned an incomplete login response.');
    }

    const currentUserResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'same-origin',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!currentUserResponse.ok) {
      throw new Error(await getErrorMessage(currentUserResponse));
    }

    const authenticatedUser = (await currentUserResponse.json()) as User;
    if (authenticatedUser.role !== 'candidate' && authenticatedUser.role !== 'recruiter') {
      throw new Error('This account does not have access to a candidate or recruiter dashboard.');
    }

    const session: StoredSession = {
      accessToken: token,
      refreshToken: result.refreshToken,
      user: authenticatedUser,
    };
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.removeItem('maqbool_role');
      localStorage.removeItem('maqbool_user_id');
    } catch {}
    setUser(authenticatedUser);
    setRole(authenticatedUser.role);
    setAccessToken(token);
    setRefreshToken(result.refreshToken);
    return authenticatedUser;
  }, []);

  const signIn = useCallback((email: string, selectedRole: Role) => {
    // Find matching user or create a mock one
    let found = USERS.find(u => u.email === email && u.role === selectedRole);
    if (!found) {
      // Use default user for the role
      found = USERS.find(u => u.role === selectedRole) ?? USERS[0];
    }
    setUser(found);
    setRole(selectedRole);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.setItem('maqbool_role', selectedRole);
    localStorage.setItem('maqbool_user_id', String(found.id));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setRole(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('maqbool_role');
    localStorage.removeItem('maqbool_user_id');
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, accessToken, refreshToken, login, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
