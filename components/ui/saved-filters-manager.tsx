'use client';

/**
 * Saved Filters Manager Component
 * Manages saved filter configurations with load/save/delete
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import {
  getSavedFilters,
  trackFilterUsage,
  deleteSavedFilter,
  type SavedFilter,
} from '@/app/actions/saved-filters';
import type { FilterCondition } from './filter-builder';

interface SavedFiltersManagerProps {
  entityType: 'investor' | 'interaction' | 'task' | 'meeting';
  onLoadFilter: (conditions: FilterCondition[]) => void;
}

export function SavedFiltersManager({
  entityType,
  onLoadFilter,
}: SavedFiltersManagerProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [selectedFilterId, setSelectedFilterId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Load saved filters
  useEffect(() => {
    loadFilters();
  }, [entityType]);

  const loadFilters = async () => {
    setLoading(true);
    try {
      const result = await getSavedFilters(entityType);
      if (result.error) {
        console.error('Failed to load filters:', result.error);
      } else {
        setSavedFilters(result.data);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFilter = async (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (!filter) return;

    // Load filter conditions
    const conditions = filter.filter_config.conditions || [];
    onLoadFilter(conditions);

    // Track usage
    await trackFilterUsage(filterId);

    toast.success(`Loaded filter: ${filter.name}`);
    setSelectedFilterId(filterId);
  };

  const handleDeleteFilter = async (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this saved filter?')) {
      return;
    }

    setDeleting(filterId);
    try {
      const result = await deleteSavedFilter(filterId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Filter deleted');
        setSavedFilters(prev => prev.filter(f => f.id !== filterId));
        if (selectedFilterId === filterId) {
          setSelectedFilterId('');
        }
      }
    } catch (error) {
      toast.error('Failed to delete filter');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading saved filters...
      </div>
    );
  }

  if (savedFilters.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Saved Filters</h4>
        </div>

        <div className="space-y-2">
          {savedFilters.map(filter => (
            <div
              key={filter.id}
              className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
            >
              <button
                onClick={() => handleLoadFilter(filter.id)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{filter.name}</span>
                  {filter.is_public && (
                    <Badge variant="outline" className="text-xs">
                      Public
                    </Badge>
                  )}
                </div>
                {filter.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {filter.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>Used {filter.use_count} times</span>
                  {filter.last_used_at && (
                    <span>
                      Last: {new Date(filter.last_used_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDeleteFilter(filter.id, e)}
                disabled={deleting === filter.id}
                className="h-8 w-8 shrink-0"
              >
                {deleting === filter.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
