import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/redis/ratelimit';

/**
 * Rate Limit Middleware
 * 
 * Apply rate limiting to API routes to prevent abuse.
 * Returns 429 Too Many Requests when limit is exceeded.
 * 
 * Usage:
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await applyRateLimit(req, 'login');
 *   if (rateLimitResult) return rateLimitResult;
 *   
 *   // Process request...
 * }
 * ```
 */

/**
 * Get identifier from request (IP address or user ID)
 */
function getIdentifier(req: NextRequest): string {
  // Try to get IP from headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Apply rate limiting to a request
 * Returns Response if rate limit exceeded, null if allowed
 */
export async function applyRateLimit(
  req: NextRequest,
  endpoint: string,
  customLimit?: number,
  customWindow?: number
): Promise<NextResponse | null> {
  const identifier = getIdentifier(req);
  
  const { allowed, headers } = await rateLimitMiddleware(
    endpoint,
    identifier,
    customLimit,
    customWindow
  );

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
      },
      {
        status: 429,
        headers,
      }
    );
  }

  return null;
}

/**
 * Add rate limit headers to response
 */
export async function addRateLimitHeaders(
  req: NextRequest,
  response: NextResponse,
  endpoint: string
): Promise<NextResponse> {
  const identifier = getIdentifier(req);
  const { headers } = await rateLimitMiddleware(endpoint, identifier);

  // Add headers to existing response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Decorator function for rate-limited API routes
 */
export function withRateLimit(
  endpoint: string,
  handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  customLimit?: number,
  customWindow?: number
) {
  return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResult = await applyRateLimit(req, endpoint, customLimit, customWindow);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Execute handler
    return handler(req, ...args);
  };
}
