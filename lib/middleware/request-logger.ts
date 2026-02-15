import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

/**
 * Request logging middleware for API routes
 * Logs incoming requests, responses, and errors with timing
 */
export async function withRequestLogging(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const { method, url } = request;
  const path = new URL(url).pathname;

  // Log incoming request
  log.http('Incoming request', {
    requestId,
    method,
    path,
    userAgent: request.headers.get('user-agent'),
  });

  try {
    // Execute handler
    const response = await handler(request);

    // Calculate duration
    const duration = Date.now() - startTime;

    // Log successful response
    log.http('Request completed', {
      requestId,
      method,
      path,
      status: response.status,
      duration,
    });

    return response;
  } catch (error) {
    // Calculate duration
    const duration = Date.now() - startTime;

    // Log error
    log.error('Request failed', {
      requestId,
      method,
      path,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw to let Next.js handle it
    throw error;
  }
}

/**
 * Wrapper for API route handlers to add logging
 *
 * Usage in API routes:
 * ```ts
 * export const GET = loggedRoute(async (request) => {
 *   // Your handler code
 *   return NextResponse.json({ data: 'example' });
 * });
 * ```
 */
export function loggedRoute(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    return withRequestLogging(request, handler);
  };
}
