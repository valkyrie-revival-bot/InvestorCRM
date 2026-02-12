'use client';

/**
 * InvestorFormSections - Organizes investor fields into collapsible sections
 * Sections: Basic Info, Pipeline Status, Strategy, Next Steps
 */

import { InlineEditField } from './inline-edit-field';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { InvestorWithContacts } from '@/types/investors';
import { INVESTOR_STAGES, ALLOCATOR_TYPES } from '@/lib/validations/investor-schema';

interface InvestorFormSectionsProps {
  investor: InvestorWithContacts;
}

export function InvestorFormSections({ investor }: InvestorFormSectionsProps) {
  // Section open/closed state (all default open)
  const [basicOpen, setBasicOpen] = useState(true);
  const [pipelineOpen, setPipelineOpen] = useState(true);
  const [strategyOpen, setStrategyOpen] = useState(true);
  const [nextStepsOpen, setNextStepsOpen] = useState(true);

  // Convert stage and allocator type enums to select options
  const stageOptions = INVESTOR_STAGES.map((stage) => ({
    value: stage,
    label: stage,
  }));

  const allocatorTypeOptions = ALLOCATOR_TYPES.map((type) => ({
    value: type,
    label: type,
  }));

  const convictionOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
  ];

  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
  ];

  return (
    <div className="space-y-4">
      {/* Section 1: Basic Info */}
      <Collapsible open={basicOpen} onOpenChange={setBasicOpen}>
        <div className="rounded-lg border bg-card">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Basic Info
            </h2>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${basicOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InlineEditField
                  label="Firm Name"
                  field="firm_name"
                  value={investor.firm_name}
                  investorId={investor.id}
                  type="text"
                  required
                />
                <InlineEditField
                  label="Relationship Owner"
                  field="relationship_owner"
                  value={investor.relationship_owner}
                  investorId={investor.id}
                  type="text"
                  required
                />
                <InlineEditField
                  label="Partner / Source"
                  field="partner_source"
                  value={investor.partner_source}
                  investorId={investor.id}
                  type="text"
                />
                <InlineEditField
                  label="Allocator Type"
                  field="allocator_type"
                  value={investor.allocator_type}
                  investorId={investor.id}
                  type="select"
                  options={allocatorTypeOptions}
                  placeholder="Select allocator type"
                />
                <InlineEditField
                  label="Est. Value"
                  field="est_value"
                  value={investor.est_value}
                  investorId={investor.id}
                  type="number"
                  placeholder="$0"
                />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 2: Pipeline Status */}
      <Collapsible open={pipelineOpen} onOpenChange={setPipelineOpen}>
        <div className="rounded-lg border bg-card">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pipeline Status
            </h2>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${pipelineOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InlineEditField
                  label="Stage"
                  field="stage"
                  value={investor.stage}
                  investorId={investor.id}
                  type="select"
                  options={stageOptions}
                  required
                />
                <InlineEditField
                  label="Entry Date"
                  field="entry_date"
                  value={investor.entry_date}
                  investorId={investor.id}
                  type="date"
                />
                <InlineEditField
                  label="Last Action Date"
                  field="last_action_date"
                  value={investor.last_action_date}
                  investorId={investor.id}
                  type="date"
                />
                <InlineEditField
                  label="Stalled"
                  field="stalled"
                  value={investor.stalled}
                  investorId={investor.id}
                  type="boolean"
                />
                <InlineEditField
                  label="Internal Conviction"
                  field="internal_conviction"
                  value={investor.internal_conviction}
                  investorId={investor.id}
                  type="select"
                  options={convictionOptions}
                  placeholder="Select conviction level"
                />
                <InlineEditField
                  label="Internal Priority"
                  field="internal_priority"
                  value={investor.internal_priority}
                  investorId={investor.id}
                  type="select"
                  options={priorityOptions}
                  placeholder="Select priority level"
                />
                <div className="md:col-span-2">
                  <InlineEditField
                    label="Investment Committee Timing"
                    field="investment_committee_timing"
                    value={investor.investment_committee_timing}
                    investorId={investor.id}
                    type="text"
                    placeholder="e.g., Q2 2026"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 3: Strategy */}
      <Collapsible open={strategyOpen} onOpenChange={setStrategyOpen}>
        <div className="rounded-lg border bg-card">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Strategy
            </h2>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${strategyOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InlineEditField
                    label="Current Strategy Notes"
                    field="current_strategy_notes"
                    value={investor.current_strategy_notes}
                    investorId={investor.id}
                    type="textarea"
                    placeholder="Current strategy and approach"
                  />
                </div>
                <InlineEditField
                  label="Current Strategy Date"
                  field="current_strategy_date"
                  value={investor.current_strategy_date}
                  investorId={investor.id}
                  type="date"
                />
                <div></div> {/* Spacer */}
                <div className="md:col-span-2">
                  <InlineEditField
                    label="Last Strategy Notes"
                    field="last_strategy_notes"
                    value={investor.last_strategy_notes}
                    investorId={investor.id}
                    type="textarea"
                    placeholder="Previous strategy (historical)"
                  />
                </div>
                <InlineEditField
                  label="Last Strategy Date"
                  field="last_strategy_date"
                  value={investor.last_strategy_date}
                  investorId={investor.id}
                  type="date"
                />
                <div></div> {/* Spacer */}
                <div className="md:col-span-2">
                  <InlineEditField
                    label="Key Objection / Risk"
                    field="key_objection_risk"
                    value={investor.key_objection_risk}
                    investorId={investor.id}
                    type="textarea"
                    placeholder="Primary concerns or obstacles"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Section 4: Next Steps */}
      <Collapsible open={nextStepsOpen} onOpenChange={setNextStepsOpen}>
        <div className="rounded-lg border bg-card">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Next Steps
            </h2>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${nextStepsOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InlineEditField
                    label="Next Action"
                    field="next_action"
                    value={investor.next_action}
                    investorId={investor.id}
                    type="text"
                    placeholder="What's the next step?"
                  />
                </div>
                <InlineEditField
                  label="Next Action Date"
                  field="next_action_date"
                  value={investor.next_action_date}
                  investorId={investor.id}
                  type="date"
                />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
