import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/security/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api')) {
    const ip = getClientIp(request);

    // Determine which rate limit to apply
    const isAuthRoute = pathname.includes('/auth/') || pathname.includes('/login');
    const isSensitiveRoute =
      pathname.includes('/delete') ||
      pathname.includes('/admin') ||
      isAuthRoute;

    const rateLimitConfig = isSensitiveRoute ? RATE_LIMITS.SENSITIVE : RATE_LIMITS.API;
    const rateLimitResult = checkRateLimit(`api:${ip}:${pathname}`, rateLimitConfig);

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful requests
    const response = await updateSession(request);
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());
    return response;
  }

  // For non-API routes, just apply session management
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
