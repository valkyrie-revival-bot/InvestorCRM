'use client';

/**
 * Company Intelligence Card
 * Displays Bright Data-scraped intelligence for an investor firm.
 * Auto-triggers a scrape on mount if no data exists (or data is stale).
 * Supports manual refresh.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Building2, Users, MapPin, Calendar, TrendingUp, DollarSign, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InvestorIntelligenceRow } from '@/app/actions/intelligence';

interface CompanyIntelligenceCardProps {
  investorId: string;
  firmName: string;
  /** Pass server-fetched initial data to avoid an extra client request on load */
  initialData?: InvestorIntelligenceRow | null;
}

export function CompanyIntelligenceCard({
  investorId,
  firmName,
  initialData,
}: CompanyIntelligenceCardProps) {
  const [data, setData] = useState<InvestorIntelligenceRow | null>(initialData ?? null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/investors/${investorId}/intelligence`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as InvestorIntelligenceRow | null;
  }, [investorId]);

  const triggerScrape = useCallback(async () => {
    setIsPolling(true);
    await fetch(`/api/investors/${investorId}/intelligence`, { method: 'POST' });
    // Poll every 3s until status is complete or error
    const interval = setInterval(async () => {
      const fresh = await fetchData();
      if (fresh) setData(fresh);
      if (fresh?.status === 'complete' || fresh?.status === 'error') {
        clearInterval(interval);
        setIsPolling(false);
        setLastRefreshed(new Date());
      }
    }, 3000);
    // Safety timeout after 90s
    setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
    }, 90000);
  }, [investorId, fetchData]);

  // On mount: auto-trigger if no data or status is pending/error
  useEffect(() => {
    const shouldTrigger =
      !data ||
      data.status === 'pending' ||
      (data.status === 'error' && !data.scraped_at);

    if (shouldTrigger) {
      triggerScrape();
    } else if (data?.status === 'processing') {
      // Already in flight — start polling
      setIsPolling(true);
      const interval = setInterval(async () => {
        const fresh = await fetchData();
        if (fresh) setData(fresh);
        if (fresh?.status === 'complete' || fresh?.status === 'error') {
          clearInterval(interval);
          setIsPolling(false);
          setLastRefreshed(new Date());
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    if (!isPolling) triggerScrape();
  };

  const isLoading = isPolling || data?.status === 'processing';
  const hasData = data?.status === 'complete';

  return (
    <div className="rounded-lg border bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Company Intelligence</h2>
          {data?.scraped_at && !isLoading && (
            <span className="text-xs text-muted-foreground">
              · {lastRefreshed
                ? `refreshed just now`
                : `scraped ${new Date(data.scraped_at).toLocaleDateString()}`}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 w-8 p-0"
          title="Refresh intelligence"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {/* Loading skeleton */}
      {isLoading && !hasData && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-4/5" />
          <div className="h-4 bg-muted rounded w-3/5" />
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 bg-muted rounded w-20" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && data?.status === 'error' && (
        <div className="text-sm text-muted-foreground text-center py-4">
          <p>Intelligence scrape failed.</p>
          {data.error_message?.includes('BRIGHT_DATA_API_KEY') ? (
            <p className="text-xs mt-1">Add <code className="bg-muted px-1 rounded">BRIGHT_DATA_API_KEY</code> to enable.</p>
          ) : (
            <p className="text-xs mt-1">{data.error_message}</p>
          )}
        </div>
      )}

      {/* Data */}
      {hasData && data && (
        <div className="space-y-5">
          {/* About */}
          {data.about && (
            <p className="text-sm text-muted-foreground leading-relaxed">{data.about}</p>
          )}

          {/* Investment thesis */}
          {data.investment_thesis && (
            <div className="rounded-md bg-muted/40 px-4 py-3 border-l-2 border-brand-gold">
              <p className="text-xs font-medium text-brand-gold mb-1">Investment Thesis</p>
              <p className="text-sm">{data.investment_thesis}</p>
            </div>
          )}

          {/* Key stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.aum_estimate && (
              <Stat icon={<DollarSign className="h-3.5 w-3.5" />} label="AUM" value={data.aum_estimate} />
            )}
            {data.headquarters && (
              <Stat icon={<MapPin className="h-3.5 w-3.5" />} label="HQ" value={data.headquarters} />
            )}
            {data.employee_count && (
              <Stat icon={<Users className="h-3.5 w-3.5" />} label="Team" value={data.employee_count} />
            )}
            {data.founded && (
              <Stat icon={<Calendar className="h-3.5 w-3.5" />} label="Founded" value={data.founded} />
            )}
          </div>

          {/* Industries */}
          {data.industries && data.industries.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Focus Areas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.industries.map(ind => (
                  <span
                    key={ind}
                    className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Investment portfolio */}
          {data.investments && data.investments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> Known Investments
              </p>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Company</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Amount</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.investments.slice(0, 15).map((inv, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 font-medium">
                          {inv.source_url ? (
                            <a
                              href={inv.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors inline-flex items-center gap-1"
                            >
                              {inv.name}
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                          ) : (
                            inv.name
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{inv.type ?? '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{inv.amount ?? '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{inv.date ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Source links */}
          <div className="flex flex-wrap gap-3 pt-1">
            {data.linkedin_url && (
              <a
                href={data.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" /> LinkedIn
              </a>
            )}
            {data.crunchbase_url && (
              <a
                href={data.crunchbase_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" /> Crunchbase
              </a>
            )}
            {data.website && (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" /> Website
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}
