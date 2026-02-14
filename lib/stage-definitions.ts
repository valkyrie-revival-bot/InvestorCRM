/**
 * Centralized stage definitions and workflow configuration
 *
 * Purpose: Single source of truth for stage metadata, exit criteria,
 * allowed transitions, and stalled detection logic.
 *
 * Used by: Kanban validation, stage transition dialogs, stalled detection
 */

import type { InvestorStage } from '@/types/investors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Exit criterion checklist item
 * These are CHECKLIST ITEMS the user must confirm, not database fields
 */
export interface ExitCriterion {
  id: string;
  label: string;
  description: string;
}

/**
 * Stage definition with metadata and workflow rules
 */
export interface StageDefinition {
  label: string;
  order: number; // 1-5, terminal stages share order 5
  exitCriteria: ExitCriterion[];
  allowedTransitions: InvestorStage[];
}

// ============================================================================
// STAGE DEFINITIONS
// ============================================================================

/**
 * Centralized stage configuration
 * Each stage has:
 * - Display label (same as key)
 * - Numeric order for display consistency
 * - Exit criteria (checklist items to confirm before progression)
 * - Allowed transitions (stages this stage can transition TO)
 */
export const STAGE_DEFINITIONS = {
  'Not Yet Approached': {
    label: 'Not Yet Approached',
    order: 1,
    exitCriteria: [
      {
        id: 'outreach_planned',
        label: 'Outreach strategy defined',
        description: 'Clear plan for initial contact approach'
      },
      {
        id: 'contact_info_verified',
        label: 'Contact information verified',
        description: 'Email, phone, or LinkedIn contact confirmed'
      }
    ],
    allowedTransitions: ['Initial Contact']
  },
  'Initial Contact': {
    label: 'Initial Contact',
    order: 2,
    exitCriteria: [
      {
        id: 'first_outreach_completed',
        label: 'First outreach completed',
        description: 'Email sent, call made, or LinkedIn message delivered'
      },
      {
        id: 'contact_acknowledged',
        label: 'Contact acknowledged receipt',
        description: 'LP confirmed they received our outreach'
      }
    ],
    allowedTransitions: ['First Conversation Held', 'Lost', 'Passed']
  },
  'First Conversation Held': {
    label: 'First Conversation Held',
    order: 2,
    exitCriteria: [
      {
        id: 'initial_call_completed',
        label: 'Initial call or meeting completed',
        description: 'First substantive conversation with LP decision maker or gatekeeper'
      },
      {
        id: 'key_contact_identified',
        label: 'Key contact identified',
        description: 'Know who the decision maker is and how to reach them'
      }
    ],
    allowedTransitions: ['Materials Shared', 'Lost', 'Passed']
  },
  'Materials Shared': {
    label: 'Materials Shared',
    order: 3,
    exitCriteria: [
      {
        id: 'pitch_deck_sent',
        label: 'Pitch deck or fund materials sent',
        description: 'LP received fund deck, tearsheet, or investment memo'
      },
      {
        id: 'lp_confirmed_receipt',
        label: 'LP confirmed receipt',
        description: 'LP acknowledged they received and will review materials'
      }
    ],
    allowedTransitions: ['NDA / Data Room', 'Lost', 'Passed', 'Delayed']
  },
  'NDA / Data Room': {
    label: 'NDA / Data Room',
    order: 3,
    exitCriteria: [
      {
        id: 'nda_fully_executed',
        label: 'NDA fully executed',
        description: 'Both parties signed NDA, all copies returned'
      },
      {
        id: 'data_room_access_granted',
        label: 'Data room access granted',
        description: 'LP has access credentials and can view due diligence materials'
      }
    ],
    allowedTransitions: ['Active Due Diligence', 'Lost', 'Passed', 'Delayed']
  },
  'Active Due Diligence': {
    label: 'Active Due Diligence',
    order: 4,
    exitCriteria: [
      {
        id: 'dd_process_initiated',
        label: 'DD process formally initiated',
        description: 'LP officially began due diligence process with written confirmation'
      },
      {
        id: 'dd_meetings_held',
        label: 'At least 2 DD meetings held',
        description: 'Minimum of 2 substantive due diligence calls or meetings completed'
      }
    ],
    allowedTransitions: ['LPA / Legal', 'Lost', 'Passed', 'Delayed']
  },
  'LPA / Legal': {
    label: 'LPA / Legal',
    order: 4,
    exitCriteria: [
      {
        id: 'lpa_reviewed',
        label: 'LPA reviewed by LP counsel',
        description: "LP's legal team reviewed Limited Partnership Agreement"
      },
      {
        id: 'key_terms_agreed',
        label: 'Key terms agreed',
        description: 'No major open issues on investment amount, fees, or governance'
      }
    ],
    allowedTransitions: ['Won', 'Committed', 'Lost', 'Passed', 'Delayed']
  },
  // Terminal stages - no exit criteria, endpoints of pipeline
  'Won': {
    label: 'Won',
    order: 5,
    exitCriteria: [],
    allowedTransitions: [
      // Allow re-engagement: can move back to any active stage
      'Not Yet Approached',
      'Initial Contact',
      'First Conversation Held',
      'Materials Shared',
      'NDA / Data Room',
      'Active Due Diligence',
      'LPA / Legal'
    ]
  },
  'Committed': {
    label: 'Committed',
    order: 5,
    exitCriteria: [],
    allowedTransitions: [
      // Allow re-engagement: can move back to any active stage
      'Not Yet Approached',
      'Initial Contact',
      'First Conversation Held',
      'Materials Shared',
      'NDA / Data Room',
      'Active Due Diligence',
      'LPA / Legal'
    ]
  },
  'Lost': {
    label: 'Lost',
    order: 5,
    exitCriteria: [],
    allowedTransitions: [
      // Allow re-engagement: can move back to any active stage
      'Not Yet Approached',
      'Initial Contact',
      'First Conversation Held',
      'Materials Shared',
      'NDA / Data Room',
      'Active Due Diligence',
      'LPA / Legal'
    ]
  },
  'Passed': {
    label: 'Passed',
    order: 5,
    exitCriteria: [],
    allowedTransitions: [
      // Allow re-engagement: can move back to any active stage
      'Not Yet Approached',
      'Initial Contact',
      'First Conversation Held',
      'Materials Shared',
      'NDA / Data Room',
      'Active Due Diligence',
      'LPA / Legal'
    ]
  },
  'Delayed': {
    label: 'Delayed',
    order: 5,
    exitCriteria: [],
    allowedTransitions: [
      // Allow re-engagement: can move back to any active stage
      'Not Yet Approached',
      'Initial Contact',
      'First Conversation Held',
      'Materials Shared',
      'NDA / Data Room',
      'Active Due Diligence',
      'LPA / Legal'
    ]
  }
} as const satisfies Record<InvestorStage, StageDefinition>;

