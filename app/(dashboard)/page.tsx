import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvestors } from "@/app/actions/investors";
import { computeIsStalled, type InvestorStage } from "@/lib/stage-definitions";
import { Users, TrendingUp, AlertTriangle, DollarSign, CalendarClock, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  // Fetch real investor data
  const result = await getInvestors();
  if (result.error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load dashboard data: {result.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  const investors = result.data || [];

  // Handle empty state
  if (investors.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Pipeline Intelligence at a glance</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="mx-auto size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No investors yet</h3>
              <p className="text-muted-foreground mb-6">Get started by creating your first investor record</p>
              <Button asChild>
                <Link href="/investors">Go to Pipeline</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compute metrics
  const totalInvestors = investors.length;

  const terminalStages = ['Won', 'Lost', 'Passed', 'Delayed'];
  const activeInvestors = investors.filter(inv => !terminalStages.includes(inv.stage)).length;

  const stalledCount = investors.filter(inv =>
    computeIsStalled(inv.last_action_date, inv.stage as InvestorStage)
  ).length;

  const totalPipelineValue = investors.reduce((sum, inv) => sum + (inv.est_value || 0), 0);

  // Next actions due within 7 days
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextActionsDue = investors.filter(inv => {
    if (!inv.next_action_date) return false;
    const actionDate = new Date(inv.next_action_date);
    return actionDate >= now && actionDate <= sevenDaysFromNow;
  }).length;

  // Stage breakdown
  const stageCounts = investors.reduce((acc, inv) => {
    acc[inv.stage] = (acc[inv.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Format large numbers
  const formatCompact = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${formatCompact(value)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Pipeline Intelligence at a glance</p>
      </div>

      {/* Top row of 4 metric cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvestors}</div>
            <p className="text-xs text-muted-foreground">in pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInvestors}</div>
            <p className="text-xs text-muted-foreground">being worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stalled</CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stalledCount > 0 ? 'text-orange-400' : ''}`}>
              {stalledCount}
            </div>
            <p className="text-xs text-muted-foreground">needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
            <p className="text-xs text-muted-foreground">estimated</p>
          </CardContent>
        </Card>
      </div>

      {/* Second row of 2 cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Actions Due</CardTitle>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${nextActionsDue > 0 ? 'text-brand-primary' : ''}`}>
              {nextActionsDue}
            </div>
            <p className="text-xs text-muted-foreground">within 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stage Breakdown</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stageCounts)
                .sort((a, b) => b[1] - a[1]) // Sort by count descending
                .slice(0, 5) // Show top 5 stages
                .map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{stage}</span>
                    <span className="font-medium ml-2">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions row */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/investors">View Pipeline</Link>
        </Button>
      </div>
    </div>
  );
}
