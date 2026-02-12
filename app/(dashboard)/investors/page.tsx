import { getInvestors } from '@/app/actions/investors';
import { InvestorListTable } from '@/components/investors/investor-list-table';
import { QuickCreateModal } from '@/components/investors/quick-create-modal';
import { Button } from '@/components/ui/button';

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

  const investors = result.data;

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

      {investors.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <p className="text-lg font-medium">No investors yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first investor record to get started.
            </p>
          </div>
        </div>
      ) : (
        <InvestorListTable investors={investors} />
      )}
    </div>
  );
}
