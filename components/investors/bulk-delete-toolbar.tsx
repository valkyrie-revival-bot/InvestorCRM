'use client';

/**
 * Bulk Delete Toolbar
 * Shows a toolbar when investors are selected for bulk operations
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BulkDeleteToolbarProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
  onDeleteComplete: () => void;
}

export function BulkDeleteToolbar({
  selectedIds,
  onClearSelection,
  onDeleteComplete,
}: BulkDeleteToolbarProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch('/api/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'investors',
          operation: 'delete',
          item_ids: Array.from(selectedIds),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        onClearSelection();
        onDeleteComplete();
      } else {
        toast.error(result.message || 'Failed to delete investors');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete investors');
    } finally {
      setIsDeleting(false);
      setShowDialog(false);
    }
  };

  if (selectedIds.size === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
        <div className="bg-background border border-border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedIds.size} investor{selectedIds.size !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={isDeleting}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Investors?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete {selectedIds.size} investor record{selectedIds.size !== 1 ? 's' : ''}.
              They will be moved to trash and can be recovered if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
