/**
 * Authentication and authorization type definitions
 * Aligned with database schema in lib/database/migrations/
 */

// Application role types (matches public.app_role enum in database)
export type AppRole = 'admin' | 'member';

// User profile with role information
export interface UserProfile {
  id: string;
  email: string;
  role: AppRole;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
}

// Audit log entry (matches public.app_audit_log table)
export interface AuditLogEntry {
  id: number;
  userId: string | null;
  userEmail: string | null;
  eventType: string;
  resourceType: string | null;
  resourceId: string | null;
  action: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// Authentication event types
export type AuthEvent =
  | 'login'
  | 'logout'
  | 'failed_login'
  | 'role_change'
  | 'user_added'
  | 'user_removed'
  | 'settings_change';

// JWT payload structure (from custom access token hook)
export interface JWTPayload {
  sub: string;
  email: string;
  user_role?: AppRole;
  exp: number;
  iat: number;
}
