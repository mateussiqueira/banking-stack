import { verifyToken, extractToken, AuthPayload } from './index';
import type { Context, Next } from 'koa';

declare module 'koa' {
  interface ExtendableContext {
    user?: AuthPayload;
  }
}

export interface AuthMiddlewareOptions {
  secret?: string;
  excludePaths?: string[];
}

export function createKoaAuthMiddleware(opts: AuthMiddlewareOptions = {}) {
  const { secret, excludePaths = ['/health'] } = opts;

  return async (ctx: Context, next: Next) => {
    for (const path of excludePaths) {
      if (ctx.path.startsWith(path)) {
        return next();
      }
    }

    const token = extractToken(ctx.headers.authorization);
    if (!token) {
      ctx.status = 401;
      ctx.body = { error: 'Missing or invalid Authorization header' };
      return;
    }

    const result = verifyToken(token, secret);
    if (!result.authenticated) {
      ctx.status = 401;
      ctx.body = { error: result.error };
      return;
    }

    ctx.user = result.payload;
    return next();
  };
}
