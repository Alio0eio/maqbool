type RefreshTokenRecord = {
  userId: string;
  expiresAt: number;
  revoked: boolean;
};

const refreshTokens = new Map<string, RefreshTokenRecord>();
const activeTokensByUser = new Map<string, Set<string>>();

function removeExpiredTokens(now = Date.now()): void {
  for (const [jti, record] of refreshTokens) {
    if (record.expiresAt <= now) {
      refreshTokens.delete(jti);
      activeTokensByUser.get(record.userId)?.delete(jti);
    }
  }
}

export function storeRefreshToken(jti: string, userId: string, expiresAt: number): void {
  removeExpiredTokens();
  refreshTokens.set(jti, { userId, expiresAt, revoked: false });

  const userTokens = activeTokensByUser.get(userId) ?? new Set<string>();
  userTokens.add(jti);
  activeTokensByUser.set(userId, userTokens);
}

export function getRefreshToken(jti: string): RefreshTokenRecord | undefined {
  removeExpiredTokens();
  return refreshTokens.get(jti);
}

export function revokeRefreshToken(jti: string): void {
  const record = refreshTokens.get(jti);
  if (record) {
    record.revoked = true;
    activeTokensByUser.get(record.userId)?.delete(jti);
  }
}

export function revokeRefreshTokensForUser(userId: string): void {
  const userTokens = activeTokensByUser.get(userId);
  if (!userTokens) {
    return;
  }

  for (const jti of userTokens) {
    const record = refreshTokens.get(jti);
    if (record) {
      record.revoked = true;
    }
  }

  activeTokensByUser.delete(userId);
}

export function clearRefreshTokensForTests(): void {
  refreshTokens.clear();
  activeTokensByUser.clear();
}