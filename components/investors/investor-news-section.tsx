'use client';

/**
 * Investor News & Intelligence Section
 * Fetches recent news articles about the investor firm via NewsAPI proxy
 */

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: string;
}

interface InvestorNewsSectionProps {
  firmName: string;
}

export function InvestorNewsSection({ firmName }: InvestorNewsSectionProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchNews = useCallback(async () => {
    if (!firmName) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/news?query=${encodeURIComponent(firmName)}`
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch news');
      }
      const data = await response.json();
      setArticles(data.articles || []);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setIsLoading(false);
    }
  }, [firmName]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">News & Intelligence</h2>
          {lastFetched && (
            <span className="text-xs text-muted-foreground">
              · updated {lastFetched.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchNews}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          {error === 'News API not configured' ? (
            <p>Add <code className="text-xs bg-muted px-1 rounded">NEWS_API_KEY</code> to your environment to enable news.</p>
          ) : (
            <p>{error}</p>
          )}
        </div>
      ) : isLoading && articles.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse space-y-1.5">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Newspaper className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No recent news found for {firmName}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article, i) => (
            <div key={i} className="space-y-1 group">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 text-sm font-medium hover:text-primary transition-colors"
              >
                <span className="leading-snug">{article.title}</span>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              {article.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{article.description}</p>
              )}
              <p className="text-xs text-muted-foreground/60">
                {article.source} · {formatDate(article.publishedAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
