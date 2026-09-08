const revokedTokens = new Map<string, number>();

function removeExpiredTokens(now = Date.now()): void {
  for (const [jti, expiresAt] of revokedTokens) {
    if (expiresAt <= now) {
      revokedTokens.delete(jti);
    }
  }
}

export function revokeAccessToken(jti: string, expiresAt: number): void {
  const now = Date.now();
  removeExpiredTokens(now);

  if (expiresAt > now) {
    revokedTokens.set(jti, expiresAt);
  }
}

export function isAccessTokenRevoked(jti: string): boolean {
  const now = Date.now();
  const expiresAt = revokedTokens.get(jti);

  if (!expiresAt) {
    return false;
  }

  if (expiresAt <= now) {
    revokedTokens.delete(jti);
    return false;
  }

  return true;
}

export function clearRevokedTokensForTests(): void {
  revokedTokens.clear();
}