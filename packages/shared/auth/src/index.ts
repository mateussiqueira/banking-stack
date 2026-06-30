import jwt from 'jsonwebtoken';

export interface AuthPayload {
  sub: string;
  client_id?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  authenticated: boolean;
  payload?: AuthPayload;
  error?: string;
}

const DEFAULT_JWT_SECRET = 'change-me-to-a-random-64-char-string';

function getSecret(): string {
  return process.env.JWT_SECRET || process.env.OF_JWT_SECRET || DEFAULT_JWT_SECRET;
}

export function verifyToken(token: string, secret?: string): AuthResult {
  try {
    const payload = jwt.verify(token, secret || getSecret()) as AuthPayload;
    return { authenticated: true, payload };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { authenticated: false, error: 'Token expired' };
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return { authenticated: false, error: 'Invalid token' };
    }
    return { authenticated: false, error: 'Authentication failed' };
  }
}

export function extractToken(authorization?: string): string | null {
  if (!authorization) return null;
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function createAuthMiddleware() {
  return {
    verifyToken,
    extractToken,
    async authenticate(authorization?: string): Promise<AuthResult> {
      const token = extractToken(authorization);
      if (!token) {
        return { authenticated: false, error: 'Missing or invalid Authorization header' };
      }
      return verifyToken(token);
    },
  };
}

export function requireAuth(result: AuthResult): AuthPayload {
  if (!result.authenticated || !result.payload) {
    throw new Error(result.error || 'Authentication required');
  }
  return result.payload;
}
