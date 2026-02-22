'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Check, X } from 'lucide-react';
import { updateInvestorField, createInvestor } from '@/app/actions/investors';
import { createContact } from '@/app/actions/contacts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ToolResultCardProps {
  toolName: string;
  result: any;
  state: string;
  toolCallId?: string;
}

export function ToolResultCard({ toolName, result, state, toolCallId }: ToolResultCardProps) {
  // Loading state
  if (state === 'partial-call') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Calling {toolName}...
        </span>
      </div>
    );
  }

  // Render based on tool type
  switch (toolName) {
    case 'queryPipeline':
      return <QueryPipelineResult result={result} />;
    case 'getInvestorDetail':
      return <InvestorDetailResult result={result} />;
    case 'strategyAdvisor':
      return <StrategyAdvisorResult result={result} />;
    case 'updateInvestor':
      return <UpdateInvestorConfirmation result={result} toolCallId={toolCallId} />;
    case 'logActivity':
      return <LogActivityResult result={result} />;
    case 'createInvestor':
      return <CreateInvestorConfirmation result={result} />;
    case 'createContact':
      return <CreateContactConfirmation result={result} />;
    case 'createMeeting':
      return <CreateMeetingResult result={result} />;
    default:
      return <UnknownToolResult toolName={toolName} result={result} />;
  }
}

