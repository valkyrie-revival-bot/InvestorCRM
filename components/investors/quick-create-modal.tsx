'use client';

/**
 * Quick create modal for new investors
 * Collects only required fields: firm_name, stage, relationship_owner
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  investorCreateSchema,
  type InvestorCreateInput,
  INVESTOR_STAGES,
} from '@/lib/validations/investor-schema';
import { createInvestor } from '@/app/actions/investors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function QuickCreateModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvestorCreateInput>({
    resolver: zodResolver(investorCreateSchema),
    defaultValues: {
      firm_name: '',
      stage: 'Initial Contact',
      relationship_owner: '',
    },
  });

  const onSubmit = async (data: InvestorCreateInput) => {
    setIsSubmitting(true);
    setError(null);

    const result = await createInvestor(data);

    if ('error' in result) {
      setError(result.error || 'An error occurred');
      setIsSubmitting(false);
      return;
    }

    // Success - close modal and redirect to detail page
    setOpen(false);
    reset();
    setIsSubmitting(false);
    router.push(`/investors/${result.data.id}`);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form and error state when closing
        reset();
        setError(null);
      }
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Investor</Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Investor</DialogTitle>
            <DialogDescription>
              Add a new investor with basic information. You can fill in
              additional details on the investor page.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Firm Name */}
            <div className="space-y-2">
              <Label htmlFor="firm_name">
                Firm Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firm_name"
                {...register('firm_name')}
                placeholder="e.g., Acme Capital"
                autoFocus
                aria-invalid={!!errors.firm_name}
              />
              {errors.firm_name && (
                <p className="text-sm text-destructive">
                  {errors.firm_name.message}
                </p>
              )}
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <Label htmlFor="stage">
                Stage <span className="text-destructive">*</span>
              </Label>
              <select
                id="stage"
                {...register('stage')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-invalid={!!errors.stage}
              >
                {INVESTOR_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
              {errors.stage && (
                <p className="text-sm text-destructive">
                  {errors.stage.message}
                </p>
              )}
            </div>

            {/* Relationship Owner */}
            <div className="space-y-2">
              <Label htmlFor="relationship_owner">
                Relationship Owner <span className="text-destructive">*</span>
              </Label>
              <Input
                id="relationship_owner"
                {...register('relationship_owner')}
                placeholder="e.g., John Smith"
                aria-invalid={!!errors.relationship_owner}
              />
              {errors.relationship_owner && (
                <p className="text-sm text-destructive">
                  {errors.relationship_owner.message}
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Investor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