/**
 * Ordered array of stage names for display consistency
 * Follows progression: approach → contact → materials → diligence → close
 */
export const STAGE_ORDER: InvestorStage[] = [
  'Not Yet Approached',
  'Initial Contact',
  'First Conversation Held',
  'Materials Shared',
  'NDA / Data Room',
  'Active Due Diligence',
  'LPA / Legal',
  'Won',
  'Committed',
  'Lost',
  'Passed',
  'Delayed'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get exit criteria for a stage
 * @returns Array of exit criteria (empty for terminal stages)
 */
export function getExitCriteria(stage: InvestorStage): ExitCriterion[] {
  const definition = STAGE_DEFINITIONS[stage];
  return definition?.exitCriteria || [];
}

/**
 * Get allowed target stages for a transition
 * @returns Array of stage names this stage can transition TO
 */
export function getAllowedTransitions(fromStage: InvestorStage): InvestorStage[] {
  const definition = STAGE_DEFINITIONS[fromStage];
  return definition?.allowedTransitions || [];
}

/**
 * Check if a stage is terminal (Won/Committed/Lost/Passed/Delayed)
 * Terminal stages have no exit criteria and represent pipeline endpoints
 */
export function isTerminalStage(stage: InvestorStage): boolean {
  return stage === 'Won'
    || stage === 'Committed'
    || stage === 'Lost'
    || stage === 'Passed'
    || stage === 'Delayed';
}

/**
 * Check if a stage transition is allowed
 * @param from Source stage
 * @param to Target stage
 * @returns true if transition is allowed
 */
export function isValidTransition(from: InvestorStage, to: InvestorStage): boolean {
  const allowedTransitions = getAllowedTransitions(from);
  return allowedTransitions.includes(to);
}

/**
 * Compute if an investor is stalled based on last action date
 *
 * Logic:
 * - Terminal stages (Won/Lost/etc) are never stalled
 * - If no last_action_date AND no stage_entry_date, not stalled (newly created, no dates yet)
 * - If no last_action_date but has stage_entry_date, use stage_entry_date (investor exists but has no logged activity)
 * - If days since last action (or stage entry) >= threshold, stalled
 *
 * @param lastActionDate ISO date string (YYYY-MM-DD) or null
 * @param stage Current investor stage
 * @param thresholdDays Days of inactivity threshold (default: 30)
 * @param stageEntryDate Optional fallback date if no last action date
 * @returns true if investor is stalled
 */
export function computeIsStalled(
  lastActionDate: string | null,
  stage: InvestorStage,
  thresholdDays: number = 30,
  stageEntryDate?: string | null
): boolean {
  // Terminal stages are never stalled
  if (isTerminalStage(stage)) {
    return false;
  }

  // Determine reference date: prefer last_action_date, fallback to stage_entry_date
  const referenceDate = lastActionDate || stageEntryDate;

  // No reference date at all = not stalled (truly newly created with no dates yet)
  if (!referenceDate) {
    return false;
  }

  // Calculate days since reference date
  const refDate = new Date(referenceDate);
  const now = new Date();
  const daysSinceRef = Math.floor(
    (now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceRef >= thresholdDays;
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export InvestorStage type for convenience
export type { InvestorStage } from '@/types/investors';
