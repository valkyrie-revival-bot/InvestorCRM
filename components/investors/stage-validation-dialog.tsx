'use client';

/**
 * Stage Validation Dialog
 * Shows exit checklist when advancing from a stage with exit criteria
 * User must confirm all items or choose to override
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateInvestorStage } from '@/app/actions/stage-transitions';
import type { ExitCriterion } from '@/lib/stage-definitions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface StageValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorId: string;
  investorName: string;
  fromStage: string;
  toStage: string;
  exitCriteria: ExitCriterion[];
  onSuccess: () => void; // Called after successful transition
  onOverride: () => void; // Called when user clicks Override button
}

export function StageValidationDialog({
  open,
  onOpenChange,
  investorId,
  investorName,
  fromStage,
  toStage,
  exitCriteria,
  onSuccess,
  onOverride,
}: StageValidationDialogProps) {
  const [checkedCriteria, setCheckedCriteria] = useState<Set<string>>(
    new Set()
  );
  const [isPending, startTransition] = useTransition();

  const allChecked = exitCriteria.every((criterion) =>
    checkedCriteria.has(criterion.id)
  );

  const handleCheckChange = (criterionId: string, checked: boolean) => {
    setCheckedCriteria((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(criterionId);
      } else {
        newSet.delete(criterionId);
      }
      return newSet;
    });
  };

  const handleAdvance = () => {
    startTransition(async () => {
      const result = await updateInvestorStage(investorId, toStage, {
        checklistConfirmed: true,
      });

      if (result.success) {
        toast.success('Stage updated successfully');
        onSuccess();
        onOpenChange(false);
        // Reset checked state for next time
        setCheckedCriteria(new Set());
      } else {
        toast.error(result.error || 'Failed to update stage');
      }
    });
  };

  const handleOverrideClick = () => {
    // Close this dialog and signal parent to open override dialog
    onOpenChange(false);
    onOverride();
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset checked state
    setCheckedCriteria(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Exit Checklist</DialogTitle>
          <DialogDescription>
            Confirm the following before advancing <strong>{investorName}</strong> from{' '}
            <strong>{fromStage}</strong> to <strong>{toStage}</strong>:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {exitCriteria.map((criterion) => {
            const isChecked = checkedCriteria.has(criterion.id);
            return (
              <div key={criterion.id} className="flex items-start gap-3">
                <Checkbox
                  id={criterion.id}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleCheckChange(criterion.id, checked === true)
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={criterion.id}
                    className={`cursor-pointer font-medium leading-tight ${
                      isChecked ? 'opacity-70 line-through' : ''
                    }`}
                  >
                    {criterion.label}
                  </Label>
                  <p className="text-muted-foreground text-sm mt-1">
                    {criterion.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleOverrideClick}
              disabled={isPending}
            >
              Override
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
          <Button
            onClick={handleAdvance}
            disabled={!allChecked || isPending}
          >
            {isPending ? 'Advancing...' : 'Advance Stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
