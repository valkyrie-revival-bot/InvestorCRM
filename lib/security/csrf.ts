/**
 * CSRF Protection utilities
 */

import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Hash a CSRF token for storage
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Get or create CSRF token
 * Server-side only - use in Server Components or Server Actions
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = generateCsrfToken();
    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
  }

  return token;
}

/**
 * Validate CSRF token from request
 * @param request - Request object
 * @returns true if valid, false otherwise
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  // Skip CSRF for GET, HEAD, OPTIONS
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  // Skip CSRF check in E2E test mode
  if (process.env.E2E_TEST_MODE === 'true') {
    return true;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    return false;
  }

  // Get token from cookie
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken) {
    return false;
  }

  // Compare hashed tokens
  const headerHash = hashToken(headerToken);
  const cookieHash = hashToken(cookieToken);

  return headerHash === cookieHash;
}

/**
 * Create response headers with CSRF token
 */
export function getCsrfHeaders(token: string): Record<string, string> {
  return {
    [CSRF_HEADER_NAME]: token,
  };
}

/**
 * Client-side: Get CSRF token from cookie
 */
export function getClientCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(
    new RegExp(`(^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[2]) : null;
}
