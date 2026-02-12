'use client';

/**
 * Connection card component
 * Displays a single warm introduction path with contact info and strength badge
 * Part of Phase 04.5 (Contact Intelligence)
 */

import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import type { IntroPath } from '@/types/linkedin';

interface ConnectionCardProps {
  introPath: IntroPath;
}

/**
 * Get badge styling based on strength label
 */
function getStrengthBadgeStyle(strength: 'strong' | 'medium' | 'weak') {
  switch (strength) {
    case 'strong':
      return 'bg-green-500/20 text-green-400 hover:bg-green-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30';
    case 'weak':
      return 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30';
  }
}

/**
 * Get human-readable relationship type label
 */
function getRelationshipLabel(type: string): string {
  switch (type) {
    case 'works_at':
      return 'Works at firm';
    case 'former_colleague':
      return 'Former colleague';
    case 'knows_decision_maker':
      return 'Knows decision maker';
    case 'industry_overlap':
      return 'Industry overlap';
    case 'geographic_proximity':
      return 'Geographic proximity';
    default:
      return type;
  }
}

export function ConnectionCard({ introPath }: ConnectionCardProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
      {/* Left side: Contact info */}
      <div className="flex-1 space-y-2">
        {/* Name */}
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base">{introPath.contact_name}</h3>
          {introPath.linkedin_url && (
            <a
              href={introPath.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="View LinkedIn profile"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Position and Company */}
        <p className="text-sm text-muted-foreground">
          {introPath.contact_position || 'Position unknown'} at{' '}
          {introPath.contact_company || 'Unknown company'}
        </p>

        {/* Team member badge */}
        <div>
          <Badge variant="outline" className="text-xs">
            via {introPath.team_member_name}
          </Badge>
        </div>

        {/* Path description */}
        <p className="text-xs text-muted-foreground mt-2">
          {introPath.path_description}
        </p>
      </div>

      {/* Right side: Strength indicator */}
      <div className="flex flex-col items-end gap-2 min-w-[100px]">
        {/* Strength badge */}
        <Badge className={getStrengthBadgeStyle(introPath.strength_label)}>
          {introPath.strength_label.charAt(0).toUpperCase() +
            introPath.strength_label.slice(1)}
        </Badge>

        {/* Relationship type */}
        <span className="text-xs text-muted-foreground text-right">
          {getRelationshipLabel(introPath.relationship_type)}
        </span>
      </div>
    </div>
  );
}
