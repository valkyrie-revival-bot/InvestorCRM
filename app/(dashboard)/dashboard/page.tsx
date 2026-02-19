import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvestors } from "@/app/actions/investors";
import { getTasks } from "@/app/actions/tasks";
import { computeIsStalled, type InvestorStage } from "@/lib/stage-definitions";
import { Users, TrendingUp, AlertTriangle, DollarSign, CalendarClock, BarChart3, CheckSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  // Fetch investor and task data in parallel
  const [investorResult, tasksResult] = await Promise.all([
    getInvestors(),
    getTasks({ status: 'pending', limit: 200 }),
  ]);

  if (investorResult.error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load dashboard data: {investorResult.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  const investors = investorResult.data || [];
  const pendingTasks = tasksResult.data || [];

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

  // Compute investor metrics
  const totalInvestors = investors.length;
  const terminalStages = ['Won', 'Lost', 'Passed', 'Delayed'];
  const activeInvestors = investors.filter(inv => !terminalStages.includes(inv.stage)).length;

  const stalledCount = investors.filter(inv =>
    computeIsStalled(inv.last_action_date, inv.stage as InvestorStage, 30, inv.stage_entry_date)
  ).length;

  const totalPipelineValue = investors.reduce((sum, inv) => sum + (inv.est_value || 0), 0);

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

  // Team member performance metrics (computed from investors)
  const teamMetrics = investors.reduce((acc, inv) => {
    const owner = inv.relationship_owner || 'Unassigned';
    if (!acc[owner]) {
      acc[owner] = { total: 0, active: 0, pipelineValue: 0 };
    }
    acc[owner].total += 1;
    if (!terminalStages.includes(inv.stage)) acc[owner].active += 1;
    acc[owner].pipelineValue += inv.est_value || 0;
    return acc;
  }, {} as Record<string, { total: number; active: number; pipelineValue: number }>);

  const teamRows = Object.entries(teamMetrics).sort((a, b) => b[1].active - a[1].active);

  // Next Actions task breakdown (from tasks table)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

  const meetingTasks = pendingTasks.filter(t =>
    t.title.toLowerCase().includes('meeting') ||
    t.title.toLowerCase().includes('call') ||
    t.title.toLowerCase().includes('zoom')
  );

  const followUpTasks = pendingTasks.filter(t => {
    if (!t.due_date) return false;
    return t.due_date <= todayStr;
  });

  const toBookTasks = pendingTasks.filter(t => {
    if (!t.due_date) return false;
    return t.due_date > todayStr && t.due_date <= threeDaysStr;
  });

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const hasNextActions = meetingTasks.length > 0 || followUpTasks.length > 0 || toBookTasks.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Pipeline Intelligence at a glance</p>
      </div>

      {/* My Next Actions — full-width card above metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-semibold">My Next Actions</CardTitle>
            <CardDescription>Tasks requiring attention</CardDescription>
          </div>
          <CheckSquare className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {!hasNextActions ? (
            <p className="text-sm text-muted-foreground py-2">You&apos;re all clear — no pending tasks due soon.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {/* Meetings Scheduled */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meetings Scheduled</h4>
                {meetingTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None</p>
                ) : (
                  meetingTasks.slice(0, 4).map(t => (
                    <Link key={t.id} href={`/investors/${t.investor_id}`} className="block">
                      <p className="text-sm hover:text-foreground text-foreground/80 truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.investor?.firm_name} · {t.due_date || 'No date'}</p>
                    </Link>
                  ))
                )}
              </div>

              {/* Follow-up Required */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-orange-400">Follow-up Required</h4>
                {followUpTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None overdue</p>
                ) : (
                  followUpTasks.slice(0, 4).map(t => (
                    <Link key={t.id} href={`/investors/${t.investor_id}`} className="block">
                      <p className="text-sm hover:text-foreground text-orange-400 truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.investor?.firm_name} · {t.due_date}</p>
                    </Link>
                  ))
                )}
              </div>

              {/* To Book */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To Book</h4>
                {toBookTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None in next 3 days</p>
                ) : (
                  toBookTasks.slice(0, 4).map(t => (
                    <Link key={t.id} href={`/investors/${t.investor_id}`} className="block">
                      <p className="text-sm hover:text-foreground text-foreground/80 truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.investor?.firm_name} · {t.due_date}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top row of 4 metric cards — all clickable */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/investors" className="block group">
          <Card className="transition-colors group-hover:border-primary/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvestors}</div>
              <p className="text-xs text-muted-foreground">in pipeline</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/investors" className="block group">
          <Card className="transition-colors group-hover:border-primary/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeInvestors}</div>
              <p className="text-xs text-muted-foreground">being worked</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/investors?stalled=true" className="block group">
          <Card className="transition-colors group-hover:border-primary/50 cursor-pointer">
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
        </Link>

        <Link href="/investors" className="block group">
          <Card className="transition-colors group-hover:border-primary/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
              <p className="text-xs text-muted-foreground">estimated</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Second row — Next Actions count + Stage Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/tasks" className="block group">
          <Card className="transition-colors group-hover:border-primary/50 cursor-pointer">
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
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stage Breakdown</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stageCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([stage, count]) => (
                  <Link
                    key={stage}
                    href={`/investors?stage=${encodeURIComponent(stage)}`}
                    className="flex items-center justify-between text-sm hover:text-foreground text-foreground/80 group"
                  >
                    <span className="text-muted-foreground group-hover:text-foreground truncate transition-colors">{stage}</span>
                    <span className="font-medium ml-2">{count}</span>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Member Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Team Performance</CardTitle>
            <CardDescription>Pipeline ownership by team member</CardDescription>
          </div>
          <Users className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Team Member</th>
                  <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Investors</th>
                  <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Active</th>
                  <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Pipeline Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {teamRows.map(([owner, metrics]) => (
                  <tr key={owner} className="hover:bg-muted/20">
                    <td className="py-2 font-medium">{owner}</td>
                    <td className="py-2 text-right text-muted-foreground">{metrics.total}</td>
                    <td className="py-2 text-right">
                      <span className={metrics.active > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        {metrics.active}
                      </span>
                    </td>
                    <td className="py-2 text-right text-muted-foreground">{formatCurrency(metrics.pipelineValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions row */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/investors">View Pipeline</Link>
        </Button>
      </div>
    </div>
  );
}
