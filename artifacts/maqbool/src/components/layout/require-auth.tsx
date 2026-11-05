import type { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/mock-data';

export function RequireAuth({ role, children }: { role: Role; children: ReactNode }) {
  const { isAuthenticated, role: currentRole, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-surface-bg text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        Restoring your session…
      </main>
    );
  }

  if (!isAuthenticated) {
    const currentDestination = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const returnTo =
      role === 'candidate' && currentDestination.startsWith('/candidate/')
        ? `/?returnTo=${encodeURIComponent(currentDestination)}`
        : '/';
    return <Redirect to={returnTo} />;
  }

  if (currentRole !== role) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
