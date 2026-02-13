/**
 * Investor pipeline type definitions
 * Aligned with database schema in lib/database/migrations/007-009
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

// Investor stage values (from PROJECT.md stage definitions)
export type InvestorStage =
  | 'Not Yet Approached'
  | 'Initial Contact'
  | 'First Conversation Held'
  | 'Materials Shared'
  | 'NDA / Data Room'
  | 'Active Due Diligence'
  | 'LPA / Legal'
  | 'Won'
  | 'Committed'
  | 'Lost'
  | 'Passed'
  | 'Delayed';

// Allocator type values (from PROJECT.md data model)
export type AllocatorType =
  | 'Family Office'
  | 'HNWI'
  | 'Endowment'
  | 'Foundation'
  | 'Pension'
  | 'Fund of Funds'
  | 'Sovereign Wealth'
  | 'Insurance'
  | 'Other';

// Activity type values (from activities table constraint)
export type ActivityType =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'stage_change'
  | 'field_update';

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

/**
 * Investor entity (public.investors table)
 * Represents a potential investor/LP in the pipeline
 */
export interface Investor {
  // Identity
  id: string;

  // Required fields
  firm_name: string;
  relationship_owner: string;
  stage: string; // Free text, not enum - stages may evolve

  // Optional business fields
  partner_source: string | null;
  est_value: number | null;
  entry_date: string | null; // ISO date string
  stage_entry_date: string | null; // ISO date string — auto-updated by DB trigger on stage change
  last_action_date: string | null; // ISO date string
  stalled: boolean;
  allocator_type: string | null;
  internal_conviction: string | null;
  internal_priority: string | null;
  investment_committee_timing: string | null;
  next_action: string | null;
  next_action_date: string | null; // ISO date string
  current_strategy_notes: string | null;
  current_strategy_date: string | null; // ISO date string
  last_strategy_notes: string | null;
  last_strategy_date: string | null; // ISO date string
  key_objection_risk: string | null;

  // Metadata
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  deleted_at: string | null; // ISO datetime string (soft delete)
  created_by: string | null; // User UUID
  version: number; // Optimistic locking version (auto-incremented on UPDATE)
}

/**
 * Contact entity (public.contacts table)
 * Represents a person associated with an investor firm
 */
export interface Contact {
  // Identity
  id: string;
  investor_id: string;

  // Contact fields
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  notes: string | null;
  is_primary: boolean;

  // Metadata
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  deleted_at: string | null; // ISO datetime string (soft delete)
}

/**
 * Activity entity (public.activities table)
 * Immutable audit trail of investor interactions and changes
 */
export interface Activity {
  // Identity
  id: string;
  investor_id: string;

  // Activity data
  activity_type: ActivityType;
  description: string;
  metadata: Record<string, unknown> | null; // JSON data (field changes, etc.)

  // Metadata
  created_by: string | null; // User UUID
  created_at: string; // ISO datetime string
}

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Investor with related contacts populated
 */
export interface InvestorWithContacts extends Investor {
  contacts: Contact[];
  primary_contact: Contact | null;
}

/**
 * Investor with activity history populated
 */
export interface InvestorWithActivities extends Investor {
  activities: Activity[];
}

/**
 * Full investor record with all relations
 */
export interface InvestorFull extends Investor {
  contacts: Contact[];
  primary_contact: Contact | null;
  activities: Activity[];
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Type for inserting new investor
 * Requires only firm_name, stage, and relationship_owner
 * All other fields are optional
 */
export type InvestorInsert = Omit<
  Investor,
  'id' | 'created_at' | 'updated_at' | 'deleted_at'
> & {
  firm_name: string;
  stage: string;
  relationship_owner: string;
  created_by?: string | null;
};

/**
 * Type for updating existing investor
 * All fields are optional (partial update)
 * Excludes version (managed by optimistic locking logic)
 */
export type InvestorUpdate = Partial<
  Omit<Investor, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'version'>
>;

/**
 * Type for inserting new contact
 */
export type ContactInsert = Omit<
  Contact,
  'id' | 'created_at' | 'updated_at' | 'deleted_at'
> & {
  investor_id: string;
  name: string;
};

/**
 * Type for updating existing contact
 */
export type ContactUpdate = Partial<
  Omit<Contact, 'id' | 'investor_id' | 'created_at' | 'updated_at' | 'deleted_at'>
>;

/**
 * Type for inserting new activity
 */
export type ActivityInsert = Omit<Activity, 'id' | 'created_at'> & {
  investor_id: string;
  activity_type: ActivityType;
  description: string;
  created_by?: string | null;
};

// ============================================================================
// FILTER AND QUERY TYPES
// ============================================================================

/**
 * Filter options for investor queries
 */
export interface InvestorFilters {
  stage?: string | string[];
  relationship_owner?: string | string[];
  allocator_type?: string | string[];
  stalled?: boolean;
  search?: string; // Search firm_name
  include_deleted?: boolean; // Include soft-deleted records (admin only)
}

/**
 * Sort options for investor queries
 */
export interface InvestorSort {
  field: keyof Investor;
  direction: 'asc' | 'desc';
}
