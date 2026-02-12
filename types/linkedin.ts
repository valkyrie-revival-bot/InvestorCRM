/**
 * LinkedIn Contact Intelligence type definitions
 * Part of Phase 04.5 (Contact Intelligence) - Warm introduction network
 * Aligned with database schema in lib/database/migrations/016-017
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * Type of relationship between LinkedIn contact and investor
 */
export type RelationshipType =
  | 'works_at'                // Contact currently works at the investor firm
  | 'former_colleague'        // Contact used to work there
  | 'knows_decision_maker'    // Contact knows a decision maker
  | 'industry_overlap'        // Same industry/sector
  | 'geographic_proximity';   // Same geography

/**
 * How the relationship was detected
 */
export type DetectedVia =
  | 'company_match'   // Fuzzy matched via company name
  | 'manual'          // Manually added by user
  | 'email_match'     // Matched via email domain
  | 'name_match';     // Matched via contact name

/**
 * Path strength label for UI display
 */
export type StrengthLabel = 'strong' | 'medium' | 'weak';

/**
 * Team members who can import LinkedIn connections
 */
export const TEAM_MEMBERS = ['Todd', 'Jeff', 'Jackson', 'Morino'] as const;
export type TeamMember = typeof TEAM_MEMBERS[number];

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

/**
 * LinkedIn contact entity (public.linkedin_contacts table)
 * Represents a connection from a team member's LinkedIn network
 */
export interface LinkedInContact {
  // Identity
  id: string;

  // Name fields
  first_name: string;
  last_name: string;
  full_name: string; // Generated column: first_name || ' ' || last_name

  // LinkedIn profile and contact info
  linkedin_url: string | null;
  email: string | null;

  // Company and position
  company: string | null;
  position: string | null;
  normalized_company: string | null; // Lowercased, legal suffixes removed

  // Connection tracking
  connected_on: string | null; // ISO date string (YYYY-MM-DD)
  team_member_name: string; // Which team member owns this connection

  // Metadata
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * Investor relationship entity (public.investor_relationships table)
 * Links an investor with a LinkedIn contact, representing a warm intro path
 */
export interface InvestorRelationship {
  // Identity
  id: string;

  // Foreign keys
  investor_id: string;
  linkedin_contact_id: string;

  // Relationship type and strength
  relationship_type: RelationshipType;
  path_strength: number; // 0.00 to 1.00 (higher = stronger)

  // Path description
  path_description: string | null; // Human-readable explanation

  // Detection metadata
  detected_via: DetectedVia;

  // Metadata
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Investor relationship with LinkedIn contact populated
 * Used for displaying relationship details with contact info
 */
export interface InvestorRelationshipWithContact extends InvestorRelationship {
  linkedin_contact: LinkedInContact;
}

/**
 * Warm introduction path (computed, not stored)
 * Flattened view for UI display - combines relationship + contact
 */
export interface IntroPath {
  // LinkedIn contact identity
  linkedin_contact_id: string;
  contact_name: string; // Full name for display
  contact_company: string | null;
  contact_position: string | null;
  team_member_name: string; // Who knows this contact

  // Relationship details
  relationship_type: RelationshipType;
  path_strength: number; // 0.00 to 1.00
  strength_label: StrengthLabel; // Computed: 'strong' | 'medium' | 'weak'
  path_description: string; // Human-readable explanation

  // Contact info
  linkedin_url: string | null;
}

// ============================================================================
// INSERT/UPDATE TYPES
// ============================================================================

/**
 * Type for inserting new LinkedIn contact
 * Omits auto-generated fields (id, full_name, timestamps)
 */
export type LinkedInContactInsert = Omit<
  LinkedInContact,
  'id' | 'full_name' | 'created_at' | 'updated_at'
>;

/**
 * Type for updating existing LinkedIn contact
 * All fields optional except ID
 */
export type LinkedInContactUpdate = Partial<
  Omit<LinkedInContact, 'id' | 'full_name' | 'created_at' | 'updated_at'>
>;

/**
 * Type for inserting new investor relationship
 * Omits auto-generated fields (id, timestamps)
 */
export type InvestorRelationshipInsert = Omit<
  InvestorRelationship,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Type for updating existing investor relationship
 * All fields optional except ID
 */
export type InvestorRelationshipUpdate = Partial<
  Omit<InvestorRelationship, 'id' | 'created_at' | 'updated_at'>
>;

// ============================================================================
// CSV IMPORT TYPES
// ============================================================================

/**
 * LinkedIn CSV row structure (after header transformation)
 * This is what PapaParse will produce from LinkedIn connections export
 */
export interface LinkedInCSVRow {
  first_name: string;
  last_name: string;
  linkedin_url?: string | null;
  email?: string | null;
  company?: string | null;
  position?: string | null;
  connected_on?: string | null; // Date string from LinkedIn: "10 Feb 2026"
}

/**
 * Import result summary
 * Returned from CSV import operations
 */
export interface ImportResult {
  success: boolean;
  imported: number; // Successfully imported contacts
  skipped: number; // Duplicates or invalid rows
  errors: Array<{ row: number; message: string }>; // Validation errors
  relationships_detected: number; // Auto-detected warm intro paths
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Strength thresholds for path strength labels
 */
export const STRENGTH_THRESHOLDS = {
  strong: 0.8,  // >= 0.80 = strong path (works_at, knows_decision_maker)
  medium: 0.5,  // >= 0.50 = medium path (former_colleague)
  // < 0.50 = weak path (industry_overlap, geographic_proximity)
} as const;

/**
 * Default path strengths by relationship type
 */
export const DEFAULT_PATH_STRENGTHS: Record<RelationshipType, number> = {
  works_at: 1.0,              // Strongest: direct employee
  knows_decision_maker: 0.8,  // Strong: knows key person
  former_colleague: 0.6,       // Medium: past connection
  industry_overlap: 0.4,       // Weak: same industry
  geographic_proximity: 0.3,   // Weakest: just location
} as const;

/**
 * Calculate strength label from numeric path strength
 */
export function getStrengthLabel(pathStrength: number): StrengthLabel {
  if (pathStrength >= STRENGTH_THRESHOLDS.strong) return 'strong';
  if (pathStrength >= STRENGTH_THRESHOLDS.medium) return 'medium';
  return 'weak';
}
