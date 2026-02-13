/**
 * Real-time collaboration type definitions
 * Supabase Realtime payload types, presence state, and optimistic update contracts
 */

import type { Investor } from './investors'

// ============================================================================
// SUPABASE REALTIME PAYLOAD TYPES
// ============================================================================

/**
 * Realtime event types from Supabase
 * Corresponds to PostgreSQL replication events
 */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

/**
 * Realtime payload structure from Supabase Realtime subscription
 * Generic type T represents the table record type (e.g., Investor, Activity)
 */
export interface RealtimePayload<T> {
  eventType: RealtimeEventType
  new: T // Complete new record (INSERT/UPDATE), empty object for DELETE
  old: Partial<T> // For UPDATE: full old record if REPLICA IDENTITY FULL, else just id. For DELETE: just id when RLS enabled
  schema: string // e.g., "public"
  table: string // e.g., "investors"
  commit_timestamp: string // ISO timestamp of database commit
}

// ============================================================================
// PRESENCE STATE FOR USER TRACKING
// ============================================================================

/**
 * Presence state for tracking who is viewing/editing records
 * Synced via Supabase Realtime Presence channel
 * Each user broadcasts their current state; all users receive everyone's state
 */
export interface PresenceState {
  user_id: string // UUID of authenticated user
  username: string // Display name (from auth.users.email or profile)
  avatar_url?: string // Optional profile image URL
  viewing_record_id: string | null // Which investor record is currently open (null if on list view)
  editing_field: string | null // Which field is being actively edited (null if just viewing)
  online_at: string // ISO timestamp when user came online
}

// ============================================================================
// CONNECTION STATUS
// ============================================================================

/**
 * Connection status for real-time subscription
 * Used for UI indicators (connected badge, reconnecting spinner, error banner)
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'closed'

// ============================================================================
// OPTIMISTIC UPDATE RESULT
// ============================================================================

/**
 * Result of optimistic update operation
 * Returned by updateInvestorOptimistic server action
 */
export interface OptimisticUpdateResult<T> {
  success: boolean // True if update succeeded
  conflict: boolean // True if version mismatch (another user edited)
  data?: T // Updated record if success=true
  error?: string // Error message if success=false
}
