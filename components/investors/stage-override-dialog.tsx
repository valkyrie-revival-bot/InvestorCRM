'use client';

/**
 * Stage Override Dialog
 * Allows user to bypass exit criteria with a mandatory reason (min 10 chars)
 * Requires explicit confirmation checkbox
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateInvestorStage } from '@/app/actions/stage-transitions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface StageOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorId: string;
  investorName: string;
  fromStage: string;
  toStage: string;
  onSuccess: () => void; // Called after successful override
}

export function StageOverrideDialog({
  open,
  onOpenChange,
  investorId,
  investorName,
  fromStage,
  toStage,
  onSuccess,
}: StageOverrideDialogProps) {
  const [overrideReason, setOverrideReason] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isValid = overrideReason.trim().length >= 10 && confirmChecked;

  const handleOverride = () => {
    if (!isValid) return;

    startTransition(async () => {
      const result = await updateInvestorStage(investorId, toStage, {
        overrideReason: overrideReason.trim(),
      });

      if (result.success) {
        toast.warning('Stage advanced with override');
        onSuccess();
        onOpenChange(false);
        // Reset state for next time
        setOverrideReason('');
        setConfirmChecked(false);
      } else {
        toast.error(result.error || 'Failed to override stage');
      }
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset state
    setOverrideReason('');
    setConfirmChecked(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Override Stage Validation
          </DialogTitle>
          <DialogDescription>
            Exit criteria for <strong>{fromStage}</strong> have not been met. You
            may override to advance <strong>{investorName}</strong> to{' '}
            <strong>{toStage}</strong>, but a reason is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="override-reason">
              Override Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="override-reason"
              placeholder="Explain why this override is necessary... (minimum 10 characters)"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-muted-foreground text-xs">
              {overrideReason.trim().length}/10 characters minimum
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/5 p-3">
            <Checkbox
              id="confirm-override"
              checked={confirmChecked}
              onCheckedChange={(checked) => setConfirmChecked(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="confirm-override"
              className="cursor-pointer text-sm font-medium leading-tight"
            >
              I confirm this override is necessary and accept responsibility
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleOverride}
            disabled={!isValid || isPending}
          >
            {isPending ? 'Overriding...' : 'Override and Advance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
