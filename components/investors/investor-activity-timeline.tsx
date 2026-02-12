'use client';

/**
 * InvestorActivityTimeline component
 * Displays a chronological activity feed with type filtering
 */

import { useState } from 'react';
import { Phone, Mail, Calendar, FileText, GitCommit, Pencil, X } from 'lucide-react';
import type { Activity } from '@/types/investors';

interface ActivityTimelineProps {
  activities: Activity[];
}

// Activity type configuration with icons and colors
const activityConfig: Record<string, { icon: typeof Phone; label: string; color: string }> = {
  call: { icon: Phone, label: 'Call', color: 'text-green-400' },
  email: { icon: Mail, label: 'Email', color: 'text-blue-400' },
  meeting: { icon: Calendar, label: 'Meeting', color: 'text-purple-400' },
  note: { icon: FileText, label: 'Note', color: 'text-zinc-400' },
  stage_change: { icon: GitCommit, label: 'Stage Change', color: 'text-amber-400' },
  field_update: { icon: Pencil, label: 'Update', color: 'text-cyan-400' },
};

/**
 * Format timestamp as relative time
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format field change metadata for field_update activities
 */
function formatFieldChange(metadata: Record<string, unknown> | null): string | null {
  if (!metadata || !metadata.field) return null;
  const field = String(metadata.field).replace(/_/g, ' ');
  const oldVal = metadata.old_value != null ? String(metadata.old_value) : 'empty';
  const newVal = metadata.new_value != null ? String(metadata.new_value) : 'empty';
  return `${field}: ${oldVal} → ${newVal}`;
}

export function InvestorActivityTimeline({ activities }: ActivityTimelineProps) {
  const [filterTypes, setFilterTypes] = useState<string[]>([]);

  // Toggle filter for activity type
  const toggleFilter = (type: string) => {
    setFilterTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Apply filter (empty array = show all)
  const filtered = filterTypes.length === 0
    ? activities
    : activities.filter(a => filterTypes.includes(a.activity_type));

  return (
    <div className="space-y-4">
      {/* Type filter buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(activityConfig).map(([type, config]) => {
          const Icon = config.icon;
          const isActive = filterTypes.length === 0 || filterTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? config.color : ''}`} />
              {config.label}
            </button>
          );
        })}
        {filterTypes.length > 0 && (
          <button
            onClick={() => setFilterTypes([])}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No activities to display
        </div>
      ) : (
        <div className="relative space-y-0 pl-6
          before:absolute before:left-[11px] before:top-3 before:h-[calc(100%-1.5rem)]
          before:w-px before:bg-border">
          {filtered.map((activity) => {
            const config = activityConfig[activity.activity_type] || activityConfig.note;
            const Icon = config.icon;
            const fieldChange = activity.activity_type === 'field_update'
              ? formatFieldChange(activity.metadata)
              : null;

            return (
              <div key={activity.id} className="relative pb-4">
                {/* Timeline dot with icon */}
                <div className={`absolute -left-6 flex h-6 w-6 items-center justify-center
                  rounded-full bg-background ring-2 ring-border`}>
                  <Icon className={`h-3 w-3 ${config.color}`} />
                </div>

                {/* Content card */}
                <div className="ml-2 rounded-lg border bg-card/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      {fieldChange && (
                        <p className="mt-1 text-xs text-muted-foreground font-mono">
                          {fieldChange}
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatRelativeTime(activity.created_at)}
                    </time>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
