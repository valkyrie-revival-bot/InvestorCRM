'use client';

/**
 * Global Search Component
 * Full-text search across all entities with quick navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, TrendingUp, User, CheckSquare, Calendar, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Search result type
interface SearchResult {
  type: 'investor' | 'interaction' | 'task' | 'meeting';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
}

// Props
interface GlobalSearchProps {
  trigger?: React.ReactNode;
}

export function GlobalSearch({ trigger }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Navigate based on type
    let path = '';
    switch (result.type) {
      case 'investor':
        path = `/investors/${result.id}`;
        break;
      case 'task':
        path = `/tasks`;
        break;
      case 'meeting':
        path = `/meetings`;
        break;
      case 'interaction':
        path = `/investors/${result.metadata?.investor_id || ''}`;
        break;
    }

    if (path) {
      router.push(path);
      setOpen(false);
      setQuery('');
      setResults([]);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'investor':
        return <TrendingUp className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'interaction':
        return <User className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'investor':
        return 'text-blue-500';
      case 'task':
        return 'text-green-500';
      case 'meeting':
        return 'text-purple-500';
      case 'interaction':
        return 'text-orange-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full md:w-64 justify-start">
            <Search className="h-4 w-4 mr-2" />
            Search...
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[600px]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search investors, tasks, meetings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* No Query */}
          {!query && !loading && (
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Start typing to search across all data
              </p>
            </div>
          )}

          {/* No Results */}
          {query && !loading && results.length === 0 && !error && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No results found for "{query}"
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${getTypeColor(result.type)}`}>
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {result.title}
                        </p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {result.type}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                      {result.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          {results.length > 0 && (
            <div className="text-center text-xs text-muted-foreground pt-2 border-t">
              Found {results.length} results
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
