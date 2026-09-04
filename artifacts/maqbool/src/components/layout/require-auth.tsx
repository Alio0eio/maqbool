import type { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/mock-data';

export function RequireAuth({ role, children }: { role: Role; children: ReactNode }) {
  const { isAuthenticated, role: currentRole } = useAuth();

  if (!isAuthenticated || currentRole !== role) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
