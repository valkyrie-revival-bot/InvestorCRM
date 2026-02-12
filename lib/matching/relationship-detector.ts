/**
 * Relationship detection and scoring engine
 * Detects warm intro paths between LinkedIn contacts and investor firms
 * Part of Phase 04.5 (Contact Intelligence) - Warm introduction network
 */

import { createCompanyMatcher, type CompanyMatch } from './fuzzy-matcher';
import type {
  LinkedInContact,
  RelationshipType,
  InvestorRelationshipInsert,
  StrengthLabel,
} from '@/types/linkedin';

/**
 * Base path strength scores by relationship type
 * These are multiplied by recency to get final path_strength
 */
const BASE_PATH_STRENGTHS: Record<RelationshipType, number> = {
  works_at: 1.0,              // Strongest: direct employee
  former_colleague: 0.7,      // Strong: past connection
  knows_decision_maker: 0.6,  // Medium-strong: knows key person
  industry_overlap: 0.3,      // Weak: same industry
  geographic_proximity: 0.2,  // Weakest: just location
};

/**
 * Calculate path strength score with recency multiplier
 *
 * @param relationshipType Type of relationship
 * @param connectedOnDate ISO date string (YYYY-MM-DD) when connection was made
 * @returns Final path strength score (0.0-1.0, capped at 1.0)
 */
export function calculatePathStrength(
  relationshipType: RelationshipType,
  connectedOnDate: string | null
): number {
  const baseStrength = BASE_PATH_STRENGTHS[relationshipType];

  // Calculate recency multiplier based on connection date
  let recencyMultiplier = 1.0;

  if (connectedOnDate) {
    try {
      const connectedDate = new Date(connectedOnDate);
      const now = new Date();
      const daysAgo = Math.floor((now.getTime() - connectedDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysAgo < 30) {
        recencyMultiplier = 1.2; // Very recent
      } else if (daysAgo < 90) {
        recencyMultiplier = 1.0; // Recent
      } else if (daysAgo < 365) {
        recencyMultiplier = 0.9; // Within past year
      } else {
        recencyMultiplier = 0.8; // Older connection
      }
    } catch (error) {
      // Invalid date, use default multiplier
      recencyMultiplier = 1.0;
    }
  }

  // Apply multiplier and cap at 1.0
  const finalStrength = baseStrength * recencyMultiplier;
  return Math.min(finalStrength, 1.0);
}

/**
 * Classify path strength into label for UI display
 *
 * @param score Path strength score (0.0-1.0)
 * @returns Strength label: 'strong', 'medium', or 'weak'
 */
export function classifyStrength(score: number): StrengthLabel {
  if (score >= 0.7) return 'strong';
  if (score >= 0.4) return 'medium';
  return 'weak';
}

/**
 * Detect relationships between LinkedIn contacts and investors
 *
 * Uses fuzzy company name matching to find connections, classifies relationship
 * types based on match quality, and calculates path strength scores.
 *
 * @param linkedinContacts Array of LinkedIn contacts to analyze
 * @param investors Array of investors to match against
 * @returns Array of relationship inserts ready for database
 */
export function detectRelationships(
  linkedinContacts: LinkedInContact[],
  investors: Array<{ id: string; firm_name: string }>
): InvestorRelationshipInsert[] {
  // Create company matcher from investors
  const matcher = createCompanyMatcher(investors);

  const relationships: InvestorRelationshipInsert[] = [];

  // Process each LinkedIn contact
  for (const contact of linkedinContacts) {
    // Skip contacts without a company
    if (!contact.company) continue;

    // Find matching investor firms
    const matches = matcher.findMatches(contact.company);

    // Create relationships for each match
    for (const match of matches) {
      // Determine relationship type based on match quality and position
      const relationshipType = classifyRelationshipType(
        match.similarity_score,
        contact.position
      );

      // Calculate path strength
      const pathStrength = calculatePathStrength(
        relationshipType,
        contact.connected_on
      );

      // Build human-readable path description
      const pathDescription = buildPathDescription(
        contact,
        match,
        relationshipType
      );

      // Add to relationships array
      relationships.push({
        investor_id: match.investor_id,
        linkedin_contact_id: contact.id,
        relationship_type: relationshipType,
        path_strength: pathStrength,
        path_description: pathDescription,
        detected_via: 'company_match',
      });
    }
  }

  return relationships;
}

/**
 * Classify relationship type based on company match quality and contact position
 *
 * @param similarityScore Match score (0.0-1.0)
 * @param position Contact's position/title (may be null)
 * @returns Relationship type classification
 */
function classifyRelationshipType(
  similarityScore: number,
  position: string | null
): RelationshipType {
  // High similarity + has current position = works there
  if (similarityScore >= 0.8 && position) {
    return 'works_at';
  }

  // Medium-high similarity = industry overlap (conservative)
  // Could be same company (different dept) or related company
  if (similarityScore >= 0.5) {
    return 'industry_overlap';
  }

  // Lower similarity = still industry overlap
  return 'industry_overlap';
}

/**
 * Build human-readable path description
 *
 * @param contact LinkedIn contact
 * @param match Company match result
 * @param relationshipType Classified relationship type
 * @returns Path description string
 */
function buildPathDescription(
  contact: LinkedInContact,
  match: CompanyMatch,
  relationshipType: RelationshipType
): string {
  const name = contact.full_name;
  const position = contact.position || 'Position unknown';
  const company = contact.company;
  const teamMember = contact.team_member_name;
  const connectedDate = contact.connected_on
    ? new Date(contact.connected_on).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Date unknown';

  const relationshipLabel = {
    works_at: 'currently works at',
    former_colleague: 'formerly worked at',
    knows_decision_maker: 'knows decision maker at',
    industry_overlap: 'has industry connection to',
    geographic_proximity: 'is geographically near',
  }[relationshipType];

  return `${name} (${position}) at ${company} — ${relationshipLabel} ${match.firm_name}. Known to ${teamMember} since ${connectedDate}.`;
}
