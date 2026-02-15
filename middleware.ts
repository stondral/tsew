import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add aggressive caching headers for static assets
  if (
    request.nextUrl.pathname.startsWith('/_next/static') ||
    request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }
  
  // Cache API responses with shorter TTL
  if (request.nextUrl.pathname.startsWith('/api/products')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
    );
  }
  
  return response;
}

export const config = {
  matcher: [
    '/_next/static/:path*',
    '/api/:path*',
    '/:path*.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|eot)',
  ],
};
