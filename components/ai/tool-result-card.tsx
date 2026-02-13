'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ToolResultCardProps {
  toolName: string;
  result: any;
  state: string;
}

export function ToolResultCard({ toolName, result, state }: ToolResultCardProps) {
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
