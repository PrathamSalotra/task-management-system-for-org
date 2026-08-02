// In-memory blacklist for revoked refresh tokens (stateless JWT revocation per Decision D2)
export const tokenBlacklist = new Set<string>();

export function blacklistToken(token: string): void {
  tokenBlacklist.add(token);
}

export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}
