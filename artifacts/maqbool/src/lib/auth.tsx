import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User, Role } from './mock-data';
import { USERS } from './mock-data';

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  signIn: (email: string, role: Role) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadFromStorage(): { user: User | null; role: Role | null } {
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();
  const [user, setUser] = useState<User | null>(stored.user);
  const [role, setRole] = useState<Role | null>(stored.role);

  const signIn = useCallback((email: string, selectedRole: Role) => {
    // Find matching user or create a mock one
    let found = USERS.find(u => u.email === email && u.role === selectedRole);
    if (!found) {
      // Use default user for the role
      found = USERS.find(u => u.role === selectedRole) ?? USERS[0];
    }
    setUser(found);
    setRole(selectedRole);
    localStorage.setItem('maqbool_role', selectedRole);
    localStorage.setItem('maqbool_user_id', String(found.id));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('maqbool_role');
    localStorage.removeItem('maqbool_user_id');
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
