import { getInvestors } from '@/app/actions/investors';
import { computeIsStalled } from '@/lib/stage-definitions';
import { RealtimeInvestorWrapper } from '@/components/investors/realtime-investor-wrapper';
import { QuickCreateModal } from '@/components/investors/quick-create-modal';

export default async function InvestorsPage() {
  const result = await getInvestors();

  // Handle error state
  if ('error' in result) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Error loading investors</p>
          <p className="text-sm text-muted-foreground">{result.error}</p>
        </div>
      </div>
    );
  }

  // Compute stalled status dynamically for all investors
  const investorsWithStalled = result.data.map(inv => ({
    ...inv,
    stalled: computeIsStalled(inv.last_action_date, inv.stage as any, 30, inv.stage_entry_date),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investor Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your fundraising relationships
          </p>
        </div>
        <QuickCreateModal />
      </div>

      {investorsWithStalled.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center space-y-4">
            <div>
              <p className="text-lg font-medium">No investors yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first investor record to get started.
              </p>
            </div>
            <QuickCreateModal />
          </div>
        </div>
      ) : (
        <RealtimeInvestorWrapper initialInvestors={investorsWithStalled} />
      )}
    </div>
  );
}