function QueryPipelineResult({ result }: { result: any }) {
  const investors = result?.investors || [];
  const count = result?.count || investors.length;

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3">
      <div className="text-sm font-medium">
        {count} investor{count !== 1 ? 's' : ''} found
      </div>
      {result?.summary && (
        <p className="text-sm text-muted-foreground">{result.summary}</p>
      )}
      {investors.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 pr-4 text-left font-medium">Firm</th>
                <th className="pb-2 pr-4 text-left font-medium">Stage</th>
                <th className="pb-2 pr-4 text-left font-medium">Value</th>
                <th className="pb-2 pr-4 text-left font-medium">Days Inactive</th>
                <th className="pb-2 text-left font-medium">Conviction</th>
              </tr>
            </thead>
            <tbody>
              {investors.slice(0, 10).map((inv: any, idx: number) => (
                <tr
                  key={inv.id || idx}
                  className={cn(
                    'border-b border-border/50 last:border-0',
                    idx % 2 === 0 ? 'bg-muted/30' : 'bg-transparent'
                  )}
                >
                  <td className="py-2 pr-4">{inv.firm_name || '-'}</td>
                  <td className="py-2 pr-4">
                    <Badge variant="outline" className="text-xs">
                      {inv.stage || '-'}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">
                    {inv.est_value
                      ? `$${(inv.est_value / 1000000).toFixed(1)}M`
                      : '-'}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {inv.days_since_action !== undefined
                      ? `${inv.days_since_action}d`
                      : '-'}
                  </td>
                  <td className="py-2">{inv.conviction || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {investors.length > 10 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing 10 of {investors.length} results
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InvestorDetailResult({ result }: { result: any }) {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{result?.firm_name || 'Investor'}</CardTitle>
          {result?.stage && (
            <Badge variant="outline" className="text-xs">
              {result.stage}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Fields */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {result?.est_value && (
            <div>
              <span className="text-muted-foreground">Value:</span>{' '}
              <span className="font-medium">
                ${(result.est_value / 1000000).toFixed(1)}M
              </span>
            </div>
          )}
          {result?.conviction && (
            <div>
              <span className="text-muted-foreground">Conviction:</span>{' '}
              <span className="font-medium">{result.conviction}</span>
            </div>
          )}
          {result?.next_action && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Next Action:</span>{' '}
              <span className="font-medium">{result.next_action}</span>
            </div>
          )}
          {result?.next_action_date && (
            <div>
              <span className="text-muted-foreground">Due:</span>{' '}
              <span className="font-medium">
                {new Date(result.next_action_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Contacts */}
        {result?.contacts && result.contacts.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-medium">Contacts</div>
            <div className="space-y-1">
              {result.contacts.slice(0, 3).map((contact: any, idx: number) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  {contact.name}
                  {contact.is_primary && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        {result?.recent_activities && result.recent_activities.length > 0 && (
          <div>
            <div className="mb-2 text-sm font-medium">Recent Activity</div>
            <div className="space-y-1">
              {result.recent_activities.slice(0, 3).map((activity: any, idx: number) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  <span className="capitalize">{activity.type}</span>
                  {activity.created_at && (
                    <span className="ml-2 text-xs">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StrategyAdvisorResult({ result }: { result: any }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
      <div className="text-sm font-medium">Strategy Context</div>

      <div className="space-y-3 text-sm">
        {/* Current Stage */}
        {result?.current_stage && (
          <div>
            <span className="text-muted-foreground">Current Stage:</span>{' '}
            <Badge variant="outline" className="ml-2 text-xs">
              {result.current_stage}
            </Badge>
          </div>
        )}

        {/* Days in Stage */}
        {result?.days_in_stage !== undefined && (
          <div>
            <span className="text-muted-foreground">Days in Stage:</span>{' '}
            <span className="font-medium">{result.days_in_stage}</span>
          </div>
        )}

        {/* Strategy Notes */}
        {result?.current_strategy_notes && (
          <div>
            <div className="mb-1 text-muted-foreground">Current Strategy:</div>
            <div className="whitespace-pre-wrap rounded bg-background p-2 text-sm">
              {result.current_strategy_notes}
            </div>
          </div>
        )}

        {/* Key Objections */}
        {result?.key_objections && (
          <div>
            <div className="mb-1 text-muted-foreground">Key Objections:</div>
            <div className="whitespace-pre-wrap rounded bg-background p-2 text-sm">
              {result.key_objections}
            </div>
          </div>
        )}

        {/* Recent Activities Summary */}
        {result?.recent_activities_summary && (
          <div>
            <div className="mb-1 text-muted-foreground">Recent Activity:</div>
            <div className="text-sm">{result.recent_activities_summary}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function UpdateInvestorConfirmation({ result, toolCallId }: { result: any; toolCallId?: string }) {
  const [confirmationState, setConfirmationState] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  // Error states
  if (result?.status === 'error') {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
        <div className="font-medium text-destructive">Update Failed</div>
        <p className="mt-1 text-xs text-destructive/80">{result.message}</p>
      </div>
    );
  }

  // Clarification needed
  if (result?.status === 'clarification_needed') {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
        <div className="font-medium">Multiple Matches Found</div>
        <p className="mt-1 text-muted-foreground">{result.message}</p>
        {result.matches && (
          <ul className="mt-2 list-inside list-disc text-xs">
            {result.matches.map((match: string, idx: number) => (
              <li key={idx}>{match}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Confirmation required
  if (result?.status === 'confirmation_required') {
    const handleApprove = async () => {
      setIsProcessing(true);
      try {
        const updateResult = await updateInvestorField(
          result.investorId,
          result.field,
          result.newValue
        );

        if (updateResult.error) {
          toast.error('Update failed', { description: updateResult.error });
          setConfirmationState('rejected');
        } else {
          toast.success('Update applied', { description: `${result.firmName} updated successfully` });
          setConfirmationState('approved');
        }
      } catch (error) {
        toast.error('Update failed', { description: 'An unexpected error occurred' });
        setConfirmationState('rejected');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleReject = () => {
      setConfirmationState('rejected');
      toast.info('Update cancelled');
    };

    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium">Confirm Update</div>
          {confirmationState === 'approved' && (
            <Badge variant="default" className="gap-1 bg-green-600">
              <Check className="size-3" />
              Approved
            </Badge>
          )}
          {confirmationState === 'rejected' && (
            <Badge variant="outline" className="gap-1">
              <X className="size-3" />
              Rejected
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Firm:</span>{' '}
            <span className="font-medium">{result.firmName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Field:</span>{' '}
            <span className="font-medium">{result.field}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Change:</span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {result.currentValue || '(empty)'}
            </code>
            <span className="text-muted-foreground">→</span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {result.newValue}
            </code>
          </div>
          <div>
            <span className="text-muted-foreground">Reason:</span>{' '}
            <span className="italic">{result.reason}</span>
          </div>
        </div>

        {confirmationState === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Applying...
                </>
              ) : (
                'Approve'
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isProcessing}
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Unknown status
  return <UnknownToolResult toolName="updateInvestor" result={result} />;
}

function LogActivityResult({ result }: { result: any }) {
  if (result?.status === 'error') {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
        <div className="font-medium text-destructive">Activity Logging Failed</div>
        <p className="mt-1 text-xs text-destructive/80">{result.message}</p>
      </div>
    );
  }

  if (result?.status === 'clarification_needed') {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
        <div className="font-medium">Multiple Matches Found</div>
        <p className="mt-1 text-muted-foreground">{result.message}</p>
        {result.matches && (
          <ul className="mt-2 list-inside list-disc text-xs">
            {result.matches.map((match: string, idx: number) => (
              <li key={idx}>{match}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (result?.status === 'success') {
    return (
      <div className="rounded-lg border border-green-600/50 bg-green-600/10 p-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-green-600">
          <Check className="size-4" />
          Activity Logged
        </div>
        <p className="mt-1 text-xs">{result.message}</p>
      </div>
    );
  }

  return <UnknownToolResult toolName="logActivity" result={result} />;
}

function CreateInvestorConfirmation({ result }: { result: any }) {
  const router = useRouter();
  const [confirmationState, setConfirmationState] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  if (result?.status === 'error') {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
        <div className="font-medium text-destructive">Creation Failed</div>
        <p className="mt-1 text-xs text-destructive/80">{result.message}</p>
      </div>
    );
  }

  if (result?.status === 'confirmation_required') {
    const handleApprove = async () => {
      setIsProcessing(true);
      try {
        const createResult = await createInvestor({
          firm_name: result.firm_name,
          stage: result.stage,
          relationship_owner: result.relationship_owner,
        });

        if (createResult.error) {
          toast.error('Creation failed', { description: createResult.error });
          setConfirmationState('rejected');
        } else {
          toast.success('Investor created', { description: `${result.firm_name} added to pipeline` });
          setConfirmationState('approved');
          if (createResult.data?.id) {
            router.push(`/investors/${createResult.data.id}`);
          }
        }
      } catch {
        toast.error('Creation failed', { description: 'An unexpected error occurred' });
        setConfirmationState('rejected');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleReject = () => {
      setConfirmationState('rejected');
      toast.info('Creation cancelled');
    };

    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium">Create Investor</div>
          {confirmationState === 'approved' && (
            <Badge variant="default" className="gap-1 bg-green-600">
              <Check className="size-3" />
              Created
            </Badge>
          )}
          {confirmationState === 'rejected' && (
            <Badge variant="outline" className="gap-1">
              <X className="size-3" />
              Cancelled
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Firm:</span>{' '}
            <span className="font-medium">{result.firm_name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Stage:</span>{' '}
            <Badge variant="outline" className="ml-1 text-xs">{result.stage}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Owner:</span>{' '}
            <span className="font-medium">{result.relationship_owner}</span>
          </div>
          {result.est_value && (
            <div>
              <span className="text-muted-foreground">Est. Value:</span>{' '}
              <span className="font-medium">${(result.est_value / 1_000_000).toFixed(1)}M</span>
            </div>
          )}
          {result.possibleDuplicates?.length > 0 && (
            <div className="rounded bg-yellow-500/10 p-2 text-xs text-yellow-700 dark:text-yellow-400">
              ⚠ Similar firms exist: {result.possibleDuplicates.map((d: any) => d.firm_name).join(', ')}
            </div>
          )}
        </div>

        {confirmationState === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Approve'
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={handleReject} disabled={isProcessing} className="flex-1">
              Reject
            </Button>
          </div>
        )}
      </div>
    );
  }

  return <UnknownToolResult toolName="createInvestor" result={result} />;
}

function CreateContactConfirmation({ result }: { result: any }) {
  const [confirmationState, setConfirmationState] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  if (result?.status === 'error') {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
        <div className="font-medium text-destructive">Contact Creation Failed</div>
        <p className="mt-1 text-xs text-destructive/80">{result.message}</p>
      </div>
    );
  }

  if (result?.status === 'clarification_needed') {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
        <div className="font-medium">Multiple Matches Found</div>
        <p className="mt-1 text-muted-foreground">{result.message}</p>
        {result.matches && (
          <ul className="mt-2 list-inside list-disc text-xs">
            {result.matches.map((match: string, idx: number) => (
              <li key={idx}>{match}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (result?.status === 'confirmation_required') {
    const handleApprove = async () => {
      setIsProcessing(true);
      try {
        const contactResult = await createContact(result.investorId, {
          name: result.name,
          phone: result.phone,
          email: result.email,
          title: result.title,
          is_primary: result.is_primary,
        });

        if (contactResult.error) {
          toast.error('Contact creation failed', { description: contactResult.error });
          setConfirmationState('rejected');
        } else {
          toast.success('Contact added', { description: `${result.name} added to ${result.firmName}` });
          setConfirmationState('approved');
        }
      } catch {
        toast.error('Contact creation failed', { description: 'An unexpected error occurred' });
        setConfirmationState('rejected');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleReject = () => {
      setConfirmationState('rejected');
      toast.info('Contact creation cancelled');
    };

    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between">
          <div className="text-sm font-medium">Add Contact</div>
          {confirmationState === 'approved' && (
            <Badge variant="default" className="gap-1 bg-green-600">
              <Check className="size-3" />
              Added
            </Badge>
          )}
          {confirmationState === 'rejected' && (
            <Badge variant="outline" className="gap-1">
              <X className="size-3" />
              Cancelled
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Firm:</span>{' '}
            <span className="font-medium">{result.firmName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Name:</span>{' '}
            <span className="font-medium">{result.name}</span>
          </div>
          {result.phone && (
            <div>
              <span className="text-muted-foreground">Phone:</span>{' '}
              <span className="font-medium">{result.phone}</span>
            </div>
          )}
          {result.email && (
            <div>
              <span className="text-muted-foreground">Email:</span>{' '}
              <span className="font-medium">{result.email}</span>
            </div>
          )}
          {result.title && (
            <div>
              <span className="text-muted-foreground">Title:</span>{' '}
              <span className="font-medium">{result.title}</span>
            </div>
          )}
          {result.is_primary && (
            <Badge variant="secondary" className="text-xs">Primary Contact</Badge>
          )}
        </div>

        {confirmationState === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Approve'
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={handleReject} disabled={isProcessing} className="flex-1">
              Reject
            </Button>
          </div>
        )}
      </div>
    );
  }

  return <UnknownToolResult toolName="createContact" result={result} />;
}

function CreateMeetingResult({ result }: { result: any }) {
  if (result?.status === 'error') {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
        <div className="font-medium text-destructive">Meeting Logging Failed</div>
        <p className="mt-1 text-xs text-destructive/80">{result.message}</p>
      </div>
    );
  }

  if (result?.status === 'clarification_needed') {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
        <div className="font-medium">Multiple Matches Found</div>
        <p className="mt-1 text-muted-foreground">{result.message}</p>
        {result.matches && (
          <ul className="mt-2 list-inside list-disc text-xs">
            {result.matches.map((match: string, idx: number) => (
              <li key={idx}>{match}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (result?.status === 'success') {
    return (
      <div className="rounded-lg border border-green-600/50 bg-green-600/10 p-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-green-600">
          <Check className="size-4" />
          Meeting Logged
        </div>
        <p className="mt-1 text-xs">{result.message}</p>
      </div>
    );
  }

  return <UnknownToolResult toolName="createMeeting" result={result} />;
}

function UnknownToolResult({ toolName, result }: { toolName: string; result: any }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-sm font-medium text-muted-foreground">
        Tool: {toolName}
      </div>
      <pre className="overflow-x-auto rounded bg-background p-2 text-xs">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
